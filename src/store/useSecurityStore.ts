// Security settings store - auto-lock timeout preferences
// Mirrors wallet-app/store/securityStore.ts for feature parity

const SECURITY_SETTINGS_KEY = "veilo_security_settings";

export type AutoLockTimeout = 0 | 30 | 120 | 300;

export const AUTO_LOCK_OPTIONS: { label: string; value: AutoLockTimeout }[] = [
  { label: "Immediately", value: 0 },
  { label: "30 seconds", value: 30 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
];

// Helper to check if we are in an extension environment
const isExtension = () => {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
};

// In-memory state (zustand-like but minimal to avoid extra deps conflict)
let _autoLockTimeout: AutoLockTimeout = 300; // default 5 minutes
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export const useSecuritySettings = () => {
  // For React components, use useSyncExternalStore-style or just re-export getters
  // This file provides imperative helpers; the PreferencesPage will use local state synced from here.
};

/** Load persisted auto-lock setting */
export async function loadSecuritySettings(): Promise<{
  autoLockTimeout: AutoLockTimeout;
}> {
  try {
    if (isExtension()) {
      const result = await chrome.storage.local.get([SECURITY_SETTINGS_KEY]);
      const stored = result[SECURITY_SETTINGS_KEY] as
        | { autoLockTimeout?: AutoLockTimeout }
        | undefined;
      if (stored) {
        _autoLockTimeout = stored.autoLockTimeout ?? 300;
      }
    } else {
      const raw = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { autoLockTimeout?: AutoLockTimeout };
        _autoLockTimeout = stored.autoLockTimeout ?? 300;
      }
    }
  } catch (error) {
    console.error("Failed to load security settings:", error);
  }
  return { autoLockTimeout: _autoLockTimeout };
}

/** Persist auto-lock setting */
export async function saveAutoLockTimeout(
  timeout: AutoLockTimeout,
): Promise<void> {
  _autoLockTimeout = timeout;
  const data = { autoLockTimeout: timeout };
  try {
    if (isExtension()) {
      await chrome.storage.local.set({ [SECURITY_SETTINGS_KEY]: data });
    } else {
      localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error("Failed to save security settings:", error);
  }
  notify();
}

/** Get the current auto-lock timeout value in seconds (0 = immediately) */
export function getAutoLockTimeout(): AutoLockTimeout {
  return _autoLockTimeout;
}

/** Convert auto-lock timeout to milliseconds for session validation.
 *  Returns 0 when "immediately" is selected (session never persists). */
export function getAutoLockTimeoutMs(): number {
  return _autoLockTimeout * 1000;
}
