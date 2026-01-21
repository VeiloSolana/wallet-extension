import { VersionedTransaction } from "@solana/web3.js";
import { BaseSwapProvider } from "./BaseSwapProvider";
import type {
  SwapParams,
  SwapQuote,
  SwapProviderType,
  SwapRoute,
  SwapRouteHop,
} from "../types";
import { SWAP_CONFIG, getTokenDecimals, toRawAmount } from "../config";

// Jupiter API response types
interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: JupiterRoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

interface JupiterRoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded VersionedTransaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

/**
 * Jupiter DEX aggregator provider.
 * Uses Jupiter Quote API v6 for best routes across Solana DEXes.
 */
export class JupiterProvider extends BaseSwapProvider {
  readonly providerType: SwapProviderType = "jupiter";
  private readonly apiKey: string;

  constructor() {
    const config = SWAP_CONFIG.providers.jupiter;
    super(config.apiEndpoint || "https://lite-api.jup.ag/swap/v1");

    const apiKey = import.meta.env.VITE_JUPITER_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_JUPITER_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
    };
  }

  /**
   * Get a quote from Jupiter for the specified swap parameters.
   */
  async getQuote(params: SwapParams): Promise<SwapQuote> {
    const { inputMint, outputMint, amount, slippageBps } = params;

    // Convert human-readable amount to raw amount
    const inputDecimals = getTokenDecimals(inputMint);
    const rawAmount = toRawAmount(amount, inputDecimals);

    // Handle native SOL mint - Jupiter uses wrapped SOL address
    const jupiterInputMint = this.normalizeSOLMint(inputMint);
    const jupiterOutputMint = this.normalizeSOLMint(outputMint);

    // Build query URL
    const queryParams = new URLSearchParams({
      inputMint: jupiterInputMint,
      outputMint: jupiterOutputMint,
      amount: rawAmount,
      slippageBps: slippageBps.toString(),
      swapMode: "ExactIn",
    });

    const response = await fetch(`${this.apiEndpoint}/quote?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter quote failed: ${errorText}`);
    }

    const quoteResponse: JupiterQuoteResponse = await response.json();

    // Convert Jupiter response to our SwapQuote format
    return this.convertQuoteResponse(quoteResponse, params);
  }

  /**
   * Build a versioned transaction for the swap using Jupiter's swap endpoint.
   */
  async buildSwapTransaction(
    params: SwapParams,
    quote: SwapQuote,
  ): Promise<VersionedTransaction> {
    if (!quote.rawQuote) {
      throw new Error("Quote does not contain raw Jupiter quote data");
    }

    const { userPublicKey } = params;

    if (!userPublicKey) {
      throw new Error("User public key is required to build swap transaction");
    }

    const response = await fetch(`${this.apiEndpoint}/swap`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        quoteResponse: quote.rawQuote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter swap transaction failed: ${errorText}`);
    }

    const swapResponse: JupiterSwapResponse = await response.json();

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(
      swapResponse.swapTransaction,
      "base64",
    );
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    return transaction;
  }

  /**
   * Convert Jupiter quote response to our standard SwapQuote format.
   */
  private convertQuoteResponse(
    response: JupiterQuoteResponse,
    params: SwapParams,
  ): SwapQuote {
    // Build route info from Jupiter's route plan
    const routes: SwapRoute[] = [
      {
        inAmount: response.inAmount,
        outAmount: response.outAmount,
        priceImpactPct: parseFloat(response.priceImpactPct),
        marketInfos: response.routePlan.map(
          (plan): SwapRouteHop => ({
            inputMint: plan.swapInfo.inputMint,
            outputMint: plan.swapInfo.outputMint,
            ammKey: plan.swapInfo.ammKey,
            label: plan.swapInfo.label,
            inputAmount: plan.swapInfo.inAmount,
            outputAmount: plan.swapInfo.outAmount,
            feeAmount: plan.swapInfo.feeAmount,
            feeMint: plan.swapInfo.feeMint,
          }),
        ),
      },
    ];

    // Calculate minimum received after slippage
    const minimumReceived = this.calculateMinimumReceived(
      response.outAmount,
      params.slippageBps,
    );

    // Estimate network fee (approximately 5000 lamports for a typical swap)
    const estimatedNetworkFee = "5000";

    // Calculate protocol fee from route (sum of all swap fees)
    const protocolFee = response.routePlan.reduce((sum, plan) => {
      return sum + BigInt(plan.swapInfo.feeAmount);
    }, 0n);

    return {
      inputAmount: response.inAmount,
      outputAmount: response.outAmount,
      minimumReceived,
      priceImpact: parseFloat(response.priceImpactPct),
      route: routes,
      provider: this.providerType,
      fees: {
        networkFee: estimatedNetworkFee,
        protocolFee: protocolFee.toString(),
      },
      rawQuote: response, // Store raw quote for building transaction
    };
  }

  /**
   * Normalize SOL mint address for Jupiter API.
   * Jupiter uses wrapped SOL address instead of native SOL.
   */
  private normalizeSOLMint(mintAddress: string): string {
    // Native SOL is represented as PublicKey.default (all zeros) or "SOL"
    const nativeSolAddresses = [
      "11111111111111111111111111111111", // PublicKey.default
      "So11111111111111111111111111111111111111111", // Sometimes used
    ];

    if (nativeSolAddresses.includes(mintAddress)) {
      // Return wrapped SOL address for Jupiter
      return "So11111111111111111111111111111111111111112";
    }

    return mintAddress;
  }
}
