import type { SwapConfig, SwapToken, SwapProviderType } from "./types";
import { SOL_MINT, USDC_MINT, USDT_MINT } from "../transactions/shared";

// Toggle: true = submit via relayer, false = submit directly to RPC
export const USE_RELAYER_FOR_SUBMISSION = false;

// Supported tokens for swapping
export const SUPPORTED_TOKENS: SwapToken[] = [
  {
    symbol: "SOL",
    mintAddress: SOL_MINT.toString(),
    decimals: 9,
    logoUri:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    symbol: "USDC",
    mintAddress: USDC_MINT.toString(),
    decimals: 6,
    logoUri:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    symbol: "USDT",
    mintAddress: USDT_MINT.toString(),
    decimals: 6,
    logoUri:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
  },
];

// Main swap configuration
export const SWAP_CONFIG: SwapConfig = {
  defaultProvider: "jupiter" as SwapProviderType,
  defaultSlippageBps: 50, // 0.5%
  maxSlippageBps: 500, // 5% max
  quoteRefreshMs: 10000, // Refresh quote every 10s

  // RPC endpoints
  rpcEndpoint: "https://api.mainnet-beta.solana.com",
  relayerEndpoint: "http://localhost:8080",

  // Provider configurations
  providers: {
    jupiter: {
      enabled: true,
      apiEndpoint: "https://lite-api.jup.ag/swap/v1",
    },
    raydium: {
      enabled: false,
    },
    orca: {
      enabled: false,
    },
    meteora: {
      enabled: false,
    },
  },

  supportedTokens: SUPPORTED_TOKENS,
};

// Helper to get token by symbol
export function getTokenBySymbol(symbol: string): SwapToken | undefined {
  return SUPPORTED_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

// Helper to get token by mint address
export function getTokenByMint(mintAddress: string): SwapToken | undefined {
  return SUPPORTED_TOKENS.find(
    (t) => t.mintAddress.toLowerCase() === mintAddress.toLowerCase(),
  );
}

// Helper to get decimals for a mint
export function getTokenDecimals(mintAddress: string): number {
  const token = getTokenByMint(mintAddress);
  return token?.decimals ?? 9; // Default to 9 (SOL decimals)
}

// Convert human-readable amount to raw amount (smallest unit)
export function toRawAmount(amount: string, decimals: number): string {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return "0";
  return Math.floor(parsed * Math.pow(10, decimals)).toString();
}

// Convert raw amount to human-readable amount
export function fromRawAmount(rawAmount: string, decimals: number): string {
  const parsed = BigInt(rawAmount);
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = parsed / divisor;
  const remainder = parsed % divisor;

  if (remainder === 0n) {
    return whole.toString();
  }

  const decimalPart = remainder.toString().padStart(decimals, "0");
  // Trim trailing zeros
  const trimmed = decimalPart.replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}
