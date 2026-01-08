import type { EncryptedData } from "./encryption";

const WALLET_STORAGE_KEY = "veilo_encrypted_wallet";
const TOKEN_STORAGE_KEY = "veilo_auth_token";

export interface StoredWalletData {
  encryptedSecretKey: EncryptedData;
  encryptedMnemonic: EncryptedData;
  encryptedVeiloPublicKey: EncryptedData;
  encryptedVeiloPrivateKey: EncryptedData;
  publicKey: string; // Not encrypted
  username?: string; // Not encrypted
}

// Helper to check if we are in an extension environment
const isExtension = () => {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
};

// Save encrypted wallet data and optional token
export const saveWallet = async (
  data: StoredWalletData,
  token?: string
): Promise<void> => {
  if (isExtension()) {
    const storageObj: { [key: string]: any } = { [WALLET_STORAGE_KEY]: data };
    if (token) {
      storageObj[TOKEN_STORAGE_KEY] = token;
    }
    await chrome.storage.local.set(storageObj);
  } else {
    // Fallback for local development (browser)
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data));
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }
};

// Load encrypted wallet data
export const loadWallet = async (): Promise<StoredWalletData | undefined> => {
  if (isExtension()) {
    const result = await chrome.storage.local.get([WALLET_STORAGE_KEY]);
    return result[WALLET_STORAGE_KEY] as StoredWalletData | undefined;
  } else {
    // Fallback
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredWalletData) : undefined;
  }
};

// Load auth token
export const loadToken = async (): Promise<string | undefined> => {
  if (isExtension()) {
    const result = await chrome.storage.local.get([TOKEN_STORAGE_KEY]);
    return result[TOKEN_STORAGE_KEY] as string | undefined;
  } else {
    // Fallback
    return localStorage.getItem(TOKEN_STORAGE_KEY) || undefined;
  }
};

// Clear wallet data
export const clearWallet = async (): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.remove([WALLET_STORAGE_KEY, TOKEN_STORAGE_KEY]);
  } else {
    // Fallback
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};
