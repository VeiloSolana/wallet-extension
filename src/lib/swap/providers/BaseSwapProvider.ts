import { VersionedTransaction } from "@solana/web3.js";
import type {
  ISwapProvider,
  SwapParams,
  SwapQuote,
  SwapProviderType,
} from "../types";
import { getTokenDecimals, toRawAmount, fromRawAmount } from "../config";

/**
 * Abstract base class for swap providers.
 * Implements common functionality and defines the interface for concrete providers.
 */
export abstract class BaseSwapProvider implements ISwapProvider {
  abstract readonly providerType: SwapProviderType;
  protected readonly apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Get a quote for swapping tokens.
   * Must be implemented by concrete providers.
   */
  abstract getQuote(params: SwapParams): Promise<SwapQuote>;

  /**
   * Build the transaction for executing a swap.
   * Must be implemented by concrete providers.
   */
  abstract buildSwapTransaction(
    params: SwapParams,
    quote: SwapQuote
  ): Promise<VersionedTransaction>;

  /**
   * Get the exchange rate between two tokens.
   * Returns the output amount for 1 unit of input.
   */
  async getRate(
    inputMint: string,
    outputMint: string,
    amount: string = "1"
  ): Promise<string> {
    const inputDecimals = getTokenDecimals(inputMint);
    const outputDecimals = getTokenDecimals(outputMint);

    // Get quote for the specified amount
    const quote = await this.getQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps: 50, // Use default slippage for rate query
      userPublicKey: "", // Not needed for rate query
    });

    // Calculate rate: output per input
    const inputRaw = BigInt(quote.inputAmount);
    const outputRaw = BigInt(quote.outputAmount);

    if (inputRaw === 0n) return "0";

    // Normalize to get rate per 1 input token
    const scale = BigInt(Math.pow(10, 18)); // High precision
    const normalizedRate = (outputRaw * scale) / inputRaw;
    const rateDecimalAdjust = BigInt(Math.pow(10, inputDecimals - outputDecimals + 18));
    const adjustedRate = normalizedRate * BigInt(Math.pow(10, inputDecimals)) / rateDecimalAdjust;

    return fromRawAmount(adjustedRate.toString(), inputDecimals);
  }

  /**
   * Convert human-readable amount to raw amount for the given mint.
   */
  protected toRaw(amount: string, mintAddress: string): string {
    const decimals = getTokenDecimals(mintAddress);
    return toRawAmount(amount, decimals);
  }

  /**
   * Convert raw amount to human-readable for the given mint.
   */
  protected fromRaw(rawAmount: string, mintAddress: string): string {
    const decimals = getTokenDecimals(mintAddress);
    return fromRawAmount(rawAmount, decimals);
  }

  /**
   * Calculate minimum received after slippage.
   */
  protected calculateMinimumReceived(
    outputAmount: string,
    slippageBps: number
  ): string {
    const output = BigInt(outputAmount);
    const slippageMultiplier = BigInt(10000 - slippageBps);
    const minimum = (output * slippageMultiplier) / BigInt(10000);
    return minimum.toString();
  }
}
