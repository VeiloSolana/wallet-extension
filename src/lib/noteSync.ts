import { queryEncryptedNotes, getMerkleTree } from "./api/relayerApi";
import { decryptNoteBlob } from "./helper";
import { NoteManager } from "./noteManager";
import { buildPoseidon } from "circomlibjs";
import { buildMerkleTree } from "../utils/merkletree/index";

function bytesToBigIntBE(bytes: Uint8Array): bigint {
  return BigInt("0x" + Buffer.from(bytes).toString("hex"));
}

function computeNullifier(
  poseidon: any,
  commitment: Uint8Array,
  leafIndex: number,
  privateKey: Uint8Array,
): Uint8Array {
  const commitmentField = poseidon.F.e(bytesToBigIntBE(commitment));
  const indexField = poseidon.F.e(BigInt(leafIndex));
  const keyField = poseidon.F.e(bytesToBigIntBE(privateKey));

  // Step 1: Compute signature
  const signature = poseidon([keyField, commitmentField, indexField]);

  // Step 2: Compute nullifier
  const nullifierHash = poseidon([commitmentField, indexField, signature]);
  const hashBytes = poseidon.F.toString(nullifierHash, 16).padStart(64, "0");
  return Uint8Array.from(Buffer.from(hashBytes, "hex"));
}

export async function syncNotesFromRelayer(
  noteManager: NoteManager,
  publicKey: string,
  privateKey: string,
  veiloPrivateKey: string,
  veiloPublicKey: string,
) {
  const poseidon = await buildPoseidon();
  try {
    console.log("📡 Syncing notes from relayer...");

    // 1. Query notes by wallet public key
    const response = await queryEncryptedNotes({
      walletPublicKey: publicKey,
      limit: 100,
    });

    if (response.notes.length === 0) {
      return 0;
    }

    console.log(`📬 Found ${response.notes.length} candidate notes.`);

    // Cache for merkle trees by mint+treeId to avoid rebuilding
    const merkleTreeCache = new Map<string, any>();

    // Batch notes to save
    const notesToSave: Array<Parameters<typeof noteManager.saveNote>[0]> = [];
    const privKeyBuffer = Buffer.from(privateKey, "hex");
    const veiloPrivKeyBuffer = Buffer.from(veiloPrivateKey, "hex");

    // Process notes in parallel batches for decryption
    // Batch size balances parallelism (faster) vs memory usage
    // 10-15 is optimal for crypto operations without overwhelming the browser
    const batchSize = 10;
    for (let i = 0; i < response.notes.length; i += batchSize) {
      const batch = response.notes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (encryptedNote) => {
          try {
            // Check if we already have this note
            const existing = await noteManager.getNoteByCommitment(
              encryptedNote.commitment,
            );
            if (existing) {
              // Update spent status if it differs
              const relayerSpent = encryptedNote.spent ?? false;
              if (relayerSpent && !existing.spent) {
                await noteManager.markAsSpent(existing.id, encryptedNote.spentTx || "");
              }
              return;
            }

            const ephemeralPubKey = Buffer.from(
              encryptedNote.ephemeralPublicKey,
              "base64",
            );

            // Decrypt note
            const decrypted = await decryptNoteBlob(
              privKeyBuffer,
              ephemeralPubKey,
              encryptedNote.encryptedBlob,
            );

            // Get or build merkle tree (cached by mint+treeId)
            const cacheKey = `${decrypted.mintAddress}_${decrypted.treeId}`;
            let offchainTree = merkleTreeCache.get(cacheKey);

            if (!offchainTree) {
              const merkleTreeResponse = await getMerkleTree(
                decrypted.mintAddress,
                decrypted.treeId,
              );
              offchainTree = buildMerkleTree(merkleTreeResponse.data, poseidon);
              merkleTreeCache.set(cacheKey, offchainTree);
            }

            // Get merkle proof
            const merklePath = offchainTree.getMerkleProof(decrypted.leafIndex);

            // Compute nullifier
            const nullifier = computeNullifier(
              poseidon,
              decrypted.commitment,
              decrypted.leafIndex,
              veiloPrivKeyBuffer,
            );

            // Add to batch
            notesToSave.push({
              amount: decrypted.amount.toString(),
              commitment: Buffer.from(decrypted.commitment).toString("hex"),
              root: Buffer.from(offchainTree.getRoot()).toString("hex"),
              nullifier: Buffer.from(nullifier).toString("hex"),
              blinding: Buffer.from(decrypted.blinding).toString("hex"),
              privateKey: veiloPrivateKey,
              publicKey: veiloPublicKey,
              merklePath: merklePath,
              leafIndex: decrypted.leafIndex,
              timestamp: encryptedNote.timestamp,
              txSignature: encryptedNote.txSignature,
              spent: encryptedNote.spent ?? false,
              mintAddress: decrypted.mintAddress || "",
              treeId: decrypted.treeId,
              onchainId: encryptedNote.onchainId,
            });
          } catch (error) {
            // Decryption failed = not our note. Ignore silently.
          }
        }),
      );
    }

    // Batch save all notes at once
    let savedIds: string[] = [];
    if (notesToSave.length > 0) {
      savedIds = await noteManager.saveNotesBatch(notesToSave);
      console.log(`✅ Sync complete. ${savedIds.length} new notes saved.`);
    } else {
      console.log("✅ Sync complete. No new notes.");
    }

    // Update last sync timestamp
    await updateLastSyncTimestamp(Date.now());

    return savedIds.length;
  } catch (error) {
    console.error("Note sync failed:", error);
    throw error;
  }
}

// Helpers for sync timestamp
const SYNC_TIME_KEY = "veilo_last_sync_time";
const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

async function updateLastSyncTimestamp(ts: number): Promise<void> {
  if (isExtension) {
    await chrome.storage.local.set({ [SYNC_TIME_KEY]: ts });
  } else {
    localStorage.setItem(SYNC_TIME_KEY, ts.toString());
  }
}
