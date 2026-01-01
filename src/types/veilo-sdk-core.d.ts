declare module "veilo-sdk-core" {
  import type { Program, Idl, Wallet } from "@coral-xyz/anchor";
  import type { PublicKey } from "@solana/web3.js";

  export interface Note {
    value: bigint;
    owner: PublicKey;
    rho: Uint8Array;
    r: Uint8Array;
  }

  export interface SerializedNote {
    value: bigint;
    owner: PublicKey;
    rho: Uint8Array;
    r: Uint8Array;
    commitment: Uint8Array;
  }

  export interface MerklePath {
    indices: number[];
    siblings: Uint8Array[];
  }

  export interface NoteAndMerkleData {
    note: SerializedNote;
    leafIndex: number;
    root: Uint8Array;
    merklePath: MerklePath;
  }

  export class MerkleTree {
    constructor(height: number);
    insert(leaf: Uint8Array): number;
    root(): Uint8Array;
    getProof(index: number): MerklePath;
  }

  export function initPoseidon(): Promise<void>;

  export function createNoteDepositWithMerkle<T extends Idl>(params: {
    program: Program<T>;
    depositor: Wallet;
    denomIndex: number;
    valueLamports: bigint;
    tree: MerkleTree;
  }): Promise<NoteAndMerkleData>;

  export function createNoteWithCommitment(params: {
    value: bigint;
    owner: PublicKey;
  }): SerializedNote;

  export function deriveNullifier(note: SerializedNote): Uint8Array;

  export function commitNote(note: Note): Uint8Array;

  export function getPoolPdas(
    programId: PublicKey,
    commitmentSeed?: Uint8Array
  ): {
    config: PublicKey;
    vault: PublicKey;
    noteTree: PublicKey;
    nullifiers: PublicKey;
    noteHint: PublicKey;
  };

  export function sol(amount: number): bigint;
}
