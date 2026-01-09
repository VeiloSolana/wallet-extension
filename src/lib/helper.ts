import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import crypto from "crypto";
import { Keypair } from "@solana/web3.js";
import _sodium from "libsodium-wrappers";

export function encryptAES(
  plaintext: string,
  sharedSecret: Uint8Array
): Buffer {
  // Derive 256-bit key from shared secret
  const key = crypto.createHash("sha256").update(sharedSecret).digest();
  const iv = randomBytes(16); // Initialization vector

  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Prepend IV (needed for decryption)
  return Buffer.concat([iv, encrypted]);
}

export function decryptAES(
  ciphertext: Buffer,
  sharedSecret: Uint8Array
): Buffer {
  const key = crypto.createHash("sha256").update(sharedSecret).digest();
  const iv = ciphertext.slice(0, 16);
  const encrypted = ciphertext.slice(16);

  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// Ensure sodium is ready before using
_sodium.ready.then(() => {
  // Sodium initialization complete
});

/**
 * Derive shared secret using ECDH with Ed25519/X25519 conversion
 */
export async function deriveSharedSecret(
  myPrivateKey: Uint8Array, // 32 bytes Ed25519 private key
  theirPublicKey: Uint8Array // 32 bytes Ed25519 public key
): Promise<Uint8Array> {
  await _sodium.ready;

  // Convert Ed25519 keys to X25519 (Curve25519) for ECDH
  const myX25519Private = _sodium.crypto_sign_ed25519_sk_to_curve25519(
    // Solana keypair.secretKey is 64 bytes (32 seed + 32 public)
    // libsodium expects 64-byte secret key
    myPrivateKey.length === 32
      ? new Uint8Array([...myPrivateKey, ...new Uint8Array(32)])
      : myPrivateKey
  );

  const theirX25519Public =
    _sodium.crypto_sign_ed25519_pk_to_curve25519(theirPublicKey);

  // Perform ECDH: myPrivate * theirPublic
  const sharedSecret = _sodium.crypto_scalarmult(
    myX25519Private,
    theirX25519Public
  );

  return sharedSecret;
}

/**
 * Create encrypted note blob for Blind Mailbox
 * Alice generates ephemeral keypair and encrypts note data for Bob
 */
export async function createEncryptedNoteBlob(
  recipientPublicKey: Uint8Array, // Bob's Ed25519 public key (32 bytes)
  noteData: {
    blinding: Uint8Array;
    leafIndex: number;
    commitment: Uint8Array;
    amount: bigint;
  }
): Promise<{
  ephemeralPublicKey: Uint8Array;
  encryptedBlob: string; // Base64 encoded
}> {
  await _sodium.ready;

  // 1. Generate ephemeral keypair for this transaction
  const ephemeralKeypair = Keypair.generate();
  const ephemeralPrivateKey = ephemeralKeypair.secretKey.slice(0, 32);
  const ephemeralPublicKey = ephemeralKeypair.publicKey.toBytes();

  console.log("🔐 Generated ephemeral keypair for encryption");
  console.log(
    "   Ephemeral Public Key:",
    ephemeralKeypair.publicKey.toBase58()
  );

  // 2. Derive shared secret using ECDH
  const sharedSecret = await deriveSharedSecret(
    ephemeralPrivateKey,
    recipientPublicKey
  );

  console.log(
    "🔑 Derived shared secret:",
    Buffer.from(sharedSecret).toString("hex").slice(0, 16) + "..."
  );

  // 3. Prepare note data as JSON
  const noteJson = JSON.stringify({
    blinding: Buffer.from(noteData.blinding).toString("hex"),
    leafIndex: noteData.leafIndex,
    commitment: Buffer.from(noteData.commitment).toString("hex"),
    amount: noteData.amount.toString(),
    timestamp: Date.now(),
  });

  console.log("📦 Note data prepared for encryption:", noteJson);

  // 4. Encrypt the note data using AES-256-CBC with shared secret
  const encryptedBuffer = encryptAES(noteJson, sharedSecret);
  const encryptedBlob = encryptedBuffer.toString("base64");

  console.log(
    "🔒 Encrypted blob created (base64):",
    encryptedBlob.slice(0, 32) + "..."
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
export async function decryptNoteBlob(
  myPrivateKey: Uint8Array, // Bob's Ed25519 private key (32 bytes)
  ephemeralPublicKey: Uint8Array, // Alice's ephemeral public key (32 bytes)
  encryptedBlob: string // Base64 encoded
): Promise<{
  blinding: Uint8Array;
  leafIndex: number;
  commitment: Uint8Array;
  amount: bigint;
  timestamp: number;
  mintAddress?: string;
}> {
  await _sodium.ready;

  // 1. Derive the same shared secret Bob and Alice computed
  const sharedSecret = await deriveSharedSecret(
    myPrivateKey,
    ephemeralPublicKey
  );

  console.log(
    "🔑 Bob derived shared secret:",
    Buffer.from(sharedSecret).toString("hex").slice(0, 16) + "..."
  );

  // 2. Decrypt the blob
  const encryptedBuffer = Buffer.from(encryptedBlob, "base64");
  const decryptedBuffer = decryptAES(encryptedBuffer, sharedSecret);
  const noteJson = decryptedBuffer.toString("utf8");

  console.log("🔓 Decrypted note data:", noteJson);

  // 3. Parse and return the note data
  const parsed = JSON.parse(noteJson);
  return {
    blinding: Buffer.from(parsed.blinding, "hex"),
    leafIndex: parsed.leafIndex,
    commitment: Buffer.from(parsed.commitment, "hex"),
    amount: BigInt(parsed.amount),
    timestamp: parsed.timestamp,
  };
}
