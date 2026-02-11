import nacl from "tweetnacl";
import util from "tweetnacl-util";
import ed2curve from "ed2curve";
import { Keypair } from "@solana/web3.js";

const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = util;

/**
 * SHA-256 for NOTE encryption (truncated SHA-512)
 * IMPORTANT: This matches the OLD encryption code that used nacl.hash().slice(0, 32)
 * This is NOT real SHA-256, but ensures compatibility with existing encrypted notes!
 */
function sha256ForNotes(data: Uint8Array): Uint8Array {
  // Using SHA-512 and taking first 32 bytes (matches old note encryption)
  const hash = nacl.hash(data);
  return hash.slice(0, 32);
}

/**
 * REAL SHA-256 for AUTH encryption
 * This matches what the server/relayer uses: crypto.createHash('sha256')
 * Used for encrypting veiloPrivateKey in auth flow
 */
function sha256ForAuth(data: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z);
  const maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z);
  const sigma0 = (x: number) => rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
  const sigma1 = (x: number) => rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
  const gamma0 = (x: number) => rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
  const gamma1 = (x: number) => rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a;
  let h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;

  const msgLen = data.length;
  const bitLen = msgLen * 8;
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64);
  const padded = new Uint8Array(msgLen + padLen + 8);
  padded.set(data);
  padded[msgLen] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  const W = new Uint32Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] =
        (padded[i + t * 4] << 24) |
        (padded[i + t * 4 + 1] << 16) |
        (padded[i + t * 4 + 2] << 8) |
        padded[i + t * 4 + 3];
    }
    for (let t = 16; t < 64; t++) {
      W[t] =
        (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false);
  resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false);
  resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false);
  resultView.setUint32(20, h5, false);
  resultView.setUint32(24, h6, false);
  resultView.setUint32(28, h7, false);
  return result;
}

/**
 * Derive shared secret using ECDH
 * Matches the working test: slice to 32 bytes (seed), convert to X25519
 */
function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Uint8Array {
  const privateKey32 =
    myPrivateKey.length === 64 ? myPrivateKey.slice(0, 32) : myPrivateKey;

  const myX25519Private = ed2curve.convertSecretKey(privateKey32);
  const theirX25519Public = ed2curve.convertPublicKey(theirPublicKey);

  if (!myX25519Private || !theirX25519Public) {
    throw new Error("Failed to convert Ed25519 keys to X25519");
  }

  return nacl.scalarMult(myX25519Private, theirX25519Public);
}

/**
 * Encrypt using NaCl secretbox (for notes)
 */
export function encryptSecretBox(
  plaintext: string,
  sharedSecret: Uint8Array,
): Uint8Array {
  const key = sha256ForNotes(sharedSecret);
  const nonce = nacl.randomBytes(24);
  const messageUint8 = decodeUTF8(plaintext);
  const encrypted = nacl.secretbox(messageUint8, nonce, key);

  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);
  return result;
}

/**
 * Decrypt using NaCl secretbox (for notes)
 */
export function decryptSecretBox(
  ciphertext: Uint8Array,
  sharedSecret: Uint8Array,
): Uint8Array {
  const key = sha256ForNotes(sharedSecret);
  const nonce = ciphertext.slice(0, 24);
  const encrypted = ciphertext.slice(24);

  const decrypted = nacl.secretbox.open(encrypted, nonce, key);
  if (!decrypted) {
    throw new Error("Decryption failed - invalid ciphertext or key");
  }
  return decrypted;
}

/**
 * Create encrypted note blob for Blind Mailbox
 */
export function createEncryptedNoteBlob(
  recipientPublicKey: Uint8Array,
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
  encryptedBlob: string;
} {
  const ephemeralKeypair = Keypair.generate();
  const ephemeralPublicKey = ephemeralKeypair.publicKey.toBytes();

  const sharedSecret = deriveSharedSecret(
    ephemeralKeypair.secretKey,
    recipientPublicKey,
  );

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

  const encryptedBuffer = encryptSecretBox(noteJson, sharedSecret);
  const encryptedBlob = encodeBase64(encryptedBuffer);

  return { ephemeralPublicKey, encryptedBlob };
}

/**
 * Decrypt note blob
 */
export function decryptNoteBlob(
  myPrivateKey: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  encryptedBlob: string,
): {
  blinding: Uint8Array;
  leafIndex: number;
  commitment: Uint8Array;
  amount: bigint;
  timestamp: number;
  mintAddress?: string;
  treeId: number;
} {
  const sharedSecret = deriveSharedSecret(myPrivateKey, ephemeralPublicKey);
  const encryptedBuffer = decodeBase64(encryptedBlob);
  const decryptedBuffer = decryptSecretBox(encryptedBuffer, sharedSecret);
  const noteJson = encodeUTF8(decryptedBuffer);
  const parsed = JSON.parse(noteJson);

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

/**
 * Decrypt veiloPrivateKey from server (AUTH FLOW)
 * Uses REAL SHA-256 to match server encryption
 */
export function decryptVeiloKeyFromServer(
  myPrivateKey: Uint8Array,
  serverEphemeralPublicKey: Uint8Array,
  encryptedBlob: string,
): string {
  const sharedSecret = deriveSharedSecret(
    myPrivateKey,
    serverEphemeralPublicKey,
  );

  // Use REAL SHA-256 for auth (matches server)
  const key = sha256ForAuth(sharedSecret);
  const encryptedBuffer = decodeBase64(encryptedBlob);
  const nonce = encryptedBuffer.slice(0, 24);
  const encrypted = encryptedBuffer.slice(24);

  const decrypted = nacl.secretbox.open(encrypted, nonce, key);
  if (!decrypted) {
    throw new Error("Decryption failed - invalid ciphertext or key");
  }

  return encodeUTF8(decrypted);
}
