import type { SwapConfig, SwapToken, SwapProviderType } from "./types";
import { getRpcEndpoint, getTokenMints, getJupiterEndpoint } from "../network";

// Toggle: true = submit via relayer, false = submit directly to RPC
export const USE_RELAYER_FOR_SUBMISSION = false;

// Get supported tokens dynamically based on network
export function getSupportedTokens(): SwapToken[] {
  const mints = getTokenMints();
  return [
    {
      symbol: "SOL",
      mintAddress: mints.SOL_MINT.toString(),
      decimals: 9,
      logoUri:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
    {
      symbol: "USDC",
      mintAddress: mints.USDC_MINT.toString(),
      decimals: 6,
      logoUri:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      symbol: "USDT",
      mintAddress: mints.USDT_MINT.toString(),
      decimals: 6,
      logoUri:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
    },
  ];
}

// Legacy static tokens (mainnet) - prefer getSupportedTokens() for network-aware
export const SUPPORTED_TOKENS: SwapToken[] = getSupportedTokens();

// Get swap config dynamically based on network
export function getSwapConfig(): SwapConfig {
  return {
    defaultProvider: "jupiter" as SwapProviderType,
    defaultSlippageBps: 50, // 0.5%
    maxSlippageBps: 500, // 5% max
    quoteRefreshMs: 10000, // Refresh quote every 10s

    // RPC endpoints - network-aware
    rpcEndpoint: getRpcEndpoint(),
    relayerEndpoint:
      import.meta.env.VITE_RELAYER_ENDPOINT ||
      "https://relayer-server.onrender.com",

    // Provider configurations
    providers: {
      jupiter: {
        enabled: true,
        apiEndpoint: getJupiterEndpoint(),
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

    supportedTokens: getSupportedTokens(),
  };
}

// Legacy static config - prefer getSwapConfig() for network-aware
export const SWAP_CONFIG: SwapConfig = getSwapConfig();

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
