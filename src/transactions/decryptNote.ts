import { Keypair } from "@solana/web3.js";
import { decryptNoteBlob } from "./ECDH/helpers";

export interface EncryptedNote {
  commitment: string; // hex string
  ephemeralPublicKey: string; // base64 string
  encryptedBlob: string; // base64 string
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
}

export interface DecryptedNote {
  blinding: Uint8Array;
  leafIndex: number;
  commitment: Uint8Array;
  amount: bigint;
  timestamp: number;
}

export async function decryptReceivedNote(
  wallet: Keypair,
  encryptedNote: EncryptedNote,
): Promise<DecryptedNote> {
  // Extract Bob's private key (first 32 bytes of secretKey)
  const bobPrivateKey = wallet.secretKey.slice(0, 32);

  // Decode the ephemeral public key from base64
  const ephemeralPublicKey = Buffer.from(
    encryptedNote.ephemeralPublicKey,
    "base64",
  );

  // Decrypt the blob
  const decrypted = await decryptNoteBlob(
    bobPrivateKey,
    ephemeralPublicKey,
    encryptedNote.encryptedBlob,
  );

  return decrypted;
}

export async function fetchAndDecryptNotes(
  wallet: Keypair,
  relayerUrl: string = process.env.NEXT_PUBLIC_RELAYER_API_URL ||
    "http://localhost:8080",
): Promise<DecryptedNote[]> {
  // Query relayer for notes encrypted to Bob's public key
  const publicKeyBase58 = wallet.publicKey.toBase58();

  const response = await fetch(
    `${relayerUrl}/api/notes?recipientPublicKey=${publicKeyBase58}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.statusText}`);
  }

  const { notes } = (await response.json()) as { notes: EncryptedNote[] };

  // Decrypt all notes
  const decryptedNotes: DecryptedNote[] = [];

  for (const encryptedNote of notes) {
    try {
      const decrypted = await decryptReceivedNote(wallet, encryptedNote);
      decryptedNotes.push(decrypted);
    } catch (error) {
      console.error(
        "Failed to decrypt note:",
        encryptedNote.commitment.slice(0, 16) + "...",
        error,
      );
    }
  }

  return decryptedNotes;
}
