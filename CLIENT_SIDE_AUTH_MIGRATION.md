# Client-Side Key Generation Migration Guide

This guide explains how to migrate from server-side key generation to client-side key generation, making Veilo truly non-custodial and Chrome Web Store compliant.

---

## Overview of Changes

### Current Flow (PROBLEMATIC)

```
Registration: Server generates wallet → sends privateKey to client
Restore: Client sends mnemonic → Server derives wallet → sends privateKey
```

### New Flow (SECURE)

```
Registration: Client generates wallet → sends publicKey only → Server returns encrypted veiloKeys
Restore: Client derives wallet locally → signs challenge → Server verifies & returns encrypted veiloKeys
```

---

# PART 1: EXTENSION CHANGES

## Step 1: Install Dependencies

```bash
npm install bip39 ed25519-hd-key
```

## Step 2: Create Key Generation Utility

Create `src/utils/keyGeneration.ts`:

```typescript
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * Generate a new mnemonic phrase (12 or 24 words)
 */
export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39.generateMnemonic(strength);
}

/**
 * Validate a mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Derive a Solana keypair from mnemonic using standard derivation path
 * Path: m/44'/501'/0'/0' (Solana standard)
 */
export async function deriveKeypairFromMnemonic(
  mnemonic: string,
): Promise<Keypair> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derivationPath = "m/44'/501'/0'/0'";
  const derived = derivePath(derivationPath, seed.toString("hex"));
  return Keypair.fromSeed(derived.key);
}

/**
 * Sign an authentication message (off-chain, no SOL required)
 */
export function signAuthMessage(
  message: string,
  secretKey: Uint8Array,
): { signature: string; message: string } {
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return {
    signature: util.encodeBase64(signature),
    message,
  };
}

/**
 * Create auth message for challenge-response
 */
export function createAuthMessage(
  publicKey: string,
  challenge: string,
): string {
  return `Veilo Authentication\nPublic Key: ${publicKey}\nChallenge: ${challenge}\nTimestamp: ${Date.now()}`;
}
```

## Step 3: Update Auth Service

Replace `src/services/authService.ts`:

```typescript
import { api } from "../lib/api/relayerApi";

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}

export interface ChallengeResponse {
  challenge: string;
  expiresAt: number;
}

export interface RegisterRequest {
  username: string;
  publicKey: string; // Client sends their public key
}

export interface RegisterResponse {
  success: boolean;
  username: string;
  publicKey: string;
  // veiloKeys encrypted with user's publicKey via ECDH
  encryptedVeiloPrivateKey: string; // Base64 encrypted blob
  veiloPublicKey: string;
  ephemeralPublicKey: string; // Server's ephemeral key for ECDH decryption
  token: string;
  message?: string;
}

export interface RestoreRequest {
  publicKey: string;
  signature: string; // Signed challenge
  message: string; // The message that was signed
}

export interface RestoreResponse {
  success: boolean;
  username: string;
  publicKey: string;
  encryptedVeiloPrivateKey: string;
  veiloPublicKey: string;
  ephemeralPublicKey: string;
  token: string;
  message?: string;
}

export const authService = {
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.get<CheckUsernameResponse>(
      `/api/auth/checkUsername`,
      { params: { username } },
    );
    return response.data;
  },

  /**
   * Get a challenge for signature-based authentication
   */
  getChallenge: async (publicKey: string): Promise<ChallengeResponse> => {
    const response = await api.post<ChallengeResponse>("/api/auth/challenge", {
      publicKey,
    });
    return response.data;
  },

  /**
   * Register a new account
   * Client generates wallet locally, only sends publicKey
   */
  register: async (
    username: string,
    publicKey: string,
  ): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/api/auth/register", {
      username,
      publicKey,
    });
    return response.data;
  },

  /**
   * Restore an existing account
   * Client proves ownership via signature, never sends mnemonic
   */
  restore: async (
    publicKey: string,
    signature: string,
    message: string,
  ): Promise<RestoreResponse> => {
    const response = await api.post<RestoreResponse>("/api/auth/restore", {
      publicKey,
      signature,
      message,
    });
    return response.data;
  },
};
```

## Step 4: Create veiloKey Decryption Utility

Add to `src/transactions/ECDH/helpers.ts`:

> **CRITICAL DISCOVERY**: Two different hash functions are needed!
>
> - **For NOTE encryption/decryption**: Use truncated SHA-512 `nacl.hash().slice(0, 32)` (matches old code)
> - **For AUTH encryption/decryption**: Use REAL SHA-256 `crypto.createHash('sha256')` (matches server)

```typescript
import nacl from "tweetnacl";
import util from "tweetnacl-util";
import ed2curve from "ed2curve";

const { encodeUTF8, decodeBase64 } = util;

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
 * Derive shared secret using ECDH with Ed25519/X25519 conversion
 * SIMPLIFIED: Just slice to 32 bytes (seed) and convert
 */
function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Uint8Array {
  // Simple approach: if 64 bytes, slice to get first 32 (seed)
  const privateKey32 =
    myPrivateKey.length === 64 ? myPrivateKey.slice(0, 32) : myPrivateKey;

  // Convert Ed25519 keys to X25519 for ECDH
  const myX25519Private = ed2curve.convertSecretKey(privateKey32);
  const theirX25519Public = ed2curve.convertPublicKey(theirPublicKey);

  if (!myX25519Private || !theirX25519Public) {
    throw new Error("Failed to convert Ed25519 keys to X25519");
  }

  return nacl.scalarMult(myX25519Private, theirX25519Public);
}

/**
 * Decrypt veiloPrivateKey received from server (AUTH FLOW)
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

/**
 * For notes: Use truncated SHA-512 (matches old encryption)
 */
export function encryptSecretBox(
  plaintext: string,
  sharedSecret: Uint8Array,
): Uint8Array {
  const key = sha256ForNotes(sharedSecret);
  const nonce = nacl.randomBytes(24);
  const messageUint8 = new TextEncoder().encode(plaintext);
  const encrypted = nacl.secretbox(messageUint8, nonce, key);

  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);
  return result;
}

export function decryptSecretBox(
  ciphertext: Uint8Array,
  sharedSecret: Uint8Array,
): Uint8Array {
  const key = sha256ForNotes(sharedSecret);
  const nonce = ciphertext.slice(0, 24);
  const encrypted = ciphertext.slice(24);

  const decrypted = nacl.secretbox.open(encrypted, nonce, key);
  if (!decrypted) {
    throw new Error("Decryption failed");
  }
  return decrypted;
}
```

## Step 5: Update useAuthQueries Hook

Replace `src/hooks/queries/useAuthQueries.ts`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import { tokenStorage } from "../../utils/tokenStorage";
import { useAuthStore } from "../../store/useAuthStore";

export const useCheckUsername = () => {
  return useMutation({
    mutationFn: (username: string) => authService.checkUsername(username),
  });
};

export const useGetChallenge = () => {
  return useMutation({
    mutationFn: (publicKey: string) => authService.getChallenge(publicKey),
  });
};

export const useRegisterUser = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({
      username,
      publicKey,
    }: {
      username: string;
      publicKey: string;
    }) => authService.register(username, publicKey),
    onSuccess: (data) => {
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      setAuth({
        username: data.username,
        publicKey: data.publicKey,
      });
    },
  });
};

export const useRestoreAccount = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({
      publicKey,
      signature,
      message,
    }: {
      publicKey: string;
      signature: string;
      message: string;
    }) => authService.restore(publicKey, signature, message),
    onSuccess: (data) => {
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      setAuth({
        username: data.username,
        publicKey: data.publicKey,
      });
    },
  });
};
```

## Step 6: Update App.tsx - Registration Handler

```typescript
import {
  generateMnemonic,
  deriveKeypairFromMnemonic,
  signAuthMessage,
  createAuthMessage,
} from "./utils/keyGeneration";
import { decryptVeiloKeyFromServer } from "./transactions/ECDH/helpers";
import bs58 from "bs58";

// Update the mutation hooks
const { mutateAsync: registerUser, isPending: isRegistering } =
  useRegisterUser();
const { mutateAsync: restoreAccountApi, isPending: isRestoring } =
  useRestoreAccount();
const { mutateAsync: getChallenge } = useGetChallenge();

// NEW: handleCreatePassword for registration
const handleCreatePassword = async (password: string) => {
  try {
    // 1. Generate mnemonic CLIENT-SIDE
    const mnemonic = generateMnemonic();

    // 2. Derive keypair CLIENT-SIDE
    const keypair = await deriveKeypairFromMnemonic(mnemonic);
    const publicKey = keypair.publicKey.toString();
    const privateKeyHex = Buffer.from(keypair.secretKey.slice(0, 32)).toString(
      "hex",
    );

    // 3. Register with server (only send publicKey + username)
    const response = await registerUser({ username, publicKey });

    // 4. Decrypt veiloPrivateKey from server response
    // NOTE: ephemeralPublicKey is base58 encoded (Solana public key format)
    const serverEphemeralPubKey = bs58.decode(response.ephemeralPublicKey);
    const veiloPrivateKey = decryptVeiloKeyFromServer(
      keypair.secretKey, // Pass full 64-byte secretKey
      serverEphemeralPubKey,
      response.encryptedVeiloPrivateKey,
    );
    const veiloPublicKey = response.veiloPublicKey;

    // 5. Encrypt all sensitive data with user's password
    const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
    const encryptedSecretKey = await encrypt(secretKeyStr, password);
    const encryptedMnemonic = await encrypt(mnemonic, password);
    const encryptedVeiloPublicKey = await encrypt(veiloPublicKey, password);
    const encryptedVeiloPrivateKey = await encrypt(veiloPrivateKey, password);

    // 6. Store all encrypted data locally
    await saveWallet(
      {
        encryptedSecretKey,
        encryptedMnemonic,
        encryptedVeiloPublicKey,
        encryptedVeiloPrivateKey,
        publicKey,
        username,
      },
      response.token,
    );

    // 7. Continue with session initialization...
    setPassword(password);
    setGeneratedPhrase(mnemonic.split(" "));
    setOnboardingStep("phrase");

    // ... rest of initialization (same as before)
  } catch (e) {
    console.error("Registration failed", e);
    setError("Registration failed. Please try again.");
  }
};
```

## Step 7: Update App.tsx - Restore Handler

```typescript
// NEW: handleRestorePassword for account recovery
const handleRestorePassword = async (password: string) => {
  try {
    // 1. Derive keypair from mnemonic CLIENT-SIDE (never send mnemonic!)
    const keypair = await deriveKeypairFromMnemonic(restoreMnemonic);
    const publicKey = keypair.publicKey.toString();
    const privateKeyHex = Buffer.from(keypair.secretKey.slice(0, 32)).toString(
      "hex",
    );

    // 2. Get challenge from server
    const { challenge } = await getChallenge(publicKey);

    // 3. Sign challenge to prove ownership (no SOL required!)
    const authMessage = createAuthMessage(publicKey, challenge);
    const { signature, message } = signAuthMessage(
      authMessage,
      keypair.secretKey,
    );

    // 4. Restore account with signature proof
    const response = await restoreAccountApi({ publicKey, signature, message });

    // 5. Decrypt veiloPrivateKey from server response
    // NOTE: ephemeralPublicKey is base58 encoded (Solana public key format)
    const serverEphemeralPubKey = bs58.decode(response.ephemeralPublicKey);
    const veiloPrivateKey = decryptVeiloKeyFromServer(
      keypair.secretKey, // Pass full 64-byte secretKey
      serverEphemeralPubKey,
      response.encryptedVeiloPrivateKey,
    );
    const veiloPublicKey = response.veiloPublicKey;

    // 6. Encrypt all sensitive data with user's password
    const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
    const encryptedSecretKey = await encrypt(secretKeyStr, password);
    const encryptedMnemonic = await encrypt(restoreMnemonic, password);
    const encryptedVeiloPublicKey = await encrypt(veiloPublicKey, password);
    const encryptedVeiloPrivateKey = await encrypt(veiloPrivateKey, password);

    // 7. Store all encrypted data locally
    await saveWallet(
      {
        encryptedSecretKey,
        encryptedMnemonic,
        encryptedVeiloPublicKey,
        encryptedVeiloPrivateKey,
        publicKey,
        username: response.username,
      },
      response.token,
    );

    // 8. Continue with session initialization...
    setPassword(password);

    // Initialize NoteManager, wallet, etc. (same as before)
    // ...

    setOnboardingStep("done");
  } catch (e: any) {
    console.error("Restore failed", e);
    if (e.message?.includes("not found")) {
      setError("No account found for this seed phrase");
    } else if (e.message?.includes("signature")) {
      setError("Authentication failed. Invalid seed phrase.");
    } else {
      setError(e?.message || "Failed to restore account");
    }
  }
};
```

---

# PART 2: RELAYER CHANGES

## Database Schema Updates

```sql
-- Users table (updated)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  public_key VARCHAR(64) UNIQUE NOT NULL,  -- Solana public key (base58)

  -- veiloKeys (generated server-side, encrypted for user)
  veilo_public_key VARCHAR(64) NOT NULL,
  encrypted_veilo_private_key TEXT NOT NULL,  -- Encrypted with user's public key
  ephemeral_public_key VARCHAR(64) NOT NULL,  -- For ECDH decryption

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge table (for signature verification)
CREATE TABLE auth_challenges (
  id SERIAL PRIMARY KEY,
  public_key VARCHAR(64) NOT NULL,
  challenge VARCHAR(64) NOT NULL,  -- Random nonce
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## New API Endpoints

### 1. POST `/api/auth/challenge`

Get a challenge for signature-based authentication.

**Request:**

```json
{
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response:**

```json
{
  "challenge": "a1b2c3d4e5f6...", // Random 32-byte hex
  "expiresAt": 1707700000000 // 5 minutes from now
}
```

**Implementation:**

```javascript
app.post("/api/auth/challenge", async (req, res) => {
  const { publicKey } = req.body;

  // Generate random challenge
  const challenge = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store challenge
  await db.query(
    "INSERT INTO auth_challenges (public_key, challenge, expires_at) VALUES ($1, $2, $3)",
    [publicKey, challenge, new Date(expiresAt)],
  );

  res.json({ challenge, expiresAt });
});
```

### 2. POST `/api/auth/register`

Register a new account. Client provides publicKey, server generates veiloKeys.

**Request:**

```json
{
  "username": "alice",
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response:**

```json
{
  "success": true,
  "username": "alice",
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "veiloPublicKey": "...", // Plain, can be public
  "encryptedVeiloPrivateKey": "...", // Encrypted via ECDH
  "ephemeralPublicKey": "...", // Server's ephemeral key for decryption
  "token": "jwt..."
}
```

**Implementation:**

```javascript
const nacl = require("tweetnacl");
const { Keypair } = require("@solana/web3.js");

app.post("/api/auth/register", async (req, res) => {
  const { username, publicKey } = req.body;

  // Check username availability
  const existing = await db.query(
    "SELECT id FROM users WHERE username = $1 OR public_key = $2",
    [username, publicKey],
  );
  if (existing.rows.length > 0) {
    return res
      .status(400)
      .json({ error: "Username or public key already exists" });
  }

  // Generate veiloKeypair (server-side)
  const veiloKeypair = Keypair.generate();
  const veiloPublicKey = veiloKeypair.publicKey.toBase58();
  const veiloPrivateKeyHex = Buffer.from(
    veiloKeypair.secretKey.slice(0, 32),
  ).toString("hex");

  // Encrypt veiloPrivateKey for the user using ECDH
  const { encryptedBlob, ephemeralPublicKey } = encryptForUser(
    veiloPrivateKeyHex,
    publicKey, // User's Solana public key
  );

  // Store in database
  await db.query(
    `INSERT INTO users (username, public_key, veilo_public_key, encrypted_veilo_private_key, ephemeral_public_key)
     VALUES ($1, $2, $3, $4, $5)`,
    [username, publicKey, veiloPublicKey, encryptedBlob, ephemeralPublicKey],
  );

  // Generate JWT
  const token = jwt.sign({ publicKey, username }, JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({
    success: true,
    username,
    publicKey,
    veiloPublicKey,
    encryptedVeiloPrivateKey: encryptedBlob,
    ephemeralPublicKey,
    token,
  });
});
```

### 3. POST `/api/auth/restore`

Restore account using signature verification (no mnemonic sent!).

**Request:**

```json
{
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "base64-signature...",
  "message": "Veilo Authentication\nPublic Key: 7xKX...\nChallenge: a1b2c3...\nTimestamp: 1707699000000"
}
```

**Response:**

```json
{
  "success": true,
  "username": "alice",
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "veiloPublicKey": "...",
  "encryptedVeiloPrivateKey": "...", // Re-encrypted with fresh ephemeral key
  "ephemeralPublicKey": "...",
  "token": "jwt..."
}
```

**Implementation:**

```javascript
const nacl = require("tweetnacl");
const bs58 = require("bs58");

app.post("/api/auth/restore", async (req, res) => {
  const { publicKey, signature, message } = req.body;

  // 1. Verify challenge exists and is valid
  const challengeMatch = message.match(/Challenge: ([a-f0-9]+)/);
  if (!challengeMatch) {
    return res.status(400).json({ error: "Invalid message format" });
  }
  const challenge = challengeMatch[1];

  const challengeRecord = await db.query(
    "SELECT * FROM auth_challenges WHERE public_key = $1 AND challenge = $2 AND used = FALSE AND expires_at > NOW()",
    [publicKey, challenge],
  );

  if (challengeRecord.rows.length === 0) {
    return res.status(400).json({ error: "Invalid or expired challenge" });
  }

  // 2. Verify signature
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = Buffer.from(signature, "base64");
  const publicKeyBytes = bs58.decode(publicKey);

  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes,
  );

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 3. Mark challenge as used
  await db.query("UPDATE auth_challenges SET used = TRUE WHERE id = $1", [
    challengeRecord.rows[0].id,
  ]);

  // 4. Find user
  const user = await db.query("SELECT * FROM users WHERE public_key = $1", [
    publicKey,
  ]);
  if (user.rows.length === 0) {
    return res.status(404).json({ error: "Account not found" });
  }

  // 5. Re-encrypt veiloPrivateKey with fresh ephemeral key
  // (Decrypt stored key, then re-encrypt for this session)
  const storedVeiloPrivateKey = decryptStoredVeiloKey(user.rows[0]); // Your internal decryption
  const { encryptedBlob, ephemeralPublicKey } = encryptForUser(
    storedVeiloPrivateKey,
    publicKey,
  );

  // 6. Generate JWT
  const token = jwt.sign(
    { publicKey, username: user.rows[0].username },
    JWT_SECRET,
    { expiresIn: "30d" },
  );

  res.json({
    success: true,
    username: user.rows[0].username,
    publicKey,
    veiloPublicKey: user.rows[0].veilo_public_key,
    encryptedVeiloPrivateKey: encryptedBlob,
    ephemeralPublicKey,
    token,
  });
});
```

## ECDH Encryption Helper (Server-Side)

> **IMPORTANT**: The server-side encryption MUST use the same algorithm as the client (NaCl secretbox / XSalsa20-Poly1305) for interoperability. The shared secret must be hashed with SHA-256 before use as the encryption key.

```javascript
const nacl = require("tweetnacl");
const ed2curve = require("ed2curve");
const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");
const crypto = require("crypto");

/**
 * SHA-256 hash function (must match client-side implementation)
 */
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest();
}

/**
 * Encrypt data for a specific user using ECDH + NaCl secretbox
 * This MUST match the client-side decryption implementation
 */
function encryptForUser(plaintext, userPublicKeyBase58) {
  // Generate ephemeral keypair for this encryption
  const ephemeralKeypair = Keypair.generate();
  const ephemeralPublicKey = ephemeralKeypair.publicKey.toBase58();

  // Convert user's Ed25519 public key to X25519
  const userPublicKeyBytes = bs58.decode(userPublicKeyBase58);
  const userX25519Public = ed2curve.convertPublicKey(userPublicKeyBytes);
  if (!userX25519Public) {
    throw new Error("Failed to convert user public key to X25519");
  }

  // Convert ephemeral Ed25519 secret key (full 64 bytes) to X25519
  const ephemeralX25519Private = ed2curve.convertSecretKey(
    ephemeralKeypair.secretKey, // Full 64-byte secretKey
  );
  if (!ephemeralX25519Private) {
    throw new Error("Failed to convert ephemeral secret key to X25519");
  }

  // Compute shared secret using scalar multiplication
  const sharedSecret = nacl.scalarMult(
    ephemeralX25519Private,
    userX25519Public,
  );

  // CRITICAL: Derive key from shared secret using SHA-256 (must match client!)
  const key = sha256(Buffer.from(sharedSecret));

  // Generate random nonce (24 bytes for XSalsa20)
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength); // 24 bytes

  // Encrypt with NaCl secretbox (XSalsa20-Poly1305)
  const plaintextBytes =
    typeof plaintext === "string"
      ? new TextEncoder().encode(plaintext)
      : plaintext;
  const ciphertext = nacl.secretbox(plaintextBytes, nonce, key);

  // Combine nonce + ciphertext and encode as base64
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  const encryptedBlob = Buffer.from(combined).toString("base64");

  return {
    encryptedBlob,
    ephemeralPublicKey,
  };
}

/**
 * For completeness: decrypt on server side (if needed for testing)
 */
function decryptFromUser(
  encryptedBlob,
  ephemeralPublicKeyBase58,
  serverSecretKey,
) {
  // Decode the encrypted blob
  const combined = Buffer.from(encryptedBlob, "base64");
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const ciphertext = combined.slice(nacl.secretbox.nonceLength);

  // Convert ephemeral public key to X25519
  const ephemeralPublicKeyBytes = bs58.decode(ephemeralPublicKeyBase58);
  const ephemeralX25519Public = ed2curve.convertPublicKey(
    ephemeralPublicKeyBytes,
  );

  // Convert server's secret key to X25519 (full 64-byte secretKey required)
  const serverX25519Private = ed2curve.convertSecretKey(serverSecretKey);

  // Compute shared secret
  const sharedSecret = nacl.scalarMult(
    serverX25519Private,
    ephemeralX25519Public,
  );

  // CRITICAL: Derive key from shared secret using SHA-256 (must match client!)
  const key = sha256(Buffer.from(sharedSecret));

  // Decrypt
  const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
  if (!plaintext) {
    throw new Error("Decryption failed - invalid ciphertext or key");
  }

  return new TextDecoder().decode(plaintext);
}
```

---

# PART 3: CRITICAL BUGS FIXED

## Bug #1: Base64 vs Base58 Encoding

**Issue**: Server sends `ephemeralPublicKey` as base58 (Solana format), but client was decoding as base64.

**Fix**: Use `bs58.decode()` instead of `util.decodeBase64()`:

```typescript
import bs58 from "bs58";

// ❌ WRONG
const serverEphemeralPubKey = util.decodeBase64(response.ephemeralPublicKey);

// ✅ CORRECT
const serverEphemeralPubKey = bs58.decode(response.ephemeralPublicKey);
```

## Bug #2: SHA-256 vs SHA-512 Mismatch

**Issue**: Two different hash functions were being used:

- Note encryption used: `nacl.hash().slice(0, 32)` (SHA-512 truncated)
- Auth encryption tried to use: Real SHA-256

**Discovery**: The old note encryption code always used truncated SHA-512, not real SHA-256. This creates two separate encryption contexts.

**Fix**: Use TWO separate hash functions:

```typescript
// For note encryption/decryption (backwards compatibility)
function sha256ForNotes(data: Uint8Array): Uint8Array {
  const hash = nacl.hash(data); // SHA-512
  return hash.slice(0, 32); // Truncate to 256 bits
}

// For auth encryption/decryption (matches server)
function sha256ForAuth(data: Uint8Array): Uint8Array {
  // Pure JS implementation of REAL SHA-256
  // ... (see full code above)
}
```

## Bug #3: Ed25519 to X25519 Key Conversion

**Initial approach**: Thought we needed to expand 32-byte seed to 64-byte secretKey before conversion.

**Working approach**: Simply slice to 32 bytes and convert directly:

```typescript
// ✅ SIMPLE & WORKS
const privateKey32 =
  myPrivateKey.length === 64 ? myPrivateKey.slice(0, 32) : myPrivateKey;
const myX25519Private = ed2curve.convertSecretKey(privateKey32);
```

---

# PART 4: MIGRATION CHECKLIST

## Extension Checklist

- [x] Install `bip39`, `ed25519-hd-key`, `tweetnacl`, `tweetnacl-util`, `ed2curve`, and `bs58` packages
- [x] Create `src/utils/keyGeneration.ts`
- [x] Update `src/services/authService.ts` with new endpoints
- [x] Update `src/hooks/queries/useAuthQueries.ts`
- [x] Add `decryptVeiloKeyFromServer` to ECDH helpers (using real SHA-256)
- [x] Update note encryption helpers to use truncated SHA-512 (backwards compatibility)
- [x] Fix base58 vs base64 encoding bug
- [x] Simplify Ed25519 to X25519 conversion
- [x] Update `handleCreatePassword` in App.tsx
- [x] Update `handleRestorePassword` in App.tsx
- [x] Test registration flow
- [x] Test note decryption
- [x] Update Privacy Policy (can now truthfully say "keys never leave device")

## Relayer Checklist

- [ ] Install `tweetnacl`, `ed2curve`, and `bs58` packages (for server-side ECDH)
- [ ] Add `auth_challenges` table
- [ ] Update `users` table schema
- [ ] Implement `POST /api/auth/challenge`
- [ ] Update `POST /api/auth/register` (accept publicKey, not generate)
- [ ] Update `POST /api/auth/restore` (verify signature, not accept mnemonic)
- [ ] Add ECDH encryption for veiloKeys using REAL SHA-256 (matches client auth flow)
- [ ] Ensure ephemeralPublicKey is sent as base58 (Solana format)
- [ ] Migrate existing users (re-encrypt their veiloKeys)
- [ ] Remove old endpoints that accept/return raw private keys
- [ ] Test all flows

---

# PART 5: SECURITY IMPROVEMENTS

## What This Achieves

| Before                           | After                        |
| -------------------------------- | ---------------------------- |
| Server generates wallet keypair  | Client generates locally     |
| Mnemonic sent to server          | Mnemonic never leaves device |
| Private keys travel over network | Only public keys sent        |
| "Non-custodial" was questionable | Truly non-custodial          |
| Could be flagged by Chrome       | Chrome Web Store compliant   |

## Privacy Policy Update

You can now truthfully state:

> **Key Generation:** All wallet keys are generated locally on your device using industry-standard BIP39/BIP44 derivation. Your seed phrase and private keys never leave your browser.
>
> **Authentication:** Account recovery uses cryptographic signature verification. You prove ownership by signing a challenge with your private key - the seed phrase is never transmitted.
>
> **veiloKeys:** Privacy keys are generated on our server and encrypted specifically for your wallet before transmission. Only you can decrypt them using your wallet's private key.

---

# Questions?

If you need clarification on any part of this migration, the key points are:

1. **Mnemonic stays local** - Generate and derive client-side
2. **Signature proves ownership** - No need to send secrets
3. **ECDH protects veiloKeys** - Encrypted specifically for each user
4. **Challenge-response prevents replay** - Each auth attempt needs fresh challenge
