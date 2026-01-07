
import { queryEncryptedNotes } from './relayerApi';
import { decryptNoteBlob } from './noteDecryption';
import { NoteManager } from './noteManager';
import { loadToken } from '../utils/storage'; 

const noteManager = new NoteManager();

export async function syncNotesFromRelayer(privateKey: string) {
  try {
    const lastSyncTimestamp = await getLastSyncTimestamp();

    console.log('📡 Syncing notes from relayer...');
    
    // 1. Query new notes
    // We fetch notes slightly overlapping with last sync to be safe
    const response = await queryEncryptedNotes({
      lastCheckedTimestamp: lastSyncTimestamp ? Math.max(0, lastSyncTimestamp - 10000) : 0, 
      limit: 100,
    });

    if (response.notes.length === 0) {
      console.log('No new notes found.');
      return 0;
    }

    console.log(`📬 Found ${response.notes.length} candidate notes.`);

    let decryptedCount = 0;

    // 2. Try to decrypt each note
    for (const encryptedNote of response.notes) {
      try {
        // Check if we already have this note
        const existing = await noteManager.getNoteByCommitment(encryptedNote.commitment);
        if (existing) {
          continue;
        }

        const ephemeralPubKey = Buffer.from(encryptedNote.ephemeralPublicKey, 'base64');

        // Decrypt
        // Note: privateKey string should be converted to Uint8Array/Buffer
        // We assume privateKey input is hex string or similar normal format
        const privKeyBuffer = Buffer.from(privateKey, 'hex'); // Adjust if input is different

        const decrypted = await decryptNoteBlob(
          privKeyBuffer,
          ephemeralPubKey,
          encryptedNote.encryptedBlob
        );

        // 3. Save to storage
        await noteManager.saveNote({
          amount: decrypted.amount.toString(),
          commitment: encryptedNote.commitment,
          root: "dummy_root_from_sync", // Real impl would fetch root for blockHeight
          nullifier: Buffer.from(decrypted.nullifier).toString('hex'),
          blinding: Buffer.from(decrypted.blinding).toString('hex'),
          privateKey: privateKey,
          publicKey: Buffer.from(decrypted.publicKey).toString('hex'),
          leafIndex: decrypted.leafIndex,
          timestamp: encryptedNote.timestamp,
          txSignature: encryptedNote.txSignature,
        });

        decryptedCount++;
      } catch (error) {
        // Decryption failed = not our note. Ignore.
      }
    }

    console.log(`✅ Sync complete. ${decryptedCount} new notes saved.`);
    
    // Update last sync timestamp
    await updateLastSyncTimestamp(Date.now());
    
    return decryptedCount;
  } catch (error) {
    console.error('Note sync failed:', error);
    throw error;
  }
}

// Helpers for sync timestamp
const SYNC_TIME_KEY = 'veilo_last_sync_time';
const isExtension = typeof chrome !== 'undefined' && !!chrome.storage;

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
