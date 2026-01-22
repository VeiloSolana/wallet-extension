import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Connection,
  ComputeBudgetProgram,
  SystemProgram,
  Transaction,
  SendTransactionError,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { buildPoseidon } from "circomlibjs";
import { getMerkleTree } from "../lib/api/relayerApi";
import { buildMerkleTree } from "../utils/merkletree";
import { getProgram, type WalletAdapter } from "../../program/program";
import { groth16 } from "snarkjs";
import { createEncryptedNoteBlob } from "./ECDH/helpers";
import { saveEncryptedNoteWithRetry } from "../lib/api/relayerApi";
import { getBestTreeForDeposit } from "./treeHelpers";
import bs58 from "bs58";

// === PERFORMANCE OPTIMIZATION: Cache expensive resources ===
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPoseidon: any = null;
let cachedZkAssets: {
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

async function preloadZkAssets() {
  if (!cachedZkAssets) {
    const [wasmResponse, zkeyResponse, vkeyResponse] = await Promise.all([
      fetch(WASM_PATH),
      fetch(ZKEY_PATH),
      fetch(VK_PATH),
    ]);

    const [wasm, zkey, vkey] = await Promise.all([
      wasmResponse.arrayBuffer(),
      zkeyResponse.arrayBuffer(),
      vkeyResponse.json(),
    ]);

    cachedZkAssets = { wasm, zkey, vkey };
  }
  return cachedZkAssets;
}

// Call this on app init to warm up the cache
export async function warmupDepositCache() {
  await Promise.all([getCachedPoseidon(), preloadZkAssets()]);
}

interface DepositNote {
  amount: bigint;
  commitment: Uint8Array;
  nullifier: Uint8Array;
  blinding: Uint8Array;
  privateKey: Uint8Array;
  treeId: number;
  publicKey: bigint;
  leafIndex: number;
  merklePath: {
    pathElements: bigint[];
    pathIndices: number[];
  };
  mintAddress?: PublicKey;
  timestamp?: number;
  spent?: boolean;
}

const WASM_PATH = "/zk/circuits/transaction/transaction_js/transaction.wasm";
const ZKEY_PATH = "/zk/circuits/transaction/transaction_final.zkey";
const VK_PATH = "/zk/circuits/transaction/transaction_verification_key.json";

const SOL_MINT = PublicKey.default;
const TREE_HEIGHT = 22; // Merkle tree depth (must match circuit)

// Skip client-side proof verification in production (on-chain verifies anyway)
// Set to true during development/debugging to catch issues early
const VERIFY_PROOF_CLIENT_SIDE = process.env.NODE_ENV === "development";

// Helper: Encode tree_id as 2-byte little-endian (u16)
function encodeTreeId(treeId: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(treeId, 0);
  return buffer;
}

function getNullifierMarkerPda(
  programId: PublicKey,
  mintAddress: PublicKey,
  treeId: number,
  nullifier: Uint8Array,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("nullifier_v3"),
      mintAddress.toBuffer(),
      encodeTreeId(treeId),
      Buffer.from(nullifier),
    ],
    programId,
  );
  return pda;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertProofToBytes(proof: any): {
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

async function generateTransactionProof(inputs: {
  root: Uint8Array;
  publicAmount: bigint;
  extDataHash: Uint8Array;
  mintAddress: PublicKey;
  inputNullifiers: [Uint8Array, Uint8Array];
  outputCommitments: [Uint8Array, Uint8Array];
  inputAmounts: [bigint, bigint];
  inputPrivateKeys: [Uint8Array, Uint8Array];
  inputPublicKeys: [bigint, bigint];
  inputBlindings: [Uint8Array, Uint8Array];
  inputMerklePaths: [
    { pathElements: bigint[]; pathIndices: number[] },
    { pathElements: bigint[]; pathIndices: number[] },
  ];
  outputAmounts: [bigint, bigint];
  outputOwners: [bigint, bigint];
  outputBlindings: [Uint8Array, Uint8Array];
}) {
  const circuitInputs = {
    root: bytesToBigIntBE(inputs.root).toString(),
    publicAmount: (() => {
      if (inputs.publicAmount < 0n) {
        const FR_MODULUS = BigInt(
          "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
        );
        return (FR_MODULUS + inputs.publicAmount).toString();
      }
      return inputs.publicAmount.toString();
    })(),
    extDataHash: bytesToBigIntBE(inputs.extDataHash).toString(),
    mintAddress: reduceToField(inputs.mintAddress.toBytes()).toString(),

    inputNullifier: inputs.inputNullifiers.map((n) =>
      bytesToBigIntBE(n).toString(),
    ),
    outputCommitment: inputs.outputCommitments.map((c) =>
      bytesToBigIntBE(c).toString(),
    ),

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

    outAmount: inputs.outputAmounts.map((a) => a.toString()),
    outPubkey: inputs.outputOwners.map((o) => o.toString()),
    outBlinding: inputs.outputBlindings.map((b) =>
      bytesToBigIntBE(b).toString(),
    ),
  };

  let proof, publicSignals;

  // Use cached ZK assets for faster proof generation
  const zkAssets = await preloadZkAssets();

  try {
    ({ proof, publicSignals } = await groth16.fullProve(
      circuitInputs,
      new Uint8Array(zkAssets.wasm),
      new Uint8Array(zkAssets.zkey),
    ));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("Proof generation failed:", errorMessage);
    throw e;
  }

  // Client-side verification is optional - on-chain program always verifies
  // Skip in production to save ~50-100ms
  if (VERIFY_PROOF_CLIENT_SIDE) {
    const valid = await groth16.verify(zkAssets.vkey, publicSignals, proof);
    if (!valid) {
      throw new Error("Generated proof is invalid!");
    }
  }

  return convertProofToBytes(proof);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRootFromAccount(acc: any): Uint8Array {
  const rootIndex = acc.rootIndex;
  const rootHistory = acc.rootHistory;
  if (!rootHistory || rootHistory.length === 0) {
    throw new Error("Root history is empty");
  }
  const root = rootHistory[rootIndex];
  return new Uint8Array(root);
}

export function randomBytes32(): Uint8Array {
  return Keypair.generate().publicKey.toBytes();
}

function bytesToBigIntBE(bytes: Uint8Array): bigint {
  return BigInt("0x" + Buffer.from(bytes).toString("hex"));
}

// Used for withdrawals - keeping for future use
function computeNullifier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poseidon: any,
  commitment: Uint8Array,
  leafIndex: number,
  privateKey: Uint8Array,
): Uint8Array {
  const commitmentField = poseidon.F.e(bytesToBigIntBE(commitment));
  const indexField = poseidon.F.e(BigInt(leafIndex));
  const keyField = poseidon.F.e(bytesToBigIntBE(privateKey));

  const signature = poseidon([keyField, commitmentField, indexField]);
  const nullifierHash = poseidon([commitmentField, indexField, signature]);
  const hashBytes = poseidon.F.toString(nullifierHash, 16).padStart(64, "0");
  return Uint8Array.from(Buffer.from(hashBytes, "hex"));
}

function reduceToField(bytes: Uint8Array): bigint {
  const FR_MODULUS = BigInt(
    "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
  );
  const value = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  return value % FR_MODULUS;
}

function computeCommitment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poseidon: any,
  amount: bigint,
  ownerPubkey: bigint,
  blinding: Uint8Array,
  mintAddress: PublicKey,
): Uint8Array {
  const amountField = poseidon.F.e(amount.toString());
  const ownerField = poseidon.F.e(ownerPubkey.toString());
  const blindingField = poseidon.F.e(bytesToBigIntBE(blinding));
  const mintField = poseidon.F.e(
    reduceToField(mintAddress.toBytes()).toString(),
  );

  const commitment = poseidon([
    amountField,
    ownerField,
    blindingField,
    mintField,
  ]);

  const hashBytes = poseidon.F.toString(commitment, 16).padStart(64, "0");
  return Uint8Array.from(Buffer.from(hashBytes, "hex"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function derivePublicKey(poseidon: any, privateKey: Uint8Array): bigint {
  const privateKeyField = poseidon.F.e(bytesToBigIntBE(privateKey));
  const publicKeyHash = poseidon([privateKeyField]);
  return poseidon.F.toObject(publicKeyHash);
}

function computeExtDataHash(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poseidon: any,
  extData: {
    recipient: PublicKey;
    relayer: PublicKey;
    fee: BN;
    refund: BN;
  },
): Uint8Array {
  const recipientField = poseidon.F.e(
    reduceToField(extData.recipient.toBytes()),
  );
  const relayerField = poseidon.F.e(reduceToField(extData.relayer.toBytes()));
  const feeField = poseidon.F.e(extData.fee.toString());
  const refundField = poseidon.F.e(extData.refund.toString());

  const hash1 = poseidon([recipientField, relayerField]);
  const hash2 = poseidon([feeField, refundField]);
  const finalHash = poseidon([hash1, hash2]);

  const hashBytes = poseidon.F.toString(finalHash, 16).padStart(64, "0");
  return Uint8Array.from(Buffer.from(hashBytes, "hex"));
}

export interface DepositParams {
  connection: Connection;
  depositor: WalletAdapter;
  depositAmount: bigint;
  recipientPublicKey: bigint;
  pubKey: PublicKey;
  mintAddress?: PublicKey;
  userTokenAccount?: PublicKey;
}

export const handleDeposit = async ({
  connection,
  depositor,
  depositAmount,
  recipientPublicKey,
  pubKey,
  mintAddress = SOL_MINT,
  userTokenAccount,
}: DepositParams): Promise<DepositNote> => {
  console.log("\n🔵 ========== DEPOSIT PROCESS STARTED ==========");
  console.log("📊 Deposit Parameters:", {
    depositor: depositor.publicKey.toBase58(),
    depositAmount: depositAmount.toString(),
    recipientPublicKey: recipientPublicKey.toString(),
    recipientWallet: pubKey.toBase58(),
    mintAddress: mintAddress.toBase58(),
    isToken: !mintAddress.equals(SOL_MINT),
    userTokenAccount: userTokenAccount?.toBase58() || "N/A",
  });

  const program = getProgram(connection, depositor);
  const provider = program.provider;
  const isToken = !mintAddress.equals(SOL_MINT);

  // === PARALLEL INITIALIZATION ===
  // Run expensive operations concurrently instead of sequentially
  const [poseidon, bestTree, { blockhash, lastValidBlockHeight }] =
    await Promise.all([
      getCachedPoseidon(),
      getBestTreeForDeposit(
        mintAddress,
        undefined,
        connection,
        depositor as WalletAdapter,
      ),
      connection.getLatestBlockhash("confirmed"),
    ]);

  // For deposits, we use tree 0 as input (dummy) and best available tree for output
  const inputTreeId = 0;
  const outputTreeId = bestTree?.treeId ?? 0;

  // Fetch tree data for the selected output tree
  const treeResponse = await getMerkleTree(
    mintAddress.toBase58(),
    outputTreeId,
  );

  // Compute all PDAs synchronously (these are cheap CPU operations)
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_config_v3"), mintAddress.toBuffer()],
    program.programId,
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_vault_v3"), mintAddress.toBuffer()],
    program.programId,
  );

  const [noteTree] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("privacy_note_tree_v3"),
      mintAddress.toBuffer(),
      encodeTreeId(inputTreeId),
    ],
    program.programId,
  );
  const [nullifiers] = PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_nullifiers_v3"), mintAddress.toBuffer()],
    program.programId,
  );

  // Global config PDA (no mint in seed)
  const [globalConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_config_v1")],
    program.programId,
  );

  // Output tree PDA
  const outputTreeIdBuffer = Buffer.alloc(2);
  outputTreeIdBuffer.writeUInt16LE(outputTreeId, 0);
  const [outputTree] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("privacy_note_tree_v3"),
      mintAddress.toBuffer(),
      outputTreeIdBuffer,
    ],
    program.programId,
  );

  const offchainTree = treeResponse?.data
    ? buildMerkleTree(treeResponse.data, poseidon)
    : new (await import("../utils/merkletree")).OffchainMerkleTree(
        TREE_HEIGHT,
        poseidon,
      );

  const bobPublicKey = recipientPublicKey;
  const bobBlinding = randomBytes32();

  const bobCommitment = computeCommitment(
    poseidon,
    depositAmount,
    bobPublicKey,
    bobBlinding,
    mintAddress,
  );

  const dummyOutputPrivKey = randomBytes32();
  const dummyOutputPubKey = derivePublicKey(poseidon, dummyOutputPrivKey);
  const dummyOutputBlinding = randomBytes32();
  const dummyOutputAmount = 0n;

  const dummyOutputCommitment = computeCommitment(
    poseidon,
    dummyOutputAmount,
    dummyOutputPubKey,
    dummyOutputBlinding,
    mintAddress,
  );

  const bobLeafIndex = offchainTree.nextIndex;

  // Generate dummy inputs for the circuit (these are required by the ZK proof)
  const dummyPrivKey0 = randomBytes32();
  const dummyPrivKey1 = randomBytes32();
  const dummyBlinding0 = randomBytes32();
  const dummyBlinding1 = randomBytes32();

  const dummyPubKey0 = derivePublicKey(poseidon, dummyPrivKey0);
  const dummyPubKey1 = derivePublicKey(poseidon, dummyPrivKey1);

  const dummyCommitment0 = computeCommitment(
    poseidon,
    0n,
    dummyPubKey0,
    dummyBlinding0,
    mintAddress,
  );
  const dummyCommitment1 = computeCommitment(
    poseidon,
    0n,
    dummyPubKey1,
    dummyBlinding1,
    mintAddress,
  );

  const dummyNullifier0 = computeNullifier(
    poseidon,
    dummyCommitment0,
    0,
    dummyPrivKey0,
  );
  const dummyNullifier1 = computeNullifier(
    poseidon,
    dummyCommitment1,
    0,
    dummyPrivKey1,
  );

  const extData = {
    recipient: depositor.publicKey,
    relayer: depositor.publicKey,
    fee: new BN(0),
    refund: new BN(0),
  };

  const extDataHash = computeExtDataHash(poseidon, extData);

  // === PARALLEL: Fetch on-chain data and resolve token accounts concurrently ===
  const tokenAccountPromise = isToken
    ? (async () => {
        const vaultAta = await getAssociatedTokenAddress(
          mintAddress,
          vault,
          true,
        );
        const depositorAta = userTokenAccount
          ? userTokenAccount
          : (
              await getOrCreateAssociatedTokenAccount(
                connection,
                depositor.payer,
                mintAddress,
                depositor.publicKey,
              )
            ).address;
        return {
          vaultTokenAccount: vaultAta,
          depositorTokenAccount: depositorAta,
        };
      })()
    : Promise.resolve({
        vaultTokenAccount: depositor.publicKey,
        depositorTokenAccount: depositor.publicKey,
      });

  const [noteTreeAcc, tokenAccounts] = await Promise.all([
    program.account.merkleTreeAccount.fetch(noteTree),
    tokenAccountPromise,
  ]);

  const { vaultTokenAccount, depositorTokenAccount } = tokenAccounts;
  const onchainRoot = extractRootFromAccount(noteTreeAcc);

  const zeros = offchainTree.getZeros();
  const zeroPathElements = zeros
    .slice(0, 22)
    .map((z: Uint8Array) => bytesToBigIntBE(z));
  console.log("🔐 Generating ZK proof...");
  const proof = await generateTransactionProof({
    root: onchainRoot,
    publicAmount: depositAmount,
    extDataHash,
    mintAddress,
    inputNullifiers: [dummyNullifier0, dummyNullifier1],
    outputCommitments: [bobCommitment, dummyOutputCommitment],

    inputAmounts: [0n, 0n],
    inputPrivateKeys: [dummyPrivKey0, dummyPrivKey1],
    inputPublicKeys: [dummyPubKey0, dummyPubKey1],
    inputBlindings: [dummyBlinding0, dummyBlinding1],
    inputMerklePaths: [
      {
        pathElements: zeroPathElements,
        pathIndices: new Array(22).fill(0),
      },
      {
        pathElements: zeroPathElements,
        pathIndices: new Array(22).fill(0),
      },
    ],

    outputAmounts: [depositAmount, dummyOutputAmount],
    outputOwners: [bobPublicKey, dummyOutputPubKey],
    outputBlindings: [bobBlinding, dummyOutputBlinding],
  });

  console.log("✅ ZK proof generated successfully");

  const nullifierMarker0 = getNullifierMarkerPda(
    program.programId,
    mintAddress,
    inputTreeId,
    dummyNullifier0,
  );
  const nullifierMarker1 = getNullifierMarkerPda(
    program.programId,
    mintAddress,
    inputTreeId,
    dummyNullifier1,
  );

  const publicAmount = new BN(depositAmount.toString());

  console.log("📝 Building transaction...");

  try {
    const tx = await program.methods
      .transact(
        Array.from(onchainRoot),
        inputTreeId,
        outputTreeId,
        publicAmount,
        Array.from(extDataHash),
        mintAddress,
        Array.from(dummyNullifier0),
        Array.from(dummyNullifier1),
        Array.from(bobCommitment),
        Array.from(dummyOutputCommitment),
        extData,
        proof,
      )
      .accountsStrict({
        config,
        globalConfig,
        vault,
        inputTree: noteTree,
        outputTree: outputTree,
        nullifiers,
        nullifierMarker0,
        nullifierMarker1,
        relayer: depositor.publicKey,
        recipient: depositor.publicKey,
        vaultTokenAccount,
        userTokenAccount: depositorTokenAccount,
        recipientTokenAccount: depositorTokenAccount,
        relayerTokenAccount: depositorTokenAccount,
        tokenProgram: isToken ? TOKEN_PROGRAM_ID : SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000,
    });
    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1,
    });

    const transaction = new Transaction();
    transaction.add(modifyComputeUnits);
    transaction.add(addPriorityFee);
    transaction.add(tx);

    // Use pre-fetched blockhash from parallel initialization (already fresh)
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = depositor.publicKey;

    console.log("✅ Transaction built successfully");
    console.log("✍️  Signing transaction...");

    // Sign the transaction first so we can extract the signature
    const signedTransaction = await depositor.signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();

    // Get signature from the signed transaction (first signature is the fee payer's)
    const txSignature = signedTransaction.signatures[0];
    if (!txSignature || !txSignature.signature) {
      throw new Error("Failed to get transaction signature");
    }
    const signature = bs58.encode(txSignature.signature);

    console.log("✅ Transaction signed, signature:", signature);
    console.log("📤 Sending transaction to network...");

    try {
      // Send the raw transaction with skipPreflight: true to prevent "already processed" errors
      // incorrectly flagging successful submissions during simulation
      await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 0,
      });

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        );
      }

      console.log("✅ Transaction confirmed on-chain!");
    } catch (sendError) {
      // Handle "already processed" error - the transaction actually succeeded
      if (
        sendError instanceof Error &&
        sendError.message.includes("already been processed")
      ) {
        // Transaction was already processed - treat as success
      } else {
        throw sendError;
      }
    }

    // Insert commitments into offchain tree AFTER successful transaction
    console.log("🌳 Updating merkle tree with new commitments...");
    offchainTree.insert(bobCommitment);
    offchainTree.insert(dummyOutputCommitment);
    console.log("✅ Merkle tree updated");

    const signatureStatus = await connection.getSignatureStatus(signature);
    const blockHeight = signatureStatus?.value?.slot || 0;
    const bobPublicKeyBytes = pubKey.toBytes();

    console.log("🔒 Creating encrypted note...");
    const encryptedNote = await createEncryptedNoteBlob(bobPublicKeyBytes, {
      blinding: bobBlinding,
      leafIndex: bobLeafIndex,
      commitment: bobCommitment,
      amount: depositAmount,
      mintAddress: mintAddress.toBase58(),
      treeId: outputTreeId,
    });

    const newRoot = offchainTree.getRoot();

    const relayerPayload = {
      commitment: Buffer.from(bobCommitment).toString("hex"),
      ephemeralPublicKey: Buffer.from(
        encryptedNote.ephemeralPublicKey,
      ).toString("base64"),
      encryptedBlob: encryptedNote.encryptedBlob,
      timestamp: Date.now(),
      blockHeight: blockHeight,
      txSignature: signature,
      leafIndex: bobLeafIndex,
      newRoot: Buffer.from(newRoot).toString("hex"),
      mintAddress: mintAddress.toBase58(),
      recipientWalletPublicKey: pubKey.toBase58(),
    };

    console.log("✅ Encrypted note created");
    console.log("💾 Saving note to relayer...", {
      commitment: relayerPayload.commitment.slice(0, 16) + "...",
      leafIndex: bobLeafIndex,
      mintAddress: mintAddress.toBase58(),
      recipientWallet: pubKey.toBase58(),
    });

    try {
      const response = await saveEncryptedNoteWithRetry(relayerPayload);

      if (!response.success) {
        throw new Error(response.message || "Failed to save note");
      }
      console.log("✅ Note saved to relayer successfully!");
    } catch (saveError) {
      // Add to persistent retry queue for background processing
      console.warn(
        "⚠️ Failed to save note - adding to retry queue:",
        saveError,
      );
      await saveEncryptedNoteWithRetry(relayerPayload, 5);
    }

    const updatedMerklePath = offchainTree.getMerkleProof(bobLeafIndex);
    const noteToSave: DepositNote = {
      amount: depositAmount,
      commitment: bobCommitment,
      nullifier: new Uint8Array(32),
      blinding: bobBlinding,
      privateKey: new Uint8Array(32),
      publicKey: bobPublicKey,
      leafIndex: bobLeafIndex,
      merklePath: updatedMerklePath,
      mintAddress,
      treeId: outputTreeId,
    };

    console.log("\n✅ ========== DEPOSIT COMPLETED SUCCESSFULLY ==========");
    console.log("📦 Note details:", {
      amount: depositAmount.toString(),
      leafIndex: bobLeafIndex,
      treeId: outputTreeId,
      mintAddress: mintAddress.toBase58(),
      txSignature: signature,
    });
    console.log("🔵 =================================================\n");

    return noteToSave;
  } catch (e) {
    console.error("\n❌ ========== DEPOSIT FAILED ==========");
    console.error("💥 Error details:", e);
    if (e instanceof SendTransactionError) {
      const logs = await e.getLogs(provider.connection);
      console.error("📜 Transaction Logs:", logs);
    } else if (e instanceof Error) {
      console.error("📋 Error message:", e.message);
      console.error("📋 Error stack:", e.stack);
    } else {
      console.error("❓ Unknown error:", e);
    }
    console.error("🔴 =======================================\n");
    throw e;
  }
};
