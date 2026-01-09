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
    await chrome.storage.local.remove([
      WALLET_STORAGE_KEY,
      TOKEN_STORAGE_KEY,
      SESSION_STORAGE_KEY,
    ]);
  } else {
    // Fallback
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

// --- Session Management ---
const SESSION_STORAGE_KEY = "veilo_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface SessionData {
  encryptedPassword: string; // Password encrypted with a session key
  timestamp: number;
  publicKey: string;
  username: string;
}

// Save session data
export const saveSession = async (data: SessionData): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: data });
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  }
};

// Load session data
export const loadSession = async (): Promise<SessionData | undefined> => {
  if (isExtension()) {
    const result = await chrome.storage.local.get([SESSION_STORAGE_KEY]);
    return result[SESSION_STORAGE_KEY] as SessionData | undefined;
  } else {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SessionData) : undefined;
  }
};

// Clear session data
export const clearSession = async (): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.remove([SESSION_STORAGE_KEY]);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

// Check if session is still valid (within timeout)
export const isSessionValid = (session: SessionData): boolean => {
  const now = Date.now();
  return now - session.timestamp < SESSION_TIMEOUT_MS;
};

// Update session timestamp (call this on user activity)
export const updateSessionTimestamp = async (): Promise<void> => {
  const session = await loadSession();
  if (session) {
    session.timestamp = Date.now();
    await saveSession(session);
  }
};
