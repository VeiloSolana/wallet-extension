
import { buildPoseidon, buildBabyjub } from "circomlibjs";
import { webcrypto } from 'node:crypto';
import { Buffer } from "buffer";

// Polyfill minimal globals if needed by circomlibjs (unlikely but safe)
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

// --- UTILS FROM noteDecryption.ts ---
const toBuffer = (val, encoding = 'hex') => {
  if (typeof val === 'string') {
    return Buffer.from(val, encoding);
  }
  return Buffer.from(val);
};

async function deriveAesKey(sharedKeyBigInt) {
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', Buffer.from(sharedKeyBigInt.toString()));
    return await webcrypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

async function aesEncrypt(data, key) {
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );
    const buffer = Buffer.concat([Buffer.from(iv), Buffer.from(cipherBuffer)]);
    return buffer.toString('base64');
}

async function aesDecrypt(blobBase64, key) {
    const buffer = Buffer.from(blobBase64, 'base64');
    const iv = buffer.subarray(0, 12);
    const ciphertext = buffer.subarray(12);
    
    const decryptedBuffer = await webcrypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    
    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded);
}

// --- CORE LOGIC ---

async function derivePrivacyKeyFromSignatureKey(signatureSecretKey) {
    const babyjub = await buildBabyjub();
    const hash = await webcrypto.subtle.digest('SHA-256', signatureSecretKey);
    const scalarBigInt = BigInt('0x' + Buffer.from(hash).toString('hex')) % babyjub.order;
    
    const pubKeyPoint = babyjub.mulPointEscalar(babyjub.Base8, scalarBigInt);
    const pubKeyPacked = babyjub.packPoint(pubKeyPoint);
    
    // Fix: We must ensure 32 bytes hex. Pad start is good.
    const privKeyHex = scalarBigInt.toString(16).padStart(64, '0');
    
    return {
        privateKey: Buffer.from(privKeyHex, 'hex'),
        publicKey: Buffer.from(pubKeyPacked)
    };
}

async function encryptNote(recipientPublicKey, noteData) { 
    const babyjub = await buildBabyjub();
    const poseidon = await buildPoseidon();

    const randomBytes = webcrypto.getRandomValues(new Uint8Array(32));
    const ephPrivKeyScalar = BigInt('0x' + Buffer.from(randomBytes).toString('hex')) % babyjub.order; 
    
    const ephPubKeyPoint = babyjub.mulPointEscalar(babyjub.Base8, ephPrivKeyScalar);
    const ephPubKeyPacked = babyjub.packPoint(ephPubKeyPoint);

    let recipientKeyPoint;
    try {
        recipientKeyPoint = babyjub.unpackPoint(recipientPublicKey);
    } catch(e) {
        throw new Error("Invalid recipient public key (must be BabyJubJub point)");
    }

    const sharedKeyPoint = babyjub.mulPointEscalar(recipientKeyPoint, ephPrivKeyScalar);
    const sharedSecretF = poseidon([sharedKeyPoint[0], sharedKeyPoint[1]]);
    const sharedSecretBigInt = BigInt(babyjub.F.toString(sharedSecretF));

    const aesKey = await deriveAesKey(sharedSecretBigInt);
    
    const jsonReadyData = {
        amount: noteData.amount.toString(),
        blindingFactor: "0",
        leafIndex: noteData.leafIndex,
        commitment: "derived_later",
        nullifier: Buffer.from(noteData.nullifier).toString('hex'),
        blinding: Buffer.from(noteData.blinding).toString('hex'),
        publicKey: Buffer.from(noteData.publicKey).toString('hex')
    };

    const encryptedBlob = await aesEncrypt(jsonReadyData, aesKey);

    return {
        ephemeralPublicKey: Buffer.from(ephPubKeyPacked).toString('base64'), 
        encryptedBlob: encryptedBlob
    };
}

async function decryptNoteBlob(privateKey, ephemeralPublicKey, encryptedBlob) {
  const babyjub = await buildBabyjub();
  const poseidon = await buildPoseidon();

  let ephPubKeyPoint;
  try {
     ephPubKeyPoint = babyjub.unpackPoint(ephemeralPublicKey);
  } catch (e) {
     throw new Error("Invalid ephemeral public key format");
  }
 
  // Recalculate scalar from buffer
  const privKeyScalar = BigInt('0x' + Buffer.from(privateKey).toString('hex'));
  
  const sharedKeyPoint = babyjub.mulPointEscalar(ephPubKeyPoint, privKeyScalar);
  
  const sharedSecretF = poseidon([sharedKeyPoint[0], sharedKeyPoint[1]]);
  const sharedSecretBigInt = BigInt(babyjub.F.toString(sharedSecretF));
  
  const aesKey = await deriveAesKey(sharedSecretBigInt);

  try {
      const decryptedData = await aesDecrypt(encryptedBlob, aesKey);
      return decryptedData;
  } catch (e) {
      console.warn("Decryption failed for note:", e);
      throw e;
  }
}

// --- RUN TEST ---
async function run() {
    console.log("Starting reproduction test...");
    
    try {
        // 1. Setup Keys
        const secretKey = new Uint8Array(32).fill(1); // Dummy Ed25519 secret
        const { privateKey, publicKey } = await derivePrivacyKeyFromSignatureKey(secretKey);
        console.log("Derived Privacy Key:", Buffer.from(privateKey).toString('hex'));
        console.log("Derived Privacy Pub:", Buffer.from(publicKey).toString('hex'));

        // 2. Encrypt
        const noteData = {
            amount: 1000n,
            blinding: new Uint8Array(32).fill(2),
            leafIndex: 0,
            nullifier: new Uint8Array(32).fill(3),
            publicKey: publicKey
        };
        
        console.log("Encrypting...");
        const result = await encryptNote(publicKey, noteData);
        console.log("Encrypted Blob:", result.encryptedBlob);
        console.log("Ephemeral PubKey (Base64):", result.ephemeralPublicKey);

        // 3. Decrypt
        console.log("Decrypting...");
        const ephKeyBuffer = Buffer.from(result.ephemeralPublicKey, 'base64');
        const decrypted = await decryptNoteBlob(privateKey, ephKeyBuffer, result.encryptedBlob);
        
        console.log("Decrypted Data:", decrypted);
        
        // Check equality
        if (decrypted.amount === noteData.amount.toString()) {
            console.log("SUCCESS: Decryption matched original data.");
        } else {
            console.error("FAILURE: Data mismatch.");
        }

    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}

run();
