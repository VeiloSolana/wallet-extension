import type { ISwapProvider, SwapParams, SwapQuote, SwapProviderType } from "../types";
import { SWAP_CONFIG } from "../config";
import { JupiterProvider } from "./JupiterProvider";

// Lazy-loaded provider instances
const providerInstances: Partial<Record<SwapProviderType, ISwapProvider>> = {};

/**
 * Factory for creating and managing swap providers.
 * Supports multiple DEX aggregators and can compare quotes across them.
 */
export class SwapProviderFactory {
  /**
   * Get a provider instance by type.
   * Creates the instance lazily and caches it.
   */
  static getProvider(type: SwapProviderType): ISwapProvider {
    // Check if provider is enabled
    const config = SWAP_CONFIG.providers[type];
    if (!config?.enabled) {
      throw new Error(`Swap provider "${type}" is not enabled`);
    }

    // Return cached instance or create new one
    if (!providerInstances[type]) {
      providerInstances[type] = this.createProvider(type);
    }

    return providerInstances[type]!;
  }

  /**
   * Get the default provider based on config.
   */
  static getDefaultProvider(): ISwapProvider {
    return this.getProvider(SWAP_CONFIG.defaultProvider);
  }

  /**
   * Get all enabled providers.
   */
  static getEnabledProviders(): ISwapProvider[] {
    const providers: ISwapProvider[] = [];

    for (const [type, config] of Object.entries(SWAP_CONFIG.providers)) {
      if (config.enabled) {
        try {
          providers.push(this.getProvider(type as SwapProviderType));
        } catch {
          // Skip providers that fail to initialize
        }
      }
    }

    return providers;
  }

  /**
   * Get the best quote across all enabled providers.
   * Queries all providers in parallel and returns the one with the best output.
   */
  static async getBestQuote(
    params: SwapParams
  ): Promise<{ provider: ISwapProvider; quote: SwapQuote }> {
    const providers = this.getEnabledProviders();

    if (providers.length === 0) {
      throw new Error("No swap providers are enabled");
    }

    // Query all providers in parallel
    const results = await Promise.allSettled(
      providers.map(async (provider) => ({
        provider,
        quote: await provider.getQuote(params),
      }))
    );

    // Filter successful results
    const successfulQuotes = results
      .filter(
        (result): result is PromiseFulfilledResult<{
          provider: ISwapProvider;
          quote: SwapQuote;
        }> => result.status === "fulfilled"
      )
      .map((result) => result.value);

    if (successfulQuotes.length === 0) {
      // Get error message from first rejection
      const firstError = results.find(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      throw new Error(
        firstError?.reason?.message || "All swap providers failed to get quote"
      );
    }

    // Find the best quote (highest output amount)
    const best = successfulQuotes.reduce((best, current) => {
      const bestOutput = BigInt(best.quote.outputAmount);
      const currentOutput = BigInt(current.quote.outputAmount);
      return currentOutput > bestOutput ? current : best;
    });

    return best;
  }

  /**
   * Get quotes from all enabled providers.
   * Useful for displaying multiple options to the user.
   */
  static async getAllQuotes(
    params: SwapParams
  ): Promise<{ provider: ISwapProvider; quote: SwapQuote }[]> {
    const providers = this.getEnabledProviders();

    const results = await Promise.allSettled(
      providers.map(async (provider) => ({
        provider,
        quote: await provider.getQuote(params),
      }))
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<{
          provider: ISwapProvider;
          quote: SwapQuote;
        }> => result.status === "fulfilled"
      )
      .map((result) => result.value);
  }

  /**
   * Create a new provider instance.
   */
  private static createProvider(type: SwapProviderType): ISwapProvider {
    switch (type) {
      case "jupiter":
        return new JupiterProvider();
      case "raydium":
        throw new Error("Raydium provider not yet implemented");
      case "orca":
        throw new Error("Orca provider not yet implemented");
      case "meteora":
        throw new Error("Meteora provider not yet implemented");
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

// Re-export providers
export { JupiterProvider } from "./JupiterProvider";
export { BaseSwapProvider } from "./BaseSwapProvider";
