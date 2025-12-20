declare module "process" {
  const process: NodeJS.Process;
  export = process;
}

declare module "@zkprivacysol/sdk-core" {
  import type {
    PublicKey,
    Connection,
    Transaction,
    VersionedTransaction,
  } from "@solana/web3.js";
  import type { Program } from "@coral-xyz/anchor";

  export interface SerializedNote {
    value: string;
    owner: string;
    randomness: string;
  }

  export interface WithdrawCircuitInputs {
    root: string;
    nullifier: string;
    recipient: PublicKey;
    pathElements: string[];
    pathIndices: number[];
  }

  export interface ProofBuilder {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  }

  export interface MerklePath {
    pathElements: string[];
    pathIndices: number[];
  }

  export interface Wallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]>;
  }

  export function getPoolPdas(programId: PublicKey): {
    config: PublicKey;
    vault: PublicKey;
    noteTree: PublicKey;
    nullifiers: PublicKey;
  };

  export function initializePool(params: {
    program: Program<any>;
    admin: Wallet;
    denomsLamports: number[];
    feeBps: number;
  }): Promise<string>;

  export function createNoteAndDeposit(params: {
    program: Program<any>;
    depositor: Wallet;
    denomIndex: number;
    valueLamports: number;
    newRoot: Uint8Array;
  }): Promise<string>;

  export function withdrawViaRelayer(params: any): Promise<string>;
  export function withdrawViaRelayerWithProof(params: any): Promise<string>;
  export function addRelayer(params: any): Promise<string>;
  export function depositFixedSol(params: any): Promise<string>;

  export function sol(amount: number): number;

  export function createRandomNote(
    value: number,
    owner: PublicKey
  ): SerializedNote;
  export function encodeNoteToBytes(note: SerializedNote): Uint8Array;
  export function commitNote(note: SerializedNote): Uint8Array;
  export function createNoteWithCommitment({
    value,
    owner,
  }: {
    value: number;
    owner: PublicKey;
  }): { note: SerializedNote; commitment: Uint8Array };

  export function merkleLeafFromCommitment(commitment: Uint8Array): Uint8Array;
  export function merkleHashPair(
    left: Uint8Array,
    right: Uint8Array
  ): Uint8Array;
  export function merkleRootFromLeaves(leaves: Uint8Array[]): Uint8Array;

  export function buildDummyProof(): ProofBuilder;
}
