import { Keypair } from "@solana/web3.js";
import type {
  SwapParams,
  SwapQuote,
  SwapResult,
  ISwapProvider,
  SwapProviderType,
} from "./types";
import { SwapProviderFactory } from "./providers";
import { submitSwapTransaction } from "./transactionSubmitter";
import { fromRawAmount, getTokenDecimals } from "./config";

/**
 * Main swap service that orchestrates the swap flow:
 * 1. Get quote from provider
 * 2. Build transaction
 * 3. Sign with wallet
 * 4. Submit transaction
 */
export class SwapService {
  private provider: ISwapProvider;

  constructor(providerType?: SwapProviderType) {
    this.provider = providerType
      ? SwapProviderFactory.getProvider(providerType)
      : SwapProviderFactory.getDefaultProvider();
  }

  /**
   * Get a quote for the swap.
   */
  async getQuote(params: SwapParams): Promise<SwapQuote> {
    return this.provider.getQuote(params);
  }

  /**
   * Get the best quote across all enabled providers.
   */
  async getBestQuote(
    params: SwapParams
  ): Promise<{ provider: ISwapProvider; quote: SwapQuote }> {
    return SwapProviderFactory.getBestQuote(params);
  }

  /**
   * Get the exchange rate between two tokens.
   */
  async getRate(
    inputMint: string,
    outputMint: string,
    amount: string = "1"
  ): Promise<string> {
    return this.provider.getRate(inputMint, outputMint, amount);
  }

  /**
   * Execute a swap with the given parameters and keypair.
   * This is the main entry point for performing a swap.
   */
  async executeSwap(params: SwapParams, keypair: Keypair): Promise<SwapResult> {
    try {
      console.log("🔄 Starting swap execution...", {
        input: params.inputMint,
        output: params.outputMint,
        amount: params.amount,
      });

      // 1. Get quote
      console.log("📊 Getting quote...");
      const quote = await this.getQuote(params);
      console.log("📊 Quote received:", {
        inputAmount: quote.inputAmount,
        outputAmount: quote.outputAmount,
        priceImpact: quote.priceImpact,
      });

      // 2. Build transaction
      console.log("🔨 Building transaction...");
      const transaction = await this.provider.buildSwapTransaction(
        params,
        quote
      );

      // 3. Sign transaction
      console.log("✍️ Signing transaction...");
      transaction.sign([keypair]);

      // 4. Submit transaction
      console.log("📤 Submitting transaction...");
      const txSignature = await submitSwapTransaction(transaction);
      console.log("✅ Transaction submitted:", txSignature);

      // Calculate human-readable amounts for result
      const inputDecimals = getTokenDecimals(params.inputMint);
      const outputDecimals = getTokenDecimals(params.outputMint);

      return {
        success: true,
        txSignature,
        inputSpent: fromRawAmount(quote.inputAmount, inputDecimals),
        outputReceived: fromRawAmount(quote.outputAmount, outputDecimals),
      };
    } catch (error: any) {
      console.error("❌ Swap failed:", error);
      return {
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: error.message || "Swap failed",
      };
    }
  }

  /**
   * Execute a swap using the best available quote.
   * Automatically selects the provider with the best rate.
   */
  async executeSwapWithBestQuote(
    params: SwapParams,
    keypair: Keypair
  ): Promise<SwapResult> {
    try {
      console.log("🔄 Starting swap with best quote...");

      // 1. Get best quote across all providers
      console.log("📊 Getting best quote across providers...");
      const { provider, quote } = await this.getBestQuote(params);
      console.log(
        `📊 Best quote from ${provider.providerType}:`,
        {
          inputAmount: quote.inputAmount,
          outputAmount: quote.outputAmount,
          priceImpact: quote.priceImpact,
        }
      );

      // 2. Build transaction using the winning provider
      console.log("🔨 Building transaction...");
      const transaction = await provider.buildSwapTransaction(params, quote);

      // 3. Sign transaction
      console.log("✍️ Signing transaction...");
      transaction.sign([keypair]);

      // 4. Submit transaction
      console.log("📤 Submitting transaction...");
      const txSignature = await submitSwapTransaction(transaction);
      console.log("✅ Transaction submitted:", txSignature);

      // Calculate human-readable amounts for result
      const inputDecimals = getTokenDecimals(params.inputMint);
      const outputDecimals = getTokenDecimals(params.outputMint);

      return {
        success: true,
        txSignature,
        inputSpent: fromRawAmount(quote.inputAmount, inputDecimals),
        outputReceived: fromRawAmount(quote.outputAmount, outputDecimals),
      };
    } catch (error: any) {
      console.error("❌ Swap failed:", error);
      return {
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: error.message || "Swap failed",
      };
    }
  }

  /**
   * Get the current provider type.
   */
  getProviderType(): SwapProviderType {
    return this.provider.providerType;
  }

  /**
   * Switch to a different provider.
   */
  setProvider(providerType: SwapProviderType): void {
    this.provider = SwapProviderFactory.getProvider(providerType);
  }
}

// Default swap service instance
let defaultSwapService: SwapService | null = null;

/**
 * Get the default swap service instance.
 * Creates one if it doesn't exist.
 */
export function getSwapService(): SwapService {
  if (!defaultSwapService) {
    defaultSwapService = new SwapService();
  }
  return defaultSwapService;
}
