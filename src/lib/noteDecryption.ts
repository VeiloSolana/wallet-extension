
import { buildPoseidon, buildBabyjub } from 'circomlibjs';
import { Buffer } from 'buffer';

export interface DecryptedNote {
  amount: bigint;
  blindingFactor: bigint;
  leafIndex: number;
  commitment: string;
  // Additional fields for spending:
  nullifier: Uint8Array;
  blinding: Uint8Array;
  publicKey: Uint8Array;
}

// Helper to convert hex/base64 to Buffer
const toBuffer = (val: string | Uint8Array, encoding: BufferEncoding = 'hex') => {
  if (typeof val === 'string') {
    return Buffer.from(val, encoding);
  }
  return Buffer.from(val);
};

// Helper to hashing Shared Secret to AES Key
async function deriveAesKey(sharedKeyBigInt: bigint): Promise<CryptoKey> {
    // Hash it to ensure uniform distribution
    const hashBuffer = await crypto.subtle.digest('SHA-256', Buffer.from(sharedKeyBigInt.toString()));
    return await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function derivePrivacyKeyFromSignatureKey(signatureSecretKey: Uint8Array): Promise<{
    privateKey: Uint8Array; // 32 bytes scalar
    publicKey: Uint8Array; // Packed Point
}> {
    const babyjub = await buildBabyjub();
    // Use the signature key as entropy/seed for the privacy key
    // We hash it to ensure it's uniformly distributed before modulo
    // or just assume it's good entropy. For robustness, Hash(Secret) -> Scalar
    const hash = await crypto.subtle.digest('SHA-256', signatureSecretKey as any);
    const scalarBigInt = BigInt('0x' + Buffer.from(hash).toString('hex')) % babyjub.order;
    
    // Calculate Public Key Point
    const pubKeyPoint = babyjub.mulPointEscalar(babyjub.Base8, scalarBigInt);
    const pubKeyPacked = babyjub.packPoint(pubKeyPoint);
    
    // Return Private Key as 32-byte buffer (be careful with big-endian/little-endian, Buffer.from is big-endian hex usually)
    const privKeyHex = scalarBigInt.toString(16).padStart(64, '0');
    
    return {
        privateKey: Buffer.from(privKeyHex, 'hex'),
        publicKey: Buffer.from(pubKeyPacked)
    };
}

// AES-GCM Encryption
async function aesEncrypt(data: object, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );
    
    // Pack IV + Ciphertext
    const buffer = Buffer.concat([Buffer.from(iv), Buffer.from(cipherBuffer)]);
    return buffer.toString('base64');
}

// AES-GCM Decryption
async function aesDecrypt(blobBase64: string, key: CryptoKey): Promise<any> {
    const buffer = Buffer.from(blobBase64, 'base64');
    const iv = buffer.subarray(0, 12);
    const ciphertext = buffer.subarray(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    
    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded);
}

export async function decryptNoteBlob(
  privateKey: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  encryptedBlob: string // base64
): Promise<DecryptedNote> {
  // Initialize Circom libraries
  const babyjub = await buildBabyjub();
  const poseidon = await buildPoseidon();

  // 1. Reconstruct key points
  let ephPubKeyPoint;
  try {
     // Try unpacking compressed point
     ephPubKeyPoint = babyjub.unpackPoint(ephemeralPublicKey);
  } catch (e) {
     // If fails (maybe already unpacked or raw), try raw assuming format match
     // For robustness, create point from buffer if possible or throw
     throw new Error("Invalid ephemeral public key format");
  }

  // 2. ECDH: Shared Key = Prv * Pub
  // privateKey is raw bytes of scalar? Or 32-byte scalar?
  // ensure scalar is BigInt
  const privKeyScalar = BigInt('0x' + Buffer.from(privateKey).toString('hex'));
  
  const sharedKeyPoint = babyjub.mulPointEscalar(ephPubKeyPoint, privKeyScalar);
  
  // 3. Derive Symmetric Key
  // K = Poseidon(x, y)
  const sharedSecretF = poseidon([sharedKeyPoint[0], sharedKeyPoint[1]]);
  // Convert F element to BigIntStr -> Hash -> AES Key
  const sharedSecretBigInt = BigInt(babyjub.F.toString(sharedSecretF));
  
  const aesKey = await deriveAesKey(sharedSecretBigInt);

  // 4. Decrypt Blob
  try {
      const decryptedData = await aesDecrypt(encryptedBlob, aesKey);
      
      // Convert back to typed Note
      return {
          amount: BigInt(decryptedData.amount),
          blindingFactor: BigInt(decryptedData.blindingFactor || 0), // handle legacy
          leafIndex: decryptedData.leafIndex || 0,
          commitment: decryptedData.commitment,
          nullifier: toBuffer(decryptedData.nullifier),
          blinding: toBuffer(decryptedData.blinding),
          publicKey: toBuffer(decryptedData.publicKey)
      };
  } catch (e: any) {
      // OperationError usually means "tag mismatch" (wrong key / not our note)
      if (e.name === 'OperationError') {
          console.debug("Note decryption skipped (not yours or legacy format)");
          throw new Error("Note not yours");
      }
      console.warn("Decryption failed for note:", e);
      throw e; // Rethrow to let caller handle logging if needed, or see the cause
  }
}

export async function encryptNote(
  recipientPublicKey: Uint8Array,
  noteData: {
    amount: bigint;
    blinding: Uint8Array;
    leafIndex: number;
    nullifier: Uint8Array;
    publicKey: Uint8Array;
  }
): Promise<{
  ephemeralPublicKey: string; // base64
  encryptedBlob: string; // base64
}> { 
    const babyjub = await buildBabyjub();
    const poseidon = await buildPoseidon();

    // 1. Generate Ephemeral Keypair (Random Scalar)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const ephPrivKeyScalar = BigInt('0x' + Buffer.from(randomBytes).toString('hex')) % babyjub.order; 
    
    // Compute Ephemeral Public Key Point = G * ephPriv
    const ephPubKeyPoint = babyjub.mulPointEscalar(babyjub.Base8, ephPrivKeyScalar);
    // Pack point to bytes
    const ephPubKeyPacked = babyjub.packPoint(ephPubKeyPoint);

    // 2. ECDH with Recipient Public Key
    // Recipient Key is raw bytes (packed or unpacked?)
    // Assuming input `recipientPublicKey` is packed bytes from `payer.publicKey`? 
    // WAIT: Solana keys are Ed25519. BabyJubJub is different curve!
    // CRITICAL: We cannot ECDH between Ed25519 key and BabyJubJub key directly.
    // The Privacy Pool uses BabyJubJub keys (Encrypted Notes).
    // The SDK `createNote` likely uses BabyJubJub.
    // Does our `wallet.publickey` correspond to a BabyJubJub key? 
    // Usually Privacy protocols have a SEPARATE keypair for BabyJubJub derived from signature key.
    // OR they use Ed25519 for everything if using specific curve adapters (rare).
    // Let's assume for now the user is passing a VALID BabyJubJub public key.
    // If `recipientPublicKey` IS the Solana Public Key (Ed25519), this math WILL FAIL or be meaningless.
    // FIX: The user asks to "integrate blind mailbox". The guide implies a privacy key.
    // In `App.tsx`, we passed `myPubKey = (wallet as any).payer.publicKey.toBytes()`. This is Ed25519.
    // This is a logic gap. We need to derive a BabyJubJub key from the Ed25519 key (seed).
    // Usually: Seed -> Ed25519 (Solana) AND Seed -> BabyJubJub (Privacy).
    // For this implementation, I will treat the input as a SEED for BabyJubJub if possible, or assume caller handles it.
    // BUT `App.tsx` calls it with Ed25519 key. 
    // To make ECDH work, we treat encryption key generation as: 
    // We need a way to get a BabyJubJub Point from the recipient key.
    // If recipient is US, we know our private key.
    // If recipient is Other, we need their BabyJubJub key.
    // Since we are "shielding funds" (Sending to Self mainly for now), `App.tsx` logic is: `encryptNote(myPubKey`.
    // Let's modify `App.tsx` later to pass the derived BabyJubJub key?
    // Or, for `encryptNote`, we simply GENERATE a new BabyJubJub keypair from the `recipientPublicKey` BYTES acting as a seed?
    // No, that implies we know their private seed.
    // 
    // BLOCKING ISSUE: Ed25519 Public Key cannot be used as BabyJubJub public key.
    // Workaround for Alpha/Demo:
    // We will use the `recipientPublicKey` bytes to DETERMINISTICALLY DERIVE a `BabyJubJub Public Key`? NO, impossible without private scalar.
    // 
    // REAL SOLUTION: The Wallet must hold a Privacy Keypair (BabyJubJub).
    // `NoteManager` or `Wallet` class should expose `privacyPublicKey`.
    // Since we don't have that plumbing yet, and user wants "different notes",
    // We will derive a symmetric key from the **Ed25519 Key directly**? No, that's regular Encryption (ECIES on Ed25519).
    // But we wanted to use `circomlibjs`.
    //
    // OK, Compromise for "Mock -> Realish":
    // We will generate a BabyJubJub Keypair **derived from the Solana Private Key** inside the Wallet/App.
    // And use THAT for encryption.
    // In `App.tsx`, we have access to `secretKey`.
    // We can derive a BabyJubJub Key from `secretKey`.
    //
    // So in `encryptNote`, expecting `recipientPublicKey` to be a BabyJubJub point is correct.
    // I need to update `App.tsx` to pass the BabyJubJub Public Key, not Ed25519 Public Key.
    // 
    // I will proceed with implementing `encryptNote` assuming `recipientPublicKey` IS a valid BabyJubJub Point (packed).
    // I will fix `App.tsx` in the next step to derive this key properly.
    
    // Unpack Recipient Key (Expect BabyJubJub Packed Point)
    let recipientKeyPoint;
    try {
        recipientKeyPoint = babyjub.unpackPoint(recipientPublicKey);
    } catch(e) {
        throw new Error("Invalid recipient public key (must be BabyJubJub point)");
    }

    // Shared Secret = EphPriv * RecipientPub
    const sharedKeyPoint = babyjub.mulPointEscalar(recipientKeyPoint, ephPrivKeyScalar);
    const sharedSecretF = poseidon([sharedKeyPoint[0], sharedKeyPoint[1]]);
    const sharedSecretBigInt = BigInt(babyjub.F.toString(sharedSecretF));

    const aesKey = await deriveAesKey(sharedSecretBigInt);
    
    // Serialize Note Data for JSON encryption (converting BigInts to strings for JSON safety)
    const jsonReadyData = {
        amount: noteData.amount.toString(),
        blindingFactor: "0", // dummy if not present
        leafIndex: noteData.leafIndex,
        commitment: "derived_later", // or pass in
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
