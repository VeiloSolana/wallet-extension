/**
 * Privacy Pool SDK Client Functions
 *
 * Re-exports from @zkprivacysol/sdk-core package.
 * This file serves as a single entry point for all SDK operations.
 */

// Re-export everything from the SDK
export {
  // Client functions
  getPoolPdas,
  initializePool,
  createNoteAndDeposit,
  withdrawViaRelayer,
  withdrawViaRelayerWithProof,
  addRelayer,
  depositFixedSol,
  // Config helpers
  sol,
  // Note helpers
  createRandomNote,
  encodeNoteToBytes,
  commitNote,
  createNoteWithCommitment,
  // Merkle helpers
  merkleLeafFromCommitment,
  merkleHashPair,
  merkleRootFromLeaves,
  // Proof helpers
  buildDummyProof,
} from "@zkprivacysol/sdk-core";

// Re-export types
export type {
  SerializedNote,
  WithdrawCircuitInputs,
  ProofBuilder,
  MerklePath,
} from "@zkprivacysol/sdk-core";
