/// <reference types="chrome"/>
import { useState, useCallback, useEffect } from "react";

import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

import { Buffer } from "buffer";

// Hooks
import { useNotes } from "./hooks/useNotes";
import { useTransactions } from "./hooks/useTransactions";
import { useDAppRequests } from "./hooks/useDAppRequests";
import { useOnboarding } from "./hooks/useOnboarding";

import { WalletHeader } from "./components/common/layout/WalletHeader";

import { BalanceDisplay } from "./components/features/wallet/BalanceDisplay";
import { ActionButtons } from "./components/features/wallet/ActionButtons";
import { TransactionList } from "./components/features/wallet/TransactionList";
import { ActivityPage } from "./components/pages/wallet/ActivityPage";
import { TransactionDetailsPage } from "./components/pages/wallet/TransactionDetailsPage";
import { WithdrawPage } from "./components/pages/wallet/WithdrawPage";
import { ReceiveModal } from "./components/features/wallet/modals/ReceiveModal";
import { DepositModal } from "./components/features/wallet/modals/DepositModal";
import { TransferPage } from "./components/pages/wallet/TransferPage";
import { WelcomePage } from "./components/pages/auth/WelcomePage";
import { CreatePasswordPage } from "./components/pages/auth/CreatePasswordPage";
import { SecretPhrasePage } from "./components/pages/auth/SecretPhrasePage";
import { LoginPage } from "./components/pages/auth/LoginPage";
import { CreateUsernamePage } from "./components/pages/auth/CreateUsernamePage";
import { OnboardingWalkthrough } from "./components/pages/onboarding/OnboardingWalkthrough";
import { RestoreSeedphrasePage } from "./components/pages/auth/RestoreSeedphrasePage";
import { DAppApprovalPage } from "./components/pages/dapp/DAppApprovalPage";
import { TransactionApprovalPage } from "./components/pages/dapp/TransactionApprovalPage";
import { ConnectedDAppBar } from "./components/common/layout/ConnectedDAppBar";
import { BottomTabs } from "./components/common/layout/BottomTabs";
import { DAppPage } from "./components/pages/dapp/DAppPage";
import { SwapPage } from "./components/pages/wallet/SwapPage";
import { PreferencesPage } from "./components/pages/wallet/PreferencesPage";
import { useAuthStore } from "./store/useAuthStore";
import {
  useRegisterUser,
  useRestoreAccount,
  useGetChallenge,
} from "./hooks/queries/useAuthQueries";
import {
  generateMnemonic,
  deriveKeypairFromMnemonic,
  signAuthMessage,
  createAuthMessage,
} from "./utils/keyGeneration";
import { Wallet } from "./utils/wallet";
import privacyPoolIdl from "../program/idl/privacy_pool.json";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type PrivacyPool } from "../program/types/privacy_pool";
import "./App.css";
import { AnimatePresence } from "framer-motion";

import { encrypt, decrypt } from "./utils/encryption";
import {
  saveWallet,
  loadWallet,
  saveSessionWithPassword,
  clearWallet,
  clearSession,
  setSessionTimeoutMs,
  // Note: loadSession, isSessionValid moved to useOnboarding hook
} from "./utils/storage";

import {
  loadSecuritySettings,
  getAutoLockTimeoutMs,
} from "./store/useSecurityStore";

import { NoteManager } from "./lib/noteManager";
import { syncNotesFromRelayer } from "./lib/noteSync";
import { decryptVeiloKeyFromServer } from "./transactions/ECDH/helpers";
// Note: Transaction handlers and helpers moved to hooks

import { getRpcEndpoint } from "./lib/network";
import type { Transaction } from "./types/transaction";

// Simple interface for a stored note
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StoredNote {
  commitment: string; // hex string
  amount: number;
  root: string; // hex string (dummy for now)
  timestamp: number;
}

// PendingDAppRequest interface is now imported from useDAppRequests hook

function App() {
  // Auth state
  const { isAuthenticated, setAuth, user, logout } = useAuthStore();
  const { mutateAsync: registerUser, isPending: isRegistering } =
    useRegisterUser();
  const { mutateAsync: restoreAccountApi, isPending: isRestoring } =
    useRestoreAccount();
  const { mutateAsync: getChallenge } = useGetChallenge();

  // Local error state (shared with useOnboarding)
  const [localError, setLocalError] = useState("");

  // Security settings are now loaded in useOnboarding before session check.
  // This effect keeps the in-memory timeout in sync if settings change externally.
  useEffect(() => {
    loadSecuritySettings().then(() => {
      setSessionTimeoutMs(getAutoLockTimeoutMs());
    });
  }, []);

  // Handle wallet reset (clears all data, returns to welcome)
  const handleResetWallet = useCallback(async () => {
    try {
      await clearWallet();
      await clearSession();
      logout();
    } catch (err) {
      console.error("Reset wallet error:", err);
    }
  }, [logout]);

  // Handle login for returning users (moved before useOnboarding so it can be passed)
  const handleLogin = useCallback(
    async (password: string) => {
      try {
        const storedWallet = await loadWallet();
        if (!storedWallet) {
          console.error("No wallet found");
          return;
        }

        // Decrypt all sensitive data
        const secretKeyStr = await decrypt(
          storedWallet.encryptedSecretKey,
          password,
        );
        const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
        const keypair = Keypair.fromSecretKey(secretKey);

        const veiloPublicKey = await decrypt(
          storedWallet.encryptedVeiloPublicKey,
          password,
        );
        const veiloPrivateKey = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password,
        );

        // Store decrypted keys for use in the session
        setPassword(password);

        // Initialize NoteManager with account context
        const accountNoteManager = new NoteManager(
          storedWallet.publicKey,
          Buffer.from(secretKey).toString("hex"),
        );
        setNoteManager(accountNoteManager);

        // Initialize Session
        const walletInstance = new Wallet(keypair);
        setWallet(walletInstance);
        setAddress(keypair.publicKey.toString());

        const conn = new Connection(getRpcEndpoint(), "confirmed");
        setConnection(conn);

        const provider = new anchor.AnchorProvider(conn, walletInstance, {
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        });
        anchor.setProvider(provider);

        const programInstance = new anchor.Program(
          privacyPoolIdl as Idl,
          provider,
        ) as Program<any>;
        setProgram(programInstance);

        setAuth({
          username: storedWallet.username || "User",
          publicKey: keypair.publicKey.toString(),
        });

        // Save session with password for auto-unlock within timeout window
        await saveSessionWithPassword(
          keypair.publicKey.toString(),
          storedWallet.username || "User",
          password,
        );

        // Sync with relayer after a short delay
        setTimeout(async () => {
          try {
            const privKeyHex = Buffer.from(secretKey).toString("hex");
            console.log("🔄 Starting sync with relayer...");
            try {
              const syncedCount = await syncNotesFromRelayer(
                accountNoteManager,
                keypair.publicKey.toString(),
                privKeyHex,
                veiloPrivateKey,
                veiloPublicKey,
              );
              console.log(
                `✅ Sync completed. ${syncedCount} new notes synced.`,
              );
            } catch (syncError) {
              console.error("❌ Sync from relayer failed:", syncError);
            }
          } catch (e) {
            console.error("Initial sync failed:", e);
          }
        }, 500);
      } catch (e) {
        console.error("Login failed:", e);
        setLocalError("Incorrect Password");
      }
    },
    [setAuth, setLocalError],
  );

  // Onboarding state & handlers (from useOnboarding hook)
  const {
    onboardingStep,
    username,
    generatedPhrase,
    error,
    restoreMnemonic,
    showOnboarding,
    isInitialized,
    isAutoLoggingIn,
    setOnboardingStep,
    setGeneratedPhrase,
    setError,
    setIsRestoreFlow,
    handleUsernameSubmit,
    handlePhraseConfirm,
    handleWalkthroughComplete,
    handleStartRestore,
    handleSeedphraseSubmit,
  } = useOnboarding({
    isAuthenticated,
    logout,
    onAutoLogin: handleLogin,
    externalError: localError,
    setExternalError: setLocalError,
  });

  // dApp approval state will be initialized after noteManager/wallet

  // Note: dApp requests useEffect moved to useDAppRequests hook

  const [address, setAddress] = useState("");

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<
    "private" | "dapp" | "swap" | "preferences"
  >("private");

  // Navigation State - includes pages for withdraw and transfer
  const [view, setView] = useState<
    "dashboard" | "activity" | "details" | "withdraw" | "transfer"
  >("dashboard");
  const [lastView, setLastView] = useState<"dashboard" | "activity">(
    "dashboard",
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Modal states (only for modals, not pages)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [password, setPassword] = useState("");

  // SDK state
  // @ts-expect-error - Used by setConnection
  const [connection, setConnection] = useState<Connection | undefined>();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  // @ts-expect-error - Used by setProgram
  const [program, setProgram] = useState<Program<PrivacyPool> | undefined>();
  // isInitialized now comes from useOnboarding hook
  const [noteManager, setNoteManager] = useState<NoteManager | null>(null);

  // Notes state (from hook)
  // @ts-expect-error - Used by setStoredNotes
  const [storedNotes, setStoredNotes] = useState<StoredNote[]>([]);

  const {
    balance,
    tokenBalances,
    transactions,
    isSyncing,
    isLoadingNotes,
    loadNotes,
    syncNotes: handleSyncNotes,
  } = useNotes({
    noteManager,
    wallet: wallet || null,
    password,
    isAuthenticated,
  });

  // Note: loadNotes() and handleSyncNotes() are now provided by useNotes hook

  // Transaction operations (from useTransactions hook)
  const { handleSend, handleTransfer } = useTransactions({
    noteManager,
    wallet: wallet || null,
    password,
    loadNotes,
  });

  // dApp approval state & handlers (from useDAppRequests hook)
  const {
    pendingDAppRequest,
    isApprovalProcessing,
    handleDAppApproval,
    handleDAppRejection,
  } = useDAppRequests({
    noteManager,
    wallet: wallet || null,
    password,
  });

  // Note: handleUsernameSubmit, handlePhraseConfirm, handleWalkthroughComplete,
  // handleStartRestore, handleSeedphraseSubmit now come from useOnboarding hook

  const handleCreatePassword = async (password: string) => {
    try {
      // 1. Generate mnemonic CLIENT-SIDE (never sent to server!)
      const mnemonic = generateMnemonic();

      // 2. Derive keypair CLIENT-SIDE
      const keypair = await deriveKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toString();
      const privateKeyHex = Buffer.from(
        keypair.secretKey.slice(0, 32),
      ).toString("hex");

      // 3. Register with server (only send publicKey + username, NOT private key or mnemonic)
      const response = await registerUser({ username, publicKey });

      // 4. Decrypt veiloPrivateKey from server response using ECDH
      // NOTE: ephemeralPublicKey is base58 encoded (Solana public key format)
      const serverEphemeralPubKey = bs58.decode(response.ephemeralPublicKey);
      const veiloPrivateKey = decryptVeiloKeyFromServer(
        keypair.secretKey,
        serverEphemeralPubKey,
        response.encryptedVeiloPrivateKey,
      );
      const veiloPublicKey = response.veiloPublicKey;

      // 5. Encrypt all sensitive data with user's password (local only)
      const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
      const encryptedSecretKey = await encrypt(secretKeyStr, password);
      const encryptedMnemonic = await encrypt(mnemonic, password);
      const encryptedVeiloPublicKey = await encrypt(veiloPublicKey, password);
      const encryptedVeiloPrivateKey = await encrypt(veiloPrivateKey, password);

      // 6. Store all encrypted data locally
      await saveWallet(
        {
          encryptedSecretKey,
          encryptedMnemonic,
          encryptedVeiloPublicKey,
          encryptedVeiloPrivateKey,
          publicKey,
          username: response.username,
        },
        response.token,
      );

      // 7. Store password in state for session use
      setPassword(password);

      // 8. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(publicKey, privateKeyHex);
      setNoteManager(accountNoteManager);

      // 9. Update UI - show mnemonic to user
      setGeneratedPhrase(mnemonic.split(" "));
      setOnboardingStep("phrase");

      // Initialize session immediately
      const walletInstance = new Wallet(keypair);
      setWallet(walletInstance);
      setAddress(keypair.publicKey.toString());

      // Setup Provider
      const conn = new Connection(getRpcEndpoint(), "confirmed");
      setConnection(conn);
      const provider = new anchor.AnchorProvider(conn, walletInstance, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      anchor.setProvider(provider);
      const programInstance = new anchor.Program(
        privacyPoolIdl as Idl,
        provider,
      ) as Program<any>;
      setProgram(programInstance);

      setAuth({ username: response.username, publicKey });

      // Sync with relayer after a short delay
      setTimeout(async () => {
        try {
          await syncNotesFromRelayer(
            accountNoteManager,
            publicKey,
            privateKeyHex,
            veiloPrivateKey,
            veiloPublicKey,
          );
          // Reload notes after sync
          await loadNotes();
        } catch (e) {
          console.error("Initial sync failed:", e);
        }
      }, 500);
    } catch (e) {
      console.error("Registration failed", e);
      setError("Registration failed. Please try again.");
    }
  };

  // Handle password creation for restore flow

  const handleRestorePassword = async (password: string) => {
    try {
      // 1. Derive keypair from mnemonic CLIENT-SIDE (never send mnemonic to server!)
      const keypair = await deriveKeypairFromMnemonic(restoreMnemonic);
      const publicKey = keypair.publicKey.toString();
      const privateKeyHex = Buffer.from(
        keypair.secretKey.slice(0, 32),
      ).toString("hex");

      // 2. Get challenge from server for signature verification
      const { challenge } = await getChallenge(publicKey);

      // 3. Sign challenge to prove ownership (no SOL required - free off-chain signature!)
      const authMessage = createAuthMessage(publicKey, challenge);
      const { signature, message } = signAuthMessage(
        authMessage,
        keypair.secretKey,
      );

      // 4. Restore account with signature proof (server verifies we own the keypair)
      const response = await restoreAccountApi({
        publicKey,
        signature,
        message,
      });

      // 5. Decrypt veiloPrivateKey from server response using ECDH
      // NOTE: ephemeralPublicKey is base58 encoded (Solana public key format)
      const serverEphemeralPubKey = bs58.decode(response.ephemeralPublicKey);
      const veiloPrivateKey = decryptVeiloKeyFromServer(
        keypair.secretKey,
        serverEphemeralPubKey,
        response.encryptedVeiloPrivateKey,
      );
      const veiloPublicKey = response.veiloPublicKey;

      // 6. Encrypt all sensitive data with user's password (local only)
      const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
      const encryptedSecretKey = await encrypt(secretKeyStr, password);
      const encryptedMnemonic = await encrypt(restoreMnemonic, password);
      const encryptedVeiloPublicKey = await encrypt(veiloPublicKey, password);
      const encryptedVeiloPrivateKey = await encrypt(veiloPrivateKey, password);

      // 7. Store all encrypted data locally
      await saveWallet(
        {
          encryptedSecretKey,
          encryptedMnemonic,
          encryptedVeiloPublicKey,
          encryptedVeiloPrivateKey,
          publicKey,
          username: response.username,
        },
        response.token,
      );

      // 8. Store password in state for session use
      setPassword(password);

      // 9. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(publicKey, privateKeyHex);
      setNoteManager(accountNoteManager);

      // 10. Initialize session immediately
      const walletInstance = new Wallet(keypair);
      setWallet(walletInstance);
      setAddress(keypair.publicKey.toString());

      // Setup Provider
      const conn = new Connection(getRpcEndpoint(), "confirmed");
      setConnection(conn);
      const provider = new anchor.AnchorProvider(conn, walletInstance, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      anchor.setProvider(provider);
      const programInstance = new anchor.Program(
        privacyPoolIdl as Idl,
        provider,
      ) as Program<any>;
      setProgram(programInstance);

      // 11. Set auth and skip to done (no phrase display or walkthrough for restore)
      setAuth({ username: response.username, publicKey });
      setOnboardingStep("done");

      // 12. Sync notes after restore
      setTimeout(async () => {
        try {
          await syncNotesFromRelayer(
            accountNoteManager,
            publicKey,
            privateKeyHex,
            veiloPrivateKey,
            veiloPublicKey,
          );
          // Reload notes via hook
          await loadNotes();
        } catch (e) {
          console.error("Initial sync after restore failed:", e);
        }
      }, 500);
    } catch (e: any) {
      console.error("Restore failed", e);
      if (e.message?.includes("not found")) {
        setError("No account found for this seed phrase");
      } else if (
        e.message?.includes("signature") ||
        e.message?.includes("Invalid")
      ) {
        setError("Authentication failed. Please check your seed phrase.");
      } else {
        setError(e?.message || "Failed to restore account");
      }
    }
  };

  // Loading state
  if (isRegistering || isRestoring || isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px]  flex flex-col items-center justify-center bg-black/90 border border-white/10">
          <div className="w-12 h-12 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          <p className="mt-4 text-zinc-500 font-mono text-sm">
            {isAutoLoggingIn
              ? "Unlocking..."
              : isRestoring
                ? "Restoring account..."
                : "Creating account..."}
          </p>
        </div>
      </div>
    );
  }

  // Note: showOnboarding now comes from useOnboarding hook

  // New user onboarding flow
  if (showOnboarding) {
    return (
      <div className="h-full  bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px]  flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <AnimatePresence mode="wait">
            {onboardingStep === "welcome" && (
              <WelcomePage
                key="welcome"
                onGetStarted={() => setOnboardingStep("username")}
                onRestore={handleStartRestore}
              />
            )}
            {onboardingStep === "username" && (
              <CreateUsernamePage
                key="username"
                onSubmit={handleUsernameSubmit}
                onBack={() => setOnboardingStep("welcome")}
              />
            )}
            {onboardingStep === "password" && (
              <CreatePasswordPage
                key="password"
                onSubmit={handleCreatePassword}
                onBack={() => setOnboardingStep("username")}
              />
            )}
            {onboardingStep === "phrase" && (
              <SecretPhrasePage
                key="phrase"
                phrase={generatedPhrase}
                onContinue={handlePhraseConfirm}
              />
            )}
            {onboardingStep === "walkthrough" && (
              <OnboardingWalkthrough
                key="walkthrough"
                onComplete={handleWalkthroughComplete}
                onClose={handleWalkthroughComplete}
              />
            )}
            {/* Restore Flow Components */}
            {onboardingStep === "restore-seedphrase" && (
              <RestoreSeedphrasePage
                key="restore-seedphrase"
                onSubmit={handleSeedphraseSubmit}
                onBack={() => {
                  setIsRestoreFlow(false);
                  setOnboardingStep("welcome");
                }}
                error={error}
              />
            )}
            {onboardingStep === "restore-password" && (
              <CreatePasswordPage
                key="restore-password"
                onSubmit={handleRestorePassword}
                onBack={() => setOnboardingStep("restore-seedphrase")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Returning user login
  if (!isAuthenticated) {
    return (
      <LoginPage error={error} setError={setError} onLogin={handleLogin} />
    );
  }

  // Show dApp approval page when there's a pending request
  if (pendingDAppRequest) {
    // Use TransactionApprovalPage for signing requests (shows simulation)
    if (
      pendingDAppRequest.method === "signTransaction" ||
      pendingDAppRequest.method === "signAndSendTransaction"
    ) {
      return (
        <TransactionApprovalPage
          request={pendingDAppRequest}
          onApprove={handleDAppApproval}
          onReject={handleDAppRejection}
          isProcessing={isApprovalProcessing}
        />
      );
    }

    // Use DAppApprovalPage for connection and other requests
    return (
      <DAppApprovalPage
        request={pendingDAppRequest}
        onApprove={handleDAppApproval}
        onReject={handleDAppRejection}
        isProcessing={isApprovalProcessing}
      />
    );
  }

  // Withdraw page (full screen)
  if (view === "withdraw") {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <WithdrawPage
            onBack={() => setView("dashboard")}
            onSend={handleSend}
            tokenBalances={tokenBalances}
          />
        </div>
      </div>
    );
  }

  // Transfer page (full screen)
  if (view === "transfer") {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <TransferPage
            onBack={() => setView("dashboard")}
            onTransfer={handleTransfer}
            tokenBalances={tokenBalances}
          />
        </div>
      </div>
    );
  }

  // Dashboard (logged in)
  return (
    <div className="h-full  bg-black flex items-center justify-center">
      <div className="w-full max-w-md h-[600px]  flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
        <ConnectedDAppBar />
        {activeTab === "private" && (
          <WalletHeader
            address={user?.publicKey}
            username={user?.username}
            onSettings={() => setActiveTab("preferences")}
          />
        )}

        {/* Private Tab Content */}
        {activeTab === "private" && (
          <>
            <BalanceDisplay
              tokenBalances={tokenBalances}
              // address={user?.publicKey?.toString() || ""}
              onSend={() => setView("withdraw")}
              onReceive={() => setIsReceiveModalOpen(true)}
              onSync={handleSyncNotes}
              isSyncing={isSyncing}
            />

            {!isInitialized && (
              <div className="px-4 py-2 border-b border-white/10">
                <div className="py-2 px-3 mb-2 border border-neon-green/30 bg-neon-green/10">
                  <p className="text-[10px] font-mono text-center">
                    Initializing connection to devnet...
                  </p>
                </div>
              </div>
            )}

            <ActionButtons
              onTransfer={() => setView("transfer")}
              onDeposit={() => setIsDepositModalOpen(true)}
              onWithdraw={() => setView("withdraw")}
            />

            <TransactionList
              transactions={transactions}
              onViewAll={() => setView("activity")}
              onSelectTransaction={(tx) => {
                setSelectedTransaction(tx);
                setLastView("dashboard");
                setView("details");
              }}
              tokenBalances={tokenBalances}
              isLoadingNotes={isLoadingNotes}
            />
          </>
        )}

        {/* DApp Tab Content */}
        {activeTab === "dapp" && (
          <DAppPage
            availableBalance={balance}
            password={password}
            onWithdrawToWallet={async (
              toAddress: string,
              amount: number,
              setTransactionPhase: any,
            ) => {
              // Withdraw from privacy pool to dapp wallet via relayer
              await handleSend(toAddress, amount, "SOL", setTransactionPhase);
            }}
          />
        )}

        {/* Swap Tab Content */}
        {activeTab === "swap" && (
          <SwapPage keypair={wallet?.payer || null} password={password} />
        )}

        {/* Preferences Tab Content */}
        {activeTab === "preferences" && (
          <PreferencesPage
            address={address}
            onLogout={logout}
            onResetWallet={handleResetWallet}
          />
        )}

        <AnimatePresence>
          {view === "activity" && (
            <ActivityPage
              onBack={() => setView("dashboard")}
              transactions={transactions}
              onSelectTransaction={(tx) => {
                setSelectedTransaction(tx);
                setLastView("activity");
                setView("details");
              }}
              solBalance={balance}
            />
          )}
          {view === "details" && selectedTransaction && (
            <TransactionDetailsPage
              onBack={() => setView(lastView)}
              transaction={selectedTransaction}
            />
          )}
        </AnimatePresence>

        {/* Note: SendModal and TransferModal replaced with WithdrawPage and TransferPage */}

        <ReceiveModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          address={address}
        />

        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          username={user?.username}
        />

        {/* Bottom Tab Navigation */}
        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
