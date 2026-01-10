import { queryEncryptedNotes, getMerkleTree } from "./relayerApi";
import { decryptNoteBlob } from "./helper";
import { NoteManager } from "./noteManager";
import { buildPoseidon } from "circomlibjs";
import { buildMerkleTree } from "./merkleTree";

function bytesToBigIntBE(bytes: Uint8Array): bigint {
  return BigInt("0x" + Buffer.from(bytes).toString("hex"));
}

function computeNullifier(
  poseidon: any,
  commitment: Uint8Array,
  leafIndex: number,
  privateKey: Uint8Array
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
  veiloPublicKey: string
) {
  const poseidon = await buildPoseidon();
  try {
    const lastSyncTimestamp = await getLastSyncTimestamp();

    console.log("📡 Syncing notes from relayer...", publicKey);

    // 1. Query new notes
    // We fetch notes slightly overlapping with last sync to be safe
    const response = await queryEncryptedNotes({
      lastCheckedTimestamp: lastSyncTimestamp
        ? Math.max(0, lastSyncTimestamp - 10000)
        : 0,
      limit: 100,
    });

    if (response.notes.length === 0) {
      console.log("No new notes found.");
      return 0;
    }

    console.log(`📬 Found ${response.notes.length} candidate notes.`);

    let decryptedCount = 0;

    // 3. Try to decrypt each note
    for (const encryptedNote of response.notes) {
      try {
        // Check if we already have this note
        const existing = await noteManager.getNoteByCommitment(
          encryptedNote.commitment
        );
        if (existing) {
          // Update spent status if it differs from relayer
          const relayerSpent = encryptedNote.spent ?? false;
          if (relayerSpent !== existing.spent) {
            if (relayerSpent) {
              await noteManager.markAsSpent(
                existing.id,
                encryptedNote.txSignature || "unknown"
              );
              console.log(
                `✓ Marked note as spent: ${existing.commitment.slice(0, 8)}...`
              );
            }
            // Note: We don't unmark spent notes since that shouldn't happen in normal flow
          }
          continue;
        }

        const ephemeralPubKey = Buffer.from(
          encryptedNote.ephemeralPublicKey,
          "base64"
        );

        // Decrypt
        // Note: privateKey string should be converted to Uint8Array/Buffer
        // We assume privateKey input is hex string or similar normal format
        const privKeyBuffer = Buffer.from(privateKey, "hex"); // Adjust if input is different

        const decrypted = await decryptNoteBlob(
          privKeyBuffer,
          ephemeralPubKey,
          encryptedNote.encryptedBlob
        );

        // 2. Fetch and build merkle tree
        const merkleTreeResponse = await getMerkleTree(decrypted.mintAddress);
        const offchainTree = buildMerkleTree(merkleTreeResponse.data, poseidon);
        console.log(
          `🌲 Merkle tree built with ${merkleTreeResponse.data.totalCommitments} commitments`
        );
        // Get merkle proof for this note's leaf index
        const merklePath = offchainTree.getMerkleProof(decrypted.leafIndex);

        const veiloPrivKeyBuffer = Buffer.from(veiloPrivateKey, "hex");
        const nullifier = computeNullifier(
          poseidon,
          decrypted.commitment,
          decrypted.leafIndex,
          veiloPrivKeyBuffer
        );
        console.log({
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
        });
        // 4. Save to storage
        await noteManager.saveNote({
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
          mintAddress: decrypted.mintAddress || "", // Default to empty string if undefined
        });
        console.log("made it here");

        decryptedCount++;
      } catch (error) {
        // Decryption failed = not our note. Ignore.
        console.log(
          "Note decryption failed (likely not our note):",
          (error as Error).message
        );
      }
    }

    console.log(`✅ Sync complete. ${decryptedCount} new notes saved.`);

    // Update last sync timestamp
    await updateLastSyncTimestamp(Date.now());

    return decryptedCount;
  } catch (error) {
    console.error("Note sync failed:", error);
    throw error;
  }
}

// Helpers for sync timestamp
const SYNC_TIME_KEY = "veilo_last_sync_time";
const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

async function getLastSyncTimestamp(): Promise<number> {
  if (isExtension) {
    const res = await chrome.storage.local.get(SYNC_TIME_KEY);
    return (res[SYNC_TIME_KEY] as number) || 0;
  } else {
    const val = localStorage.getItem(SYNC_TIME_KEY);
    return val ? parseInt(val) : 0;
  }
}

async function updateLastSyncTimestamp(ts: number): Promise<void> {
  if (isExtension) {
    await chrome.storage.local.set({ [SYNC_TIME_KEY]: ts });
  } else {
    localStorage.setItem(SYNC_TIME_KEY, ts.toString());
  }
}
