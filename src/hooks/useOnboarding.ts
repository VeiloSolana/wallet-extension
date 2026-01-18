import { useState, useEffect, useCallback } from "react";
import {
  loadWallet,
  loadSession,
  clearSession,
  isSessionValid,
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
}: UseOnboardingParams): UseOnboardingReturn {
  
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("welcome");
  const [username, setUsername] = useState("");
  const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
  const [hasWallet, setHasWallet] = useState(false);
  const [error, setError] = useState("");
  const [isRestoreFlow, setIsRestoreFlow] = useState(false);
  const [restoreMnemonic, setRestoreMnemonic] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

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
          console.log("Valid session found, but password is not stored. User must login.");
          await clearSession();
        } else if (session) {
          console.log("Session expired, logging out...");
          await clearSession();
          logout();
        }
      } else {
        console.log("No wallet found, starting onboarding");
      }
      setIsInitialized(true);
    };
    checkWalletAndSession();
  }, [logout]);

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
