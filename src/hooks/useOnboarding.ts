import { useState, useEffect, useCallback } from "react";
import {
  loadWallet,
  loadSession,
  clearSession,
  isSessionValid,
  getSessionPassword,
} from "../utils/storage";

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
      const encryptedWallet = await loadWallet();
      if (encryptedWallet) {
        console.log("Encrypted wallet found, checking session...");
        setHasWallet(true);

        const session = await loadSession();
        if (session && isSessionValid(session)) {
          // Try to get the session password for auto-login
          const sessionPassword = await getSessionPassword();
          if (sessionPassword && onAutoLogin) {
            console.log(
              "Valid session with password found, auto-logging in...",
            );
            setIsAutoLoggingIn(true);
            try {
              await onAutoLogin(sessionPassword);
              console.log("Auto-login successful");
            } catch (e) {
              console.error("Auto-login failed:", e);
              await clearSession();
            } finally {
              setIsAutoLoggingIn(false);
            }
          } else {
            console.log(
              "Valid session found but no password, user must login.",
            );
          }
        } else if (session) {
          console.log("Session expired, clearing...");
          await clearSession();
        }
      } else {
        console.log("No wallet found, starting onboarding");
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
