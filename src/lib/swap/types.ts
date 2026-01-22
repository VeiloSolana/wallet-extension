import { VersionedTransaction } from "@solana/web3.js";

// Provider types supported by the swap system
export type SwapProviderType = "jupiter" | "raydium" | "orca" | "meteora";

// Parameters for requesting a swap quote
export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: string; // Human-readable amount
  slippageBps: number; // Basis points (50 = 0.5%)
  userPublicKey: string;
}

// A single hop in a swap route
export interface SwapRouteHop {
  inputMint: string;
  outputMint: string;
  ammKey: string;
  label: string;
  inputAmount: string;
  outputAmount: string;
  feeAmount: string;
  feeMint: string;
}

// Full route information
export interface SwapRoute {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: SwapRouteHop[];
}

// Quote returned from a swap provider
export interface SwapQuote {
  inputAmount: string; // Raw amount in smallest unit
  outputAmount: string; // Raw amount in smallest unit
  minimumReceived: string; // After slippage
  priceImpact: number; // Percentage
  route: SwapRoute[];
  provider: SwapProviderType;
  fees: {
    networkFee: string;
    protocolFee: string;
  };
  // Provider-specific data for building the transaction
  rawQuote?: unknown;
}

// Result after executing a swap
export interface SwapResult {
  success: boolean;
  txSignature?: string;
  inputSpent: string;
  outputReceived: string;
  error?: string;
}

// Token information for the swap UI
export interface SwapToken {
  symbol: string;
  mintAddress: string;
  decimals: number;
  logoUri?: string;
}

// Provider interface that all swap providers must implement
export interface ISwapProvider {
  readonly providerType: SwapProviderType;

  // Get a quote for a swap
  getQuote(params: SwapParams): Promise<SwapQuote>;

  // Get the exchange rate between two tokens
  getRate(inputMint: string, outputMint: string, amount: string): Promise<string>;

  // Build the transaction for a swap
  buildSwapTransaction(
    params: SwapParams,
    quote: SwapQuote
  ): Promise<VersionedTransaction>;
}

// Configuration for a single provider
export interface SwapProviderConfig {
  enabled: boolean;
  apiEndpoint?: string;
}

// Full swap configuration
export interface SwapConfig {
  defaultProvider: SwapProviderType;
  defaultSlippageBps: number;
  maxSlippageBps: number;
  quoteRefreshMs: number;
  rpcEndpoint: string;
  relayerEndpoint: string;
  providers: Record<SwapProviderType, SwapProviderConfig>;
  supportedTokens: SwapToken[];
}

// State for the useSwap hook
export interface SwapState {
  inputToken: SwapToken;
  outputToken: SwapToken;
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  isExecuting: boolean;
  error: string | null;
  txSignature: string | null;
}
