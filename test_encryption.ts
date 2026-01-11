import nacl from "tweetnacl";
import util from "tweetnacl-util";

// --- SIMULATION SETUP ---

// 1. Generate Fake Relayer Keys (Ideally this is fixed on the server)
const relayerKeys = nacl.box.keyPair();
const RELAYER_PUBLIC_KEY = relayerKeys.publicKey; // This would be hardcoded in the client
const RELAYER_PRIVATE_KEY = relayerKeys.secretKey; // This stays on the server

console.log(
  "Relayer Public Key (Client sees this):",
  util.encodeBase64(RELAYER_PUBLIC_KEY)
);
console.log(
  "Relayer Private Key (Server keeps this):",
  util.encodeBase64(RELAYER_PRIVATE_KEY)
);
console.log("---------------------------------------------------");

// --- CLIENT SIDE ---

/**
 * Encrypts any JSON data for the Relayer using an ephemeral keypair.
 * Returns a Base64 string containing: [EphemeralPubKey (32) + Nonce (24) + Ciphertext (...)]
 */
function encryptForRelayer(data: any): string {
  // 1. Generate ephemeral keypair for this specific request
  const ephemeralKeyPair = nacl.box.keyPair();

  // 2. Serialize data to JSON then UTF8 bytes
  const jsonString = JSON.stringify(data);
  const messageUint8 = util.decodeUTF8(jsonString);

  // 3. Generate a random nonce
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // 4. Encrypt: Box(Message, Nonce, Relayer_PubKey, Ephemeral_PrivKey)
  const encryptedBox = nacl.box(
    messageUint8,
    nonce,
    RELAYER_PUBLIC_KEY,
    ephemeralKeyPair.secretKey
  );

  // 5. Pack everything into one Uint8Array
  // Structure: [ EphemeralPublicKey (32 bytes) | Nonce (24 bytes) | EncryptedData (N bytes) ]
  // The Relayer needs the EphemeralPublicKey to derive the shared secret for decryption.
  const fullPayload = new Uint8Array(
    ephemeralKeyPair.publicKey.length + nonce.length + encryptedBox.length
  );

  fullPayload.set(ephemeralKeyPair.publicKey, 0);
  fullPayload.set(nonce, ephemeralKeyPair.publicKey.length);
  fullPayload.set(
    encryptedBox,
    ephemeralKeyPair.publicKey.length + nonce.length
  );

  const base64Payload = util.encodeBase64(fullPayload);

  console.log("\n[CLIENT] Encrypted Payload (Base64):");
  console.log(base64Payload.substring(0, 50) + "..."); // Print snippet
  return base64Payload;
}

// --- SERVER / RELAYER SIDE ---

/**
 * Decrypts the payload using the Relayer's private key.
 */
function decryptPayload(base64Payload: string): any {
  const combined = util.decodeBase64(base64Payload);

  // Lengths for curve25519-xsalsa20-poly1305 (tweetnacl box)
  const pubKeyLen = 32;
  const nonceLen = 24;

  // 1. Extract parts
  const ephemeralPubKey = combined.slice(0, pubKeyLen);
  const nonce = combined.slice(pubKeyLen, pubKeyLen + nonceLen);
  const ciphertext = combined.slice(pubKeyLen + nonceLen);

  // 2. Decrypt: Open(Ciphertext, Nonce, Ephemeral_PubKey, Relayer_SecretKey)
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPubKey,
    RELAYER_PRIVATE_KEY
  );

  if (!decrypted) {
    throw new Error(
      "[SERVER] Decryption failed! Integrity check failed or wrong key."
    );
  }

  // 3. Decode bytes back to JSON
  const jsonString = util.encodeUTF8(decrypted);
  return JSON.parse(jsonString);
}

// --- TEST EXECUTION ---

const sensitiveData = {
  user: "@alice",
  amount: 50000,
  notes: Array.from({ length: 100 }, (_, i) => ({
    id: `note_${i}`,
    value: 500,
    secret: `super_secret_key_for_note_${i}_${Math.random()
      .toString(36)
      .substring(7)}`,
    commitment: `commitment_${Math.random().toString(36).substring(7)}`,
    nullifier: `nullifier_${Math.random().toString(36).substring(7)}`,
  })),
  metadata: {
    network: "solana-mainnet",
    version: "1.0.0",
    userAgent: "VeiloExtension/1.0.0",
    notesCount: 100,
  },
  timestamp: Date.now(),
};

console.log(
  "[TEST] Original Data Size:",
  JSON.stringify(sensitiveData).length,
  "bytes"
);
// console.log("[TEST] Original Data:", JSON.stringify(sensitiveData, null, 2)); // Too verbose for large dataset

try {
  // 1. Client encrypts
  const payload = encryptForRelayer(sensitiveData);

  // 2. Network transmission happens here...
  // ...

  // 3. Relayer receives and decrypts
  const receivedData = decryptPayload(payload);

  console.log(
    "\n[TEST] Decrypted Data on Server:",
    JSON.stringify(receivedData, null, 2)
  );

  // Validation
  if (JSON.stringify(sensitiveData) === JSON.stringify(receivedData)) {
    console.log("\n✅ SUCCESS: Decrypted data matches original!");
  } else {
    console.error("\n❌ FAILURE: Data mismatch.");
  }
} catch (e: any) {
  console.error("\n❌ ERROR:", e.message);
}

// --- SECURITY TEST: WRONG KEY ---

console.log("\n[TEST] Attempting decryption with WRONG Private Key...");

const wrongKeys = nacl.box.keyPair();
const WRONG_PRIVATE_KEY = wrongKeys.secretKey;

// We need to manually implementations decryption with the wrong key to test
try {
    const combined = util.decodeBase64(payload);
    const pubKeyLen = 32;
    const nonceLen = 24;
    
    const ephemeralPubKey = combined.slice(0, pubKeyLen);
    const nonce = combined.slice(pubKeyLen, pubKeyLen + nonceLen);
    const ciphertext = combined.slice(pubKeyLen + nonceLen);

    const decrypted = nacl.box.open(
        ciphertext,
        nonce,
        ephemeralPubKey, 
        WRONG_PRIVATE_KEY // <--- Main point of the test
    );

    if (decrypted) {
        console.error("❌ CRITICAL FAILURE: Decryption succeeded with wrong key! (This should never happen)");
    } else {
        console.log("✅ SUCCESS: Decryption returned null (failed) as expected.");
    }

} catch (e: any) {
    // Note: nacl.box.open returns null on failure, it doesn't usually throw unless inputs are bad.
    // If it threw, that's also a "failure to decrypt", so acceptable.
    console.log("✅ SUCCESS: Decryption failed (threw error) as expected.");
}
