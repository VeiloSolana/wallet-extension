/**
 * Private Swap Handler
 *
 * Executes swaps through the privacy pool's `transact_swap` instruction.
 * Flow:
 * 1. Select notes from source pool (private balance)
 * 2. Get Jupiter swap instruction (raw instruction data)
 * 3. Generate ZK swap proof
 * 4. Build `transact_swap` program instruction
 * 5. Create Address Lookup Table (ALT) for versioned transaction
 * 6. Sign and submit
 */

import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Connection,
  SystemProgram,
  ComputeBudgetProgram,
  AddressLookupTableProgram,
  TransactionMessage,
  VersionedTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import { getProgram, type WalletAdapter } from "../../../program/program";
import type { NoteManager } from "../noteManager";
import { selectNotesForWithdrawal } from "../transactions/note-selector";
import {
  computeCommitment,
  computeNullifier,
  computeExtDataHash,
  derivePublicKey,
  randomBytes32,
  bytesToBigIntBE,
  extractRootFromAccount,
} from "../transactions/shared";
import { getMerkleTree } from "../api/relayerApi";
import { buildMerkleTree } from "../../utils/merkletree/index";
import { getTokenMints, getJupiterEndpoint } from "../network";
import { getTokenDecimals, fromRawAmount } from "./config";
import type { SwapQuote, SwapResult } from "./types";
import { getBestTreeForDeposit } from "../../transactions/treeHelpers";
import { createEncryptedNoteBlob } from "../../transactions/ECDH/helpers";
import { saveEncryptedNoteWithRetry } from "../api/relayerApi";

// ============================================================================
// Constants
// ============================================================================

const SWAP_WASM_PATH = "/zk/circuits/swap/swap_js/swap.wasm";
const SWAP_ZKEY_PATH = "/zk/circuits/swap/swap_final.zkey";
const SWAP_VK_PATH = "/zk/circuits/swap/swap_verification_key.json";

const TREE_HEIGHT = 22;

const JUPITER_PROGRAM_ID = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
);
const JUPITER_EVENT_AUTHORITY = new PublicKey(
  "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
);

// Wrapped SOL mint (on-chain programs use this, not PublicKey.default)
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// ============================================================================
// Caching
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPoseidon: any = null;
let cachedSwapZkAssets: {
  wasm: ArrayBuffer;
  zkey: ArrayBuffer;
  vkey: object;
} | null = null;

async function getCachedPoseidon() {
  if (!cachedPoseidon) {
    cachedPoseidon = await buildPoseidon();
  }
  return cachedPoseidon;
}

async function preloadSwapZkAssets() {
  if (!cachedSwapZkAssets) {
    const [wasmResp, zkeyResp, vkResp] = await Promise.all([
      fetch(SWAP_WASM_PATH),
      fetch(SWAP_ZKEY_PATH),
      fetch(SWAP_VK_PATH),
    ]);
    const [wasm, zkey, vkey] = await Promise.all([
      wasmResp.arrayBuffer(),
      zkeyResp.arrayBuffer(),
      vkResp.json(),
    ]);
    cachedSwapZkAssets = { wasm, zkey, vkey };
  }
  return cachedSwapZkAssets;
}

// ============================================================================
// PDA Derivation Helpers
// ============================================================================

function encodeTreeId(treeId: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(treeId, 0);
  return buf;
}

function deriveConfigPDA(programId: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_config_v3"), mint.toBuffer()],
    programId,
  )[0];
}

function deriveVaultPDA(programId: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_vault_v3"), mint.toBuffer()],
    programId,
  )[0];
}

function deriveNullifiersPDA(programId: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_nullifiers_v3"), mint.toBuffer()],
    programId,
  )[0];
}

function deriveNoteTreePDA(
  programId: PublicKey,
  mint: PublicKey,
  treeId: number,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("privacy_note_tree_v3"),
      mint.toBuffer(),
      encodeTreeId(treeId),
    ],
    programId,
  )[0];
}

function deriveNullifierMarkerPDA(
  programId: PublicKey,
  mint: PublicKey,
  nullifier: Uint8Array,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("nullifier_v3"), mint.toBuffer(), Buffer.from(nullifier)],
    programId,
  )[0];
}

function deriveSwapExecutorPDA(
  programId: PublicKey,
  sourceMint: PublicKey,
  destMint: PublicKey,
  inputNullifier0: Uint8Array,
  relayer: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("swap_executor"),
      sourceMint.toBuffer(),
      destMint.toBuffer(),
      Buffer.from(inputNullifier0),
      relayer.toBuffer(),
    ],
    programId,
  )[0];
}

function deriveGlobalConfigPDA(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("global_config_v1")],
    programId,
  )[0];
}

// ============================================================================
// Proof helpers
// ============================================================================

// Helper: Reduce value modulo BN254 Fr field
function reduceToField(bytes: Uint8Array): bigint {
  const FR_MODULUS = BigInt(
    "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
  );
  const value = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  return value % FR_MODULUS;
}

function convertProofToBytes(proof: {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
}): {
  proofA: number[];
  proofB: number[];
  proofC: number[];
} {
  function bigintTo32BytesBE(x: bigint): number[] {
    const out = new Array(32).fill(0);
    let v = x;
    for (let i = 31; i >= 0; i--) {
      out[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return out;
  }

  const ax = BigInt(proof.pi_a[0]);
  const ay = BigInt(proof.pi_a[1]);
  const bx0 = BigInt(proof.pi_b[0][0]);
  const bx1 = BigInt(proof.pi_b[0][1]);
  const by0 = BigInt(proof.pi_b[1][0]);
  const by1 = BigInt(proof.pi_b[1][1]);
  const cx = BigInt(proof.pi_c[0]);
  const cy = BigInt(proof.pi_c[1]);

  const proofA = [...bigintTo32BytesBE(ax), ...bigintTo32BytesBE(ay)];
  const proofB = [
    ...bigintTo32BytesBE(bx1),
    ...bigintTo32BytesBE(bx0),
    ...bigintTo32BytesBE(by1),
    ...bigintTo32BytesBE(by0),
  ];
  const proofC = [...bigintTo32BytesBE(cx), ...bigintTo32BytesBE(cy)];

  return { proofA, proofB, proofC };
}

/**
 * Compute swap params hash:
 * Poseidon(sourceMint, destMint, minAmountOut, deadline, swapDataHash)
 */
function computeSwapParamsHash(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poseidon: any,
  sourceMint: PublicKey,
  destMint: PublicKey,
  minAmountOut: bigint,
  deadline: bigint,
  swapDataHash: Uint8Array,
): Uint8Array {
  const srcField = poseidon.F.e(reduceToField(sourceMint.toBytes()));
  const dstField = poseidon.F.e(reduceToField(destMint.toBytes()));
  const minField = poseidon.F.e(minAmountOut.toString());
  const deadlineField = poseidon.F.e(deadline.toString());
  const hashField = poseidon.F.e(bytesToBigIntBE(swapDataHash));

  const result = poseidon([
    srcField,
    dstField,
    minField,
    deadlineField,
    hashField,
  ]);
  const hex = poseidon.F.toString(result, 16).padStart(64, "0");
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

/**
 * Generate a ZK swap proof using the swap circuit
 */
async function generateSwapProof(inputs: {
  sourceRoot: Uint8Array;
  swapParamsHash: Uint8Array;
  extDataHash: Uint8Array;
  sourceMint: PublicKey;
  destMint: PublicKey;
  inputNullifiers: [Uint8Array, Uint8Array];
  changeCommitment: Uint8Array;
  destCommitment: Uint8Array;
  swapAmount: bigint;

  // Private inputs
  inputAmounts: [bigint, bigint];
  inputPrivateKeys: [Uint8Array, Uint8Array];
  inputPublicKeys: [bigint, bigint];
  inputBlindings: [Uint8Array, Uint8Array];
  inputMerklePaths: [
    { pathElements: bigint[]; pathIndices: number[] },
    { pathElements: bigint[]; pathIndices: number[] },
  ];
  changeAmount: bigint;
  changePubkey: bigint;
  changeBlinding: Uint8Array;
  destAmount: bigint;
  destPubkey: bigint;
  destBlinding: Uint8Array;
  minAmountOut: bigint;
  deadline: bigint;
}) {
  const assets = await preloadSwapZkAssets();

  const circuitInputs = {
    // Public inputs
    sourceRoot: bytesToBigIntBE(inputs.sourceRoot).toString(),
    swapParamsHash: bytesToBigIntBE(inputs.swapParamsHash).toString(),
    extDataHash: bytesToBigIntBE(inputs.extDataHash).toString(),
    sourceMint: reduceToField(inputs.sourceMint.toBytes()).toString(),
    destMint: reduceToField(inputs.destMint.toBytes()).toString(),
    inputNullifier: inputs.inputNullifiers.map((n) =>
      bytesToBigIntBE(n).toString(),
    ),
    changeCommitment: bytesToBigIntBE(inputs.changeCommitment).toString(),
    destCommitment: bytesToBigIntBE(inputs.destCommitment).toString(),
    swapAmount: inputs.swapAmount.toString(),

    // Private inputs – input UTXOs
    inAmount: inputs.inputAmounts.map((a) => a.toString()),
    inPubkey: inputs.inputPublicKeys.map((pk) => pk.toString()),
    inBlinding: inputs.inputBlindings.map((b) => bytesToBigIntBE(b).toString()),
    inPathIndex: inputs.inputMerklePaths.map((p) =>
      p.pathIndices.reduce((acc, bit, i) => acc + (bit << i), 0),
    ),
    inPathElements: inputs.inputMerklePaths.map((p) =>
      p.pathElements.map((e) => e.toString()),
    ),
    inPrivateKey: inputs.inputPrivateKeys.map((pk) =>
      bytesToBigIntBE(pk).toString(),
    ),

    // Private inputs – outputs
    changeAmount: inputs.changeAmount.toString(),
    changePubkey: inputs.changePubkey.toString(),
    changeBlinding: bytesToBigIntBE(inputs.changeBlinding).toString(),
    destAmount: inputs.destAmount.toString(),
    destPubkey: inputs.destPubkey.toString(),
    destBlinding: bytesToBigIntBE(inputs.destBlinding).toString(),

    // Private swap params
    minAmountOut: inputs.minAmountOut.toString(),
    deadline: inputs.deadline.toString(),
  };

  let proof, publicSignals;
  try {
    ({ proof, publicSignals } = await groth16.fullProve(
      circuitInputs,
      { type: "mem", data: new Uint8Array(assets.wasm) } as unknown as string,
      { type: "mem", data: new Uint8Array(assets.zkey) } as unknown as string,
    ));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Swap proof generation failed:", msg);
    throw new Error(`Failed to generate swap proof: ${msg}`);
  }

  // Verify off-chain
  const valid = await groth16.verify(assets.vkey, publicSignals, proof);
  if (!valid) {
    throw new Error("Generated swap proof is invalid!");
  }

  return convertProofToBytes(proof);
}

// ============================================================================
// Jupiter Swap Instruction Fetcher
// ============================================================================

interface JupiterSwapInstructionResponse {
  swapInstruction: {
    programId: string;
    accounts: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: string; // base64
  };
  addressLookupTableAddresses: string[];
}

/**
 * Get Jupiter swap instruction for the executor PDA (not a full transaction).
 * Uses Jupiter's /swap-instructions endpoint.
 */
async function getJupiterSwapInstruction(
  rawQuote: unknown,
  executorPDA: PublicKey,
): Promise<{
  instruction: TransactionInstruction;
  addressLookupTableAddresses: string[];
}> {
  const apiEndpoint = getJupiterEndpoint();
  const apiKey = import.meta.env.VITE_JUPITER_API_KEY;

  const response = await fetch(`${apiEndpoint}/swap-instructions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      quoteResponse: rawQuote,
      userPublicKey: executorPDA.toBase58(),
      wrapAndUnwrapSol: false, // The program handles token accounts
      dynamicComputeUnitLimit: false,
      useSharedAccounts: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter swap-instructions failed: ${errorText}`);
  }

  const data: JupiterSwapInstructionResponse = await response.json();
  const swapIx = data.swapInstruction;

  const instruction = new TransactionInstruction({
    programId: new PublicKey(swapIx.programId),
    keys: swapIx.accounts.map((acc) => ({
      pubkey: new PublicKey(acc.pubkey),
      isSigner: false, // Executor PDA signs via CPI; no user signer
      isWritable: acc.isWritable,
    })),
    data: Buffer.from(swapIx.data, "base64"),
  });

  return {
    instruction,
    addressLookupTableAddresses: data.addressLookupTableAddresses || [],
  };
}

/**
 * Extract remaining accounts for the `transact_swap` instruction
 * (all accounts from the Jupiter swap instruction)
 */
function extractRemainingAccounts(
  jupiterIx: TransactionInstruction,
): Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }> {
  // Include the Jupiter program ID as first remaining account
  const accounts: Array<{
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }> = [];
  const seen = new Set<string>();

  // Add all Jupiter instruction accounts
  for (const meta of jupiterIx.keys) {
    const key = meta.pubkey.toBase58();
    if (!seen.has(key)) {
      seen.add(key);
      accounts.push({
        pubkey: meta.pubkey,
        isSigner: false, // CPI handles signing
        isWritable: meta.isWritable,
      });
    }
  }

  return accounts;
}

// ============================================================================
// Mint address mapping helpers
// ============================================================================

/**
 * Map a token symbol to its on-chain mint address for the pool.
 */
function symbolToOnChainMint(symbol: string): PublicKey {
  const mints = getTokenMints();
  switch (symbol.toUpperCase()) {
    case "SOL":
      return WSOL_MINT;
    case "USDC":
      return mints.USDC_MINT;
    case "USDT":
      return mints.USDT_MINT;
    default:
      throw new Error(`Unsupported token for private swap: ${symbol}`);
  }
}

// ============================================================================
// Main Private Swap Executor
// ============================================================================

export interface PrivateSwapParams {
  connection: Connection;
  wallet: WalletAdapter;
  noteManager: NoteManager;
  /** The note owner's derived ZK public key (used as dest note owner) */
  publicKey: bigint;
  /** Source token symbol (e.g. "SOL") */
  inputSymbol: string;
  /** Destination token symbol (e.g. "USDC") */
  outputSymbol: string;
  /** Amount to swap in raw units (lamports / smallest unit) */
  swapAmountRaw: bigint;
  /** Jupiter quote (must have rawQuote) */
  quote: SwapQuote;
  /** Slippage in basis points */
  slippageBps: number;
}

/**
 * Execute a private swap through the privacy pool's `transact_swap` instruction.
 */
export async function executePrivateSwap(
  params: PrivateSwapParams,
): Promise<SwapResult> {
  const {
    connection,
    wallet,
    noteManager,
    publicKey,
    inputSymbol,
    outputSymbol,
    swapAmountRaw,
    quote,
  } = params;

  try {
    // 1. Resolve mints
    const sourceMint = symbolToOnChainMint(inputSymbol);
    const destMint = symbolToOnChainMint(outputSymbol);

    // The note manager stores SOL notes under PublicKey.default
    const sourceNoteMint =
      inputSymbol === "SOL"
        ? PublicKey.default.toBase58()
        : sourceMint.toBase58();

    // 2. Initialize Poseidon + preload ZK assets in parallel
    const [poseidon] = await Promise.all([
      getCachedPoseidon(),
      preloadSwapZkAssets(),
    ]);

    // 3. Get program
    const program = getProgram(connection, wallet);
    const programId = program.programId;

    // 4. Select notes from source pool
    const unspentNotes =
      await noteManager.getUnspentNotesByMint(sourceNoteMint);
    const selection = selectNotesForWithdrawal(unspentNotes, swapAmountRaw);
    if (!selection.success) {
      return {
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: `Insufficient private balance: ${selection.message}`,
      };
    }

    // 5. Get the source tree (from the first selected note)
    const sourceTreeId = selection.selectedNotes[0].treeId;
    const treeResponse = await getMerkleTree(
      sourceNoteMint === PublicKey.default.toBase58()
        ? sourceMint.toBase58()
        : sourceNoteMint,
      sourceTreeId,
    );

    const offchainTree = treeResponse?.data
      ? buildMerkleTree(treeResponse.data, poseidon)
      : (() => {
          throw new Error("Failed to fetch source merkle tree");
        })();

    // Fetch on-chain tree for the root
    const sourceTreePDA = deriveNoteTreePDA(
      programId,
      sourceMint,
      sourceTreeId,
    );
    const sourceTreeAcc =
      await program.account.merkleTreeAccount.fetch(sourceTreePDA);
    const root = extractRootFromAccount(sourceTreeAcc);

    // 6. Prepare input notes
    const note0 = selection.selectedNotes[0];
    const note0Amount = BigInt(note0.amount);
    const note0PrivateKey = Uint8Array.from(
      Buffer.from(note0.privateKey, "hex"),
    );
    const note0Blinding = Uint8Array.from(Buffer.from(note0.blinding, "hex"));
    const note0Commitment = Uint8Array.from(
      Buffer.from(note0.commitment, "hex"),
    );
    const note0PublicKey = BigInt("0x" + note0.publicKey);
    const note0MerklePath =
      note0.merklePath || offchainTree.getMerkleProof(note0.leafIndex);

    const nullifier0 = computeNullifier(
      poseidon,
      note0Commitment,
      note0.leafIndex,
      note0PrivateKey,
    );

    // Second input: either real note or dummy
    let note1Amount: bigint;
    let note1PrivateKey: Uint8Array;
    let note1Blinding: Uint8Array;
    let note1PublicKey: bigint;
    let note1MerklePath: { pathElements: bigint[]; pathIndices: number[] };
    let nullifier1: Uint8Array;

    if (selection.selectedNotes.length >= 2) {
      const note1 = selection.selectedNotes[1];
      note1Amount = BigInt(note1.amount);
      note1PrivateKey = Uint8Array.from(Buffer.from(note1.privateKey, "hex"));
      note1Blinding = Uint8Array.from(Buffer.from(note1.blinding, "hex"));
      const note1Commitment = Uint8Array.from(
        Buffer.from(note1.commitment, "hex"),
      );
      note1PublicKey = BigInt("0x" + note1.publicKey);
      note1MerklePath =
        note1.merklePath || offchainTree.getMerkleProof(note1.leafIndex);
      nullifier1 = computeNullifier(
        poseidon,
        note1Commitment,
        note1.leafIndex,
        note1PrivateKey,
      );
    } else {
      // Dummy second input
      const dummyPrivKey = randomBytes32();
      const dummyPubKey = derivePublicKey(poseidon, dummyPrivKey);
      const dummyBlinding = randomBytes32();
      const dummyCommitment = computeCommitment(
        poseidon,
        0n,
        dummyPubKey,
        dummyBlinding,
        sourceMint,
      );
      note1Amount = 0n;
      note1PrivateKey = dummyPrivKey;
      note1Blinding = dummyBlinding;
      note1PublicKey = dummyPubKey;

      // Zero path for dummy
      const zeros = offchainTree.getZeros();
      const zeroPathElements = zeros
        .slice(0, TREE_HEIGHT)
        .map((z: Uint8Array) => bytesToBigIntBE(z));
      note1MerklePath = {
        pathElements: zeroPathElements,
        pathIndices: new Array(TREE_HEIGHT).fill(0),
      };
      nullifier1 = computeNullifier(poseidon, dummyCommitment, 0, dummyPrivKey);
    }

    // 7. Compute min amount out from quote
    const minAmountOut = BigInt(quote.minimumReceived);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

    // 8. Derive executor PDA (includes relayer = wallet.publicKey)
    const executorPDA = deriveSwapExecutorPDA(
      programId,
      sourceMint,
      destMint,
      nullifier0,
      wallet.publicKey,
    );

    // 9. Get Jupiter swap instruction for the executor PDA
    if (!quote.rawQuote) {
      throw new Error("Quote does not contain raw Jupiter quote data");
    }
    const { instruction: jupiterIx, addressLookupTableAddresses } =
      await getJupiterSwapInstruction(quote.rawQuote, executorPDA);

    const swapData = jupiterIx.data;
    const remainingAccounts = extractRemainingAccounts(jupiterIx);

    // 10. Compute swap data hash (SHA-256) — MEDIUM-001: prevents relayer substitution
    const swapDataHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new Uint8Array(swapData),
    );
    const swapDataHash = new Uint8Array(swapDataHashBuffer);

    // 11. Prepare output notes
    // Destination note (receives swapped tokens)
    const destAmount = minAmountOut;
    const destBlinding = randomBytes32();
    const destCommitment = computeCommitment(
      poseidon,
      destAmount,
      publicKey,
      destBlinding,
      destMint,
    );

    // Change note (remaining source tokens) – use user's pubkey so the note is spendable
    const changeAmount = note0Amount + note1Amount - swapAmountRaw;
    const changeBlinding = randomBytes32();
    const changeCommitment = computeCommitment(
      poseidon,
      changeAmount,
      publicKey,
      changeBlinding,
      sourceMint,
    );

    // 12. Compute swap params hash for the ZK proof
    const swapParams = {
      minAmountOut: new BN(minAmountOut.toString()),
      deadline: new BN(deadline.toString()),
      sourceMint,
      destMint,
      swapDataHash: Buffer.from(swapDataHash),
    };

    const swapParamsHash = computeSwapParamsHash(
      poseidon,
      sourceMint,
      destMint,
      minAmountOut,
      deadline,
      swapDataHash,
    );

    // 13. Compute ext data (relayer fee = 0.5% of output)
    const relayerFee = (minAmountOut * 50n) / 10000n;
    const extData = {
      recipient: wallet.publicKey,
      relayer: wallet.publicKey,
      fee: new BN(relayerFee.toString()),
      refund: new BN(0),
    };
    const extDataHash = computeExtDataHash(poseidon, extData);

    // 14. Generate ZK swap proof
    const proof = await generateSwapProof({
      sourceRoot: root,
      swapParamsHash,
      extDataHash,
      sourceMint,
      destMint,
      inputNullifiers: [nullifier0, nullifier1],
      changeCommitment,
      destCommitment,
      swapAmount: swapAmountRaw,
      inputAmounts: [note0Amount, note1Amount],
      inputPrivateKeys: [note0PrivateKey, note1PrivateKey],
      inputPublicKeys: [note0PublicKey, note1PublicKey],
      inputBlindings: [note0Blinding, note1Blinding],
      inputMerklePaths: [note0MerklePath, note1MerklePath],
      changeAmount,
      changePubkey: publicKey,
      changeBlinding,
      destAmount,
      destPubkey: publicKey,
      destBlinding,
      minAmountOut,
      deadline,
    });

    // 15. Derive all PDAs
    const sourceConfig = deriveConfigPDA(programId, sourceMint);
    const globalConfig = deriveGlobalConfigPDA(programId);
    const sourceVault = deriveVaultPDA(programId, sourceMint);
    const sourceTree = deriveNoteTreePDA(programId, sourceMint, sourceTreeId);
    const sourceNullifiers = deriveNullifiersPDA(programId, sourceMint);
    const nullifierMarker0 = deriveNullifierMarkerPDA(
      programId,
      sourceMint,
      nullifier0,
    );
    const nullifierMarker1 = deriveNullifierMarkerPDA(
      programId,
      sourceMint,
      nullifier1,
    );
    const sourceVaultTokenAccount = await getAssociatedTokenAddress(
      sourceMint,
      sourceVault,
      true,
    );

    // Find best dest tree and fetch its account for leaf index
    const destTreeInfo = await getBestTreeForDeposit(
      destMint,
      undefined,
      connection,
      wallet,
    );
    const destTreeId = destTreeInfo?.treeId ?? 0;
    const destConfig = deriveConfigPDA(programId, destMint);
    const destVault = deriveVaultPDA(programId, destMint);
    const destTree = deriveNoteTreePDA(programId, destMint, destTreeId);
    const destVaultTokenAccount = await getAssociatedTokenAddress(
      destMint,
      destVault,
      true,
    );
    const destTreeAcc = await program.account.merkleTreeAccount.fetch(destTree);

    // Leaf indices for output notes (before the tx inserts them)
    const changeLeafIndex = Number(sourceTreeAcc.nextIndex);
    const destLeafIndex = Number(destTreeAcc.nextIndex);

    // Executor token accounts
    const executorSourceToken = await getAssociatedTokenAddress(
      sourceMint,
      executorPDA,
      true,
    );
    const executorDestToken = await getAssociatedTokenAddress(
      destMint,
      executorPDA,
      true,
    );

    // Relayer token account (for fee in dest token)
    const relayerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      destMint,
      wallet.publicKey,
    );

    // 16. Build the transact_swap instruction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const swapIx = await (program.methods as any)
      .transactSwap(
        proof,
        Array.from(root),
        sourceTreeId,
        sourceMint,
        Array.from(nullifier0),
        Array.from(nullifier1),
        destTreeId,
        destMint,
        Array.from(changeCommitment),
        Array.from(destCommitment),
        swapParams,
        new BN(swapAmountRaw.toString()),
        swapData,
        extData,
      )
      .accounts({
        sourceConfig,
        globalConfig,
        sourceVault,
        sourceTree,
        sourceNullifiers,
        sourceNullifierMarker0: nullifierMarker0,
        sourceNullifierMarker1: nullifierMarker1,
        sourceVaultTokenAccount,
        sourceMintAccount: sourceMint,
        destConfig,
        destVault,
        destTree,
        destVaultTokenAccount,
        destMintAccount: destMint,
        executor: executorPDA,
        executorSourceToken,
        executorDestToken,
        relayer: wallet.publicKey,
        relayerTokenAccount: relayerTokenAccount.address,
        swapProgram: JUPITER_PROGRAM_ID,
        jupiterEventAuthority: JUPITER_EVENT_AUTHORITY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    // 17. Build Address Lookup Table for the versioned transaction
    const recentSlot = await connection.getSlot("finalized");
    const [createAltIx, altAddress] =
      AddressLookupTableProgram.createLookupTable({
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        recentSlot,
      });

    // Collect unique keys for ALT
    const altKeys: PublicKey[] = [];
    const seen = new Set<string>();
    for (const meta of swapIx.keys) {
      if (!seen.has(meta.pubkey.toBase58())) {
        seen.add(meta.pubkey.toBase58());
        altKeys.push(meta.pubkey);
      }
    }
    if (!seen.has(swapIx.programId.toBase58())) {
      altKeys.push(swapIx.programId);
    }

    // Also add Jupiter ALT addresses from the quote
    const jupiterAltTables = [];
    for (const addr of addressLookupTableAddresses) {
      try {
        const lut = await connection.getAddressLookupTable(new PublicKey(addr));
        if (lut.value) jupiterAltTables.push(lut.value);
      } catch {
        // Skip invalid ALT addresses
      }
    }

    // Create and extend our ALT
    const createAltTx = new Transaction().add(createAltIx);
    createAltTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    createAltTx.feePayer = wallet.publicKey;
    const signedCreateAlt = await wallet.signTransaction(createAltTx);
    const createAltSig = await connection.sendRawTransaction(
      signedCreateAlt.serialize(),
      { skipPreflight: true },
    );
    await connection.confirmTransaction(createAltSig, "confirmed");

    // Batch extend (max 20 keys per extend)
    for (let i = 0; i < altKeys.length; i += 20) {
      const batch = altKeys.slice(i, i + 20);
      const extendIx = AddressLookupTableProgram.extendLookupTable({
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        lookupTable: altAddress,
        addresses: batch,
      });
      const extendTx = new Transaction().add(extendIx);
      extendTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      extendTx.feePayer = wallet.publicKey;
      const signedExtend = await wallet.signTransaction(extendTx);
      const extendSig = await connection.sendRawTransaction(
        signedExtend.serialize(),
        { skipPreflight: true },
      );
      await connection.confirmTransaction(extendSig, "confirmed");
    }

    // Wait for ALT to activate
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fetch our ALT
    const lookupTableResult =
      await connection.getAddressLookupTable(altAddress);
    const lookupTables = [
      ...(lookupTableResult.value ? [lookupTableResult.value] : []),
      ...jupiterAltTables,
    ];

    // 18. Build versioned transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
        swapIx,
      ],
    }).compileToV0Message(lookupTables);

    const versionedTx = new VersionedTransaction(messageV0);
    versionedTx.sign([wallet.payer]);

    // 19. Send and confirm
    const txSignature = await connection.sendTransaction(versionedTx, {
      skipPreflight: true,
      maxRetries: 3,
    });
    await connection.confirmTransaction(txSignature, "confirmed");

    // 20. Mark spent notes
    for (const note of selection.selectedNotes) {
      await noteManager.markAsSpent(note.id, txSignature);
    }

    // 21. Persist output notes via ECDH to relayer for sync
    const recipientPubKeyBytes = wallet.publicKey.toBytes();
    const destNoteMint =
      outputSymbol === "SOL"
        ? PublicKey.default.toBase58()
        : destMint.toBase58();

    // Change note (source pool)
    if (changeAmount > 0n) {
      try {
        const changeBlob = createEncryptedNoteBlob(recipientPubKeyBytes, {
          blinding: changeBlinding,
          leafIndex: changeLeafIndex,
          commitment: changeCommitment,
          amount: changeAmount,
          mintAddress:
            sourceNoteMint === PublicKey.default.toBase58()
              ? sourceMint.toBase58()
              : sourceNoteMint,
          treeId: sourceTreeId,
        });
        await saveEncryptedNoteWithRetry({
          commitment: Buffer.from(changeCommitment).toString("hex"),
          ephemeralPublicKey: Buffer.from(
            changeBlob.ephemeralPublicKey,
          ).toString("base64"),
          encryptedBlob: changeBlob.encryptedBlob,
          timestamp: Date.now(),
          txSignature,
          recipientWalletPublicKey: wallet.publicKey.toBase58(),
        }).catch((e: unknown) =>
          console.warn("Failed to save change note:", e),
        );
      } catch (e: unknown) {
        console.warn("Failed to create change note blob:", e);
      }
    }

    // Dest note (dest pool)
    try {
      const destBlob = createEncryptedNoteBlob(recipientPubKeyBytes, {
        blinding: destBlinding,
        leafIndex: destLeafIndex,
        commitment: destCommitment,
        amount: destAmount,
        mintAddress:
          destNoteMint === PublicKey.default.toBase58()
            ? destMint.toBase58()
            : destNoteMint,
        treeId: destTreeId,
      });
      await saveEncryptedNoteWithRetry({
        commitment: Buffer.from(destCommitment).toString("hex"),
        ephemeralPublicKey: Buffer.from(destBlob.ephemeralPublicKey).toString(
          "base64",
        ),
        encryptedBlob: destBlob.encryptedBlob,
        timestamp: Date.now(),
        txSignature,
        recipientWalletPublicKey: wallet.publicKey.toBase58(),
      }).catch((e: unknown) => console.warn("Failed to save dest note:", e));
    } catch (e: unknown) {
      console.warn("Failed to create dest note blob:", e);
    }

    // Calculate human-readable amounts
    const inputDecimals = getTokenDecimals(
      inputSymbol === "SOL"
        ? PublicKey.default.toBase58()
        : sourceMint.toBase58(),
    );
    const outputDecimals = getTokenDecimals(destMint.toBase58());

    return {
      success: true,
      txSignature,
      inputSpent: fromRawAmount(swapAmountRaw.toString(), inputDecimals),
      outputReceived: fromRawAmount(minAmountOut.toString(), outputDecimals),
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Private swap failed:", error);
    return {
      success: false,
      inputSpent: "0",
      outputReceived: "0",
      error: errorMsg || "Private swap failed",
    };
  }
}
