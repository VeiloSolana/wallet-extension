/**
 * Helper utilities for SOL amount conversions and common operations
 */

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Re-export sol helper from SDK
export { sol } from "@zkprivacysol/sdk-core";

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: bigint): number => {
  return Number(lamports) / LAMPORTS_PER_SOL;
};

/**
 * Create a placeholder Merkle root (for testing/development)
 */
export const createPlaceholderRoot = (): Uint8Array => {
  return new Uint8Array(32).fill(2);
};

/**
 * Create a placeholder nullifier (for testing/development)
 */
export const createPlaceholderNullifier = (): Uint8Array => {
  return new Uint8Array(32).fill(3);
};
