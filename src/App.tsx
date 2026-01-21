/// <reference types="chrome"/>
import { useState, useCallback } from "react";

import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import { Buffer } from "buffer";

// Hooks
import { useNotes } from "./hooks/useNotes";
import { useTransactions } from "./hooks/useTransactions";
import { useDAppRequests } from "./hooks/useDAppRequests";
import { useOnboarding } from "./hooks/useOnboarding";

import { WalletHeader } from "./components/WalletHeader";

import { BalanceDisplay } from "./components/BalanceDisplay";
import { ActionButtons } from "./components/ActionButtons";
import { TransactionList } from "./components/TransactionList";
import { ActivityPage } from "./components/ActivityPage";
import { TransactionDetailsPage } from "./components/TransactionDetailsPage";
import { WithdrawPage } from "./components/WithdrawPage";
import { ReceiveModal } from "./components/ReceiveModal";
import { DepositModal } from "./components/DepositModal";
import { TransferPage } from "./components/TransferPage";
import { WelcomePage } from "./components/WelcomePage";
import { CreatePasswordPage } from "./components/CreatePasswordPage";
import { SecretPhrasePage } from "./components/SecretPhrasePage";
import { LoginPage } from "./components/LoginPage";
import { CreateUsernamePage } from "./components/CreateUsernamePage";
import { OnboardingWalkthrough } from "./components/OnboardingWalkthrough";
import { RestoreSeedphrasePage } from "./components/RestoreSeedphrasePage";
import { DAppApprovalPage } from "./components/DAppApprovalPage";
import { TransactionApprovalPage } from "./components/TransactionApprovalPage";
import { ConnectedDAppBar } from "./components/ConnectedDAppBar";
import { BottomTabs } from "./components/BottomTabs";
import { DAppPage } from "./components/DAppPage";
import { SwapPage } from "./components/SwapPage";
import { PreferencesPage } from "./components/PreferencesPage";
import { useAuthStore } from "./store/useAuthStore";
import {
  useRegisterUser,
  useRestoreAccount,
} from "./hooks/queries/useAuthQueries";
// import * as bip39 from "bip39";
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
  // Note: loadSession, clearSession, isSessionValid moved to useOnboarding hook
} from "./utils/storage";

import { NoteManager } from "./lib/noteManager";
import { syncNotesFromRelayer } from "./lib/noteSync";
// Note: Transaction handlers and helpers moved to hooks

// Devnet RPC endpoint
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
  txSignature?: string; // Optional blockchain transaction signature
  token: string; // Token symbol (SOL, USDC, USDT)
  mintAddress: string; // Token mint address
}

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

  // Local error state (shared with useOnboarding)
  const [localError, setLocalError] = useState("");

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

        const conn = new Connection(DEVNET_RPC_URL, "confirmed");
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
      // 1. Register with backend
      const response = await registerUser(username);

      // 2. Derive wallet from returned private key
      const privateKeyHex = response.privateKey;
      if (!privateKeyHex) throw new Error("No private key returned");

      const privateKeyBytes = Buffer.from(privateKeyHex, "hex");
      const keypair = Keypair.fromSecretKey(privateKeyBytes);

      // 3. Encrypt all sensitive data
      const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
      const encryptedSecretKey = await encrypt(secretKeyStr, password);

      const mnemonic = response.encryptedMnemonic || "";
      const encryptedMnemonic = await encrypt(mnemonic, password);

      const veiloPublicKey = response.veiloPublicKey || "";
      const encryptedVeiloPublicKey = await encrypt(veiloPublicKey, password);

      const veiloPrivateKeyHex = response.veiloPrivateKey || "";
      const encryptedVeiloPrivateKey = await encrypt(
        veiloPrivateKeyHex,
        password,
      );

      // 4. Store all encrypted data
      await saveWallet(
        {
          encryptedSecretKey,
          encryptedMnemonic,
          encryptedVeiloPublicKey,
          encryptedVeiloPrivateKey,
          publicKey: response.publicKey,
          username: response.username,
        },
        response.token,
      );

      // 5. Store password in state for session use
      setPassword(password);

      // 6. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(
        response.publicKey,
        privateKeyHex,
      );
      setNoteManager(accountNoteManager);

      // 7. Update UI
      setGeneratedPhrase(mnemonic.split(" "));
      setOnboardingStep("phrase");

      // Initialize session immediately
      const walletInstance = new Wallet(keypair);
      setWallet(walletInstance);
      setAddress(keypair.publicKey.toString());

      // Setup Provider
      const conn = new Connection(DEVNET_RPC_URL, "confirmed");
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

      setAuth({ username: response.username, publicKey: response.publicKey });

      // useNotes hook auto-loads notes when isAuthenticated changes
      // Just trigger a sync with relayer after a short delay
      setTimeout(async () => {
        try {
          await syncNotesFromRelayer(
            accountNoteManager,
            response.publicKey,
            privateKeyHex,
            veiloPrivateKeyHex,
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
    }
  };

  // Handle password creation for restore flow

  const handleRestorePassword = async (password: string) => {
    try {
      // 1. Restore account from backend using mnemonic
      const response = await restoreAccountApi(restoreMnemonic);

      // 2. Derive wallet from returned private key
      const privateKeyHex = response.privateKey;
      if (!privateKeyHex) throw new Error("No private key returned");

      const privateKeyBytes = Buffer.from(privateKeyHex, "hex");
      const keypair = Keypair.fromSecretKey(privateKeyBytes);

      // 3. Encrypt all sensitive data (same as create flow)
      const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
      const encryptedSecretKey = await encrypt(secretKeyStr, password);
      const encryptedMnemonic = await encrypt(restoreMnemonic, password);
      const encryptedVeiloPublicKey = await encrypt(
        response.veiloPublicKey || "",
        password,
      );
      const encryptedVeiloPrivateKey = await encrypt(
        response.veiloPrivateKey || "",
        password,
      );

      // 4. Store all encrypted data
      await saveWallet(
        {
          encryptedSecretKey,
          encryptedMnemonic,
          encryptedVeiloPublicKey,
          encryptedVeiloPrivateKey,
          publicKey: response.publicKey,
          username: response.username,
        },
        response.token,
      );

      // 5. Store password in state for session use
      setPassword(password);

      // 6. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(
        response.publicKey,
        privateKeyHex,
      );
      setNoteManager(accountNoteManager);

      // 7. Initialize session immediately
      const walletInstance = new Wallet(keypair);
      setWallet(walletInstance);
      setAddress(keypair.publicKey.toString());

      // Setup Provider
      const conn = new Connection(DEVNET_RPC_URL, "confirmed");
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

      // 8. Set auth and skip to done (no phrase display or walkthrough for restore)
      setAuth({ username: response.username, publicKey: response.publicKey });
      setOnboardingStep("done");

      // Get veilo keys for sync
      const veiloPublicKey = response.veiloPublicKey || "";
      const veiloPrivateKey = response.veiloPrivateKey || "";

      // 9. Sync notes after restore
      setTimeout(async () => {
        try {
          await syncNotesFromRelayer(
            accountNoteManager,
            response.publicKey,
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
      setError(e?.message || "Failed to restore account");
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
            onWithdrawToWallet={async (toAddress: string, amount: number) => {
              // Withdraw from privacy pool to dapp wallet via relayer
              await handleSend(toAddress, amount, "SOL");
            }}
          />
        )}

        {/* Swap Tab Content */}
        {activeTab === "swap" && <SwapPage keypair={wallet?.payer || null} />}

        {/* Preferences Tab Content */}
        {activeTab === "preferences" && (
          <PreferencesPage address={address} onLogout={logout} />
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
