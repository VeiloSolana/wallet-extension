import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * Generate a new mnemonic phrase (12 words by default)
 * @param strength 128 for 12 words, 256 for 24 words
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
 * Path: m/44'/501'/0'/0' (Solana standard - same as Phantom, Solflare, etc.)
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
 * Used for proving wallet ownership during account restore
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
 * Create auth message for challenge-response authentication
 */
export function createAuthMessage(
  publicKey: string,
  challenge: string,
): string {
  return `Veilo Authentication\nPublic Key: ${publicKey}\nChallenge: ${challenge}\nTimestamp: ${Date.now()}`;
}
