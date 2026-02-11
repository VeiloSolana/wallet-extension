import nacl from "tweetnacl";
import util from "tweetnacl-util";
import ed2curve from "ed2curve";
import { Keypair } from "@solana/web3.js";

const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = util;

/**
 * SHA-256 hash function (cross-platform compatible)
 * MUST match encryption: Using tweetnacl's hash function (SHA-512) and truncating to 256 bits
 * This is NOT real SHA-256, but it's what the encryption side uses!
 */
function sha256(data: Uint8Array): Uint8Array {
  // Using SHA-512 and taking first 32 bytes (matches encryption logic)
  const hash = nacl.hash(data);
  return hash.slice(0, 32);
}

/**
 * Encrypt using NaCl secretbox (authenticated encryption)
 * Replaces AES-256-CBC with XSalsa20-Poly1305 (more secure and simpler)
 */
export function encryptSecretBox(
  plaintext: string,
  sharedSecret: Uint8Array,
): Uint8Array {
  // Derive 256-bit key from shared secret (MUST match encryption)
  const key = sha256(sharedSecret);

  // Generate random nonce (24 bytes for secretbox)
  const nonce = nacl.randomBytes(24);

  // Convert plaintext to Uint8Array
  const messageUint8 = decodeUTF8(plaintext);

  // Encrypt with authenticated encryption
  const encrypted = nacl.secretbox(messageUint8, nonce, key);

  // Prepend nonce (needed for decryption)
  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);

  return result;
}

/**
 * Decrypt using NaCl secretbox
 */
export function decryptSecretBox(
  ciphertext: Uint8Array,
  sharedSecret: Uint8Array,
): Uint8Array {
  // Derive key (MUST match encryption)
  const key = sha256(sharedSecret);

  // Extract nonce and encrypted data
  const nonce = ciphertext.slice(0, 24);
  const encrypted = ciphertext.slice(24);

  // Decrypt
  const decrypted = nacl.secretbox.open(encrypted, nonce, key);

  if (!decrypted) {
    throw new Error("Decryption failed - invalid ciphertext or key");
  }

  return decrypted;
}

/**
 * Derive shared secret using ECDH with Ed25519/X25519 conversion
 * Cross-platform compatible using ed2curve
 */
export function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array, // 32 bytes Ed25519 public key
): Uint8Array {
  // Simple approach that matches the working test:
  // If we have 64 bytes, slice to get the first 32 (seed)
  const privateKey32 =
    myPrivateKey.length === 64 ? myPrivateKey.slice(0, 32) : myPrivateKey;

  // Convert Ed25519 keys to X25519 for ECDH
  const myX25519Private = ed2curve.convertSecretKey(privateKey32);
  const theirX25519Public = ed2curve.convertPublicKey(theirPublicKey);

  if (!myX25519Private || !theirX25519Public) {
    throw new Error("Failed to convert Ed25519 keys to X25519");
  }

  // Perform ECDH: myPrivate * theirPublic
  const sharedSecret = nacl.scalarMult(myX25519Private, theirX25519Public);

  return sharedSecret;
}

/**
 * Create encrypted note blob for Blind Mailbox
 * Alice generates ephemeral keypair and encrypts note data for Bob
 */
export function createEncryptedNoteBlob(
  recipientPublicKey: Uint8Array, // Bob's Ed25519 public key (32 bytes)
  noteData: {
    blinding: Uint8Array;
    leafIndex: number;
    commitment: Uint8Array;
    amount: bigint;
    mintAddress: string;
    treeId: number;
  },
): {
  ephemeralPublicKey: Uint8Array;
  encryptedBlob: string; // Base64 encoded
} {
  // 1. Generate ephemeral keypair for this transaction
  const ephemeralKeypair = Keypair.generate();
  const ephemeralPublicKey = ephemeralKeypair.publicKey.toBytes();

  console.log("🔐 Generated ephemeral keypair for encryption");
  console.log(
    "   Ephemeral Public Key:",
    ephemeralKeypair.publicKey.toBase58(),
  );

  // 2. Derive shared secret using ECDH (pass full 64-byte secretKey)
  const sharedSecret = deriveSharedSecret(
    ephemeralKeypair.secretKey, // Full 64-byte secretKey
    recipientPublicKey,
  );

  console.log(
    "🔑 Derived shared secret:",
    Array.from(sharedSecret.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("") + "...",
  );

  // 3. Prepare note data as JSON
  const noteJson = JSON.stringify({
    blinding: Array.from(noteData.blinding)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    leafIndex: noteData.leafIndex,
    commitment: Array.from(noteData.commitment)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    amount: noteData.amount.toString(),
    mintAddress: noteData.mintAddress,
    timestamp: Date.now(),
    treeId: noteData.treeId,
  });

  console.log("📦 Note data prepared for encryption:", noteJson);

  // 4. Encrypt the note data using NaCl secretbox with shared secret
  const encryptedBuffer = encryptSecretBox(noteJson, sharedSecret);
  const encryptedBlob = encodeBase64(encryptedBuffer);

  console.log(
    "🔒 Encrypted blob created (base64):",
    encryptedBlob.slice(0, 32) + "...",
  );

  return {
    ephemeralPublicKey,
    encryptedBlob,
  };
}

/**
 * Decrypt note blob (Bob's side)
 * Bob uses his private key + Alice's ephemeral public key to decrypt
 */
export function decryptNoteBlob(
  myPrivateKey: Uint8Array, // Bob's Ed25519 private key (32 bytes)
  ephemeralPublicKey: Uint8Array, // Alice's ephemeral public key (32 bytes)
  encryptedBlob: string, // Base64 encoded
): {
  blinding: Uint8Array;
  leafIndex: number;
  commitment: Uint8Array;
  amount: bigint;
  timestamp: number;
  mintAddress?: string;
  treeId: number;
} {
  // 1. Derive the same shared secret Bob and Alice computed
  const sharedSecret = deriveSharedSecret(myPrivateKey, ephemeralPublicKey);

  console.log(
    "🔑 Bob derived shared secret:",
    Array.from(sharedSecret.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("") + "...",
  );

  // 2. Decrypt the blob
  const encryptedBuffer = decodeBase64(encryptedBlob);
  const decryptedBuffer = decryptSecretBox(encryptedBuffer, sharedSecret);
  const noteJson = encodeUTF8(decryptedBuffer);

  console.log("🔓 Decrypted note data:", noteJson);

  // 3. Parse and return the note data
  const parsed = JSON.parse(noteJson);

  // Convert hex strings back to Uint8Array
  const hexToUint8Array = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  return {
    blinding: hexToUint8Array(parsed.blinding),
    leafIndex: parsed.leafIndex,
    commitment: hexToUint8Array(parsed.commitment),
    amount: BigInt(parsed.amount),
    timestamp: parsed.timestamp,
    mintAddress: parsed.mintAddress,
    treeId: parsed.treeId,
  };
}
