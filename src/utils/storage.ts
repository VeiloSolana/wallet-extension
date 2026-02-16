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
  token?: string,
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
const DEFAULT_SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (default fallback)

/** Import dynamically to avoid circular deps – consumers can also override via setSessionTimeoutMs */
let _sessionTimeoutMs: number | null = null;

/** Set a custom session timeout (called when auto-lock settings load) */
export const setSessionTimeoutMs = (ms: number) => {
  _sessionTimeoutMs = ms;
};

/** Get the current session timeout in ms */
const getSessionTimeoutMs = (): number => {
  return _sessionTimeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;
};

export interface SessionData {
  timestamp: number;
  publicKey: string;
  username: string;
  // AES-GCM encrypted password for session unlock
  encryptedPassword?: EncryptedData;
  // Session key encoded in base64 (stored separately to preserve the real salt)
  sessionKeyB64?: string;
}

// Save session data
export const saveSession = async (data: SessionData): Promise<void> => {
  if (isExtension()) {
    // Use session storage for better persistence
    await chrome.storage.session.set({ [SESSION_STORAGE_KEY]: data });
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  }
};

// Load session data
export const loadSession = async (): Promise<SessionData | undefined> => {
  if (isExtension()) {
    // Use session storage
    const result = await chrome.storage.session.get([SESSION_STORAGE_KEY]);
    return result[SESSION_STORAGE_KEY] as SessionData | undefined;
  } else {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SessionData) : undefined;
  }
};

// Clear session data
export const clearSession = async (): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.session.remove([SESSION_STORAGE_KEY]);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

// Check if session is still valid (within timeout)
export const isSessionValid = (session: SessionData): boolean => {
  const timeoutMs = getSessionTimeoutMs();
  // If timeout is 0, session is never valid (lock immediately)
  if (timeoutMs === 0) return false;
  const now = Date.now();
  return now - session.timestamp < timeoutMs;
};

// Update session timestamp (call this on user activity)
export const updateSessionTimestamp = async (): Promise<void> => {
  const session = await loadSession();
  if (session) {
    session.timestamp = Date.now();
    await saveSession(session);
  }
};

// Save session with password (for auto-unlock during session)
// Uses AES-256-GCM with random IV and salt for secure encryption
export const saveSessionWithPassword = async (
  publicKey: string,
  username: string,
  password: string,
): Promise<void> => {
  // Import encrypt function from encryption.ts
  const { encrypt } = await import("./encryption");

  // Generate a random session key for encrypting the password
  const sessionKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Encrypt password with AES-256-GCM using the random session key
  const encryptedPassword = await encrypt(password, sessionKey);

  // Store the encrypted password in session storage
  // The session key is kept in a separate field so the original PBKDF2 salt is preserved
  // Note: sessionKey is stored in memory-only chrome.storage.session (cleared on browser close)
  const sessionData: SessionData = {
    timestamp: Date.now(),
    publicKey,
    username,
    encryptedPassword, // keep cipherText, iv, and salt intact
    sessionKeyB64: btoa(sessionKey),
  };

  await saveSession(sessionData);
};

// Get password from session (if valid)
export const getSessionPassword = async (): Promise<string | null> => {
  const session = await loadSession();
  if (!session || !isSessionValid(session)) {
    return null;
  }
  if (!session.encryptedPassword) {
    return null;
  }

  try {
    // Import decrypt function from encryption.ts
    const { decrypt } = await import("./encryption");

    // Extract session key from the dedicated field (or legacy salt field for backwards compat)
    const sessionKey = session.sessionKeyB64
      ? atob(session.sessionKeyB64)
      : atob(session.encryptedPassword.salt);

    // Decrypt password with AES-256-GCM using the original salt
    const decrypted = await decrypt(
      {
        cipherText: session.encryptedPassword.cipherText,
        iv: session.encryptedPassword.iv,
        salt: session.encryptedPassword.salt,
      },
      sessionKey,
    );

    return decrypted;
  } catch (error) {
    // Session data is corrupted (likely saved with old broken format) — clear it
    console.warn(
      "Session password unrecoverable, clearing stale session.",
      error,
    );
    await clearSession();
    return null;
  }
};
