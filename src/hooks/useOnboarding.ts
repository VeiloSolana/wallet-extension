import { useState, useEffect, useCallback } from "react";
import {
  loadWallet,
  loadSession,
  clearSession,
  isSessionValid,
  getSessionPassword,
  setSessionTimeoutMs,
  updateSessionTimestamp,
} from "../utils/storage";
import {
  loadSecuritySettings,
  getAutoLockTimeoutMs,
} from "../store/useSecurityStore";

// ============================================================================
// Types
// ============================================================================

export type OnboardingStep =
  | "welcome"
  | "username"
  | "password"
  | "phrase"
  | "walkthrough"
  | "done"
  | "restore-seedphrase"
  | "restore-password";

interface UseOnboardingParams {
  isAuthenticated: boolean;
  logout: () => void;
  onAutoLogin?: (password: string) => Promise<void>;
  externalError?: string;
  setExternalError?: React.Dispatch<React.SetStateAction<string>>;
}

interface UseOnboardingReturn {
  // State
  onboardingStep: OnboardingStep;
  username: string;
  generatedPhrase: string[];
  hasWallet: boolean;
  error: string;
  isRestoreFlow: boolean;
  restoreMnemonic: string;
  showOnboarding: boolean;
  isInitialized: boolean;
  isAutoLoggingIn: boolean;

  // Setters (for external handlers)
  setOnboardingStep: (step: OnboardingStep) => void;
  setUsername: (name: string) => void;
  setGeneratedPhrase: (phrase: string[]) => void;
  setHasWallet: (hasWallet: boolean) => void;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setRestoreMnemonic: (mnemonic: string) => void;
  setIsRestoreFlow: (isRestoreFlow: boolean) => void;

  // Simple navigation handlers
  handleUsernameSubmit: (name: string) => void;
  handlePhraseConfirm: () => void;
  handleWalkthroughComplete: () => void;
  handleStartRestore: () => void;
  handleSeedphraseSubmit: (seedphrase: string) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useOnboarding({
  isAuthenticated,
  logout,
  onAutoLogin,
  externalError,
  setExternalError,
}: UseOnboardingParams): UseOnboardingReturn {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("welcome");
  const [username, setUsername] = useState("");
  const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
  const [hasWallet, setHasWallet] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [isRestoreFlow, setIsRestoreFlow] = useState(false);
  const [restoreMnemonic, setRestoreMnemonic] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  // Use external error state if provided, otherwise use internal
  const error = externalError !== undefined ? externalError : internalError;
  const setError = setExternalError || setInternalError;

  // ---------------------------------------------------------------------------
  // Check for existing wallet on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkWalletAndSession = async () => {
      // Load security settings FIRST so session timeout is correct
      await loadSecuritySettings();
      setSessionTimeoutMs(getAutoLockTimeoutMs());

      const encryptedWallet = await loadWallet();
      if (encryptedWallet) {
        setHasWallet(true);

        const session = await loadSession();
        if (session && isSessionValid(session)) {
          // Try to get the session password for auto-login
          const sessionPassword = await getSessionPassword();
          if (sessionPassword && onAutoLogin) {
            setIsAutoLoggingIn(true);
            try {
              await onAutoLogin(sessionPassword);
              // Refresh the session timestamp on successful auto-login
              await updateSessionTimestamp();
            } catch (e) {
              console.error("Auto-login failed:", e);
              await clearSession();
            } finally {
              setIsAutoLoggingIn(false);
            }
          } else {
          }
        } else if (session) {
          await clearSession();
        }
      } else {
      }
      setIsInitialized(true);
    };
    checkWalletAndSession();
  }, [logout, onAutoLogin]);

  // ---------------------------------------------------------------------------
  // Simple navigation handlers
  // ---------------------------------------------------------------------------
  const handleUsernameSubmit = useCallback((name: string) => {
    setUsername(name);
    setOnboardingStep("password");
  }, []);

  const handlePhraseConfirm = useCallback(() => {
    setOnboardingStep("walkthrough");
  }, []);

  const handleWalkthroughComplete = useCallback(() => {
    setOnboardingStep("done");
  }, []);

  const handleStartRestore = useCallback(() => {
    setIsRestoreFlow(true);
    setOnboardingStep("restore-seedphrase");
  }, []);

  const handleSeedphraseSubmit = useCallback((seedphrase: string) => {
    setRestoreMnemonic(seedphrase);
    setOnboardingStep("restore-password");
  }, []);

  // ---------------------------------------------------------------------------
  // Computed: Show onboarding?
  // ---------------------------------------------------------------------------
  const showOnboarding =
    (!hasWallet && !isAuthenticated) ||
    (onboardingStep !== "welcome" && onboardingStep !== "done");

  return {
    // State
    onboardingStep,
    username,
    generatedPhrase,
    hasWallet,
    error,
    isRestoreFlow,
    restoreMnemonic,
    showOnboarding,
    isInitialized,
    isAutoLoggingIn,

    // Setters (for external handlers in App.tsx)
    setOnboardingStep,
    setUsername,
    setGeneratedPhrase,
    setHasWallet,
    setError,
    setRestoreMnemonic,
    setIsRestoreFlow,

    // Simple navigation handlers
    handleUsernameSubmit,
    handlePhraseConfirm,
    handleWalkthroughComplete,
    handleStartRestore,
    handleSeedphraseSubmit,
  };
}
