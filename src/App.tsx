/// <reference types="chrome"/>
import { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";
import { WalletHeader } from "./components/WalletHeader";
import { BalanceDisplay } from "./components/BalanceDisplay";
import { ActionButtons } from "./components/ActionButtons";
import { TransactionList } from "./components/TransactionList";
import { ActivityPage } from "./components/ActivityPage";
import { TransactionDetailsPage } from "./components/TransactionDetailsPage";
import { SendModal } from "./components/SendModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { DepositModal } from "./components/DepositModal";
import { WithdrawModal } from "./components/WithdrawModal";
import { TransferModal } from "./components/TransferModal";
import { SettingsModal } from "./components/SettingsModal";
import { WelcomePage } from "./components/WelcomePage";
import { CreatePasswordPage } from "./components/CreatePasswordPage";
import { SecretPhrasePage } from "./components/SecretPhrasePage";
import { LoginPage } from "./components/LoginPage";
import { CreateUsernamePage } from "./components/CreateUsernamePage";
import { OnboardingWalkthrough } from "./components/OnboardingWalkthrough";
import { RestoreSeedphrasePage } from "./components/RestoreSeedphrasePage";
import { useAuthStore } from "./store/useAuthStore";
import {
  useRegisterUser,
  useRestoreAccount,
} from "./hooks/queries/useAuthQueries";
// import * as bip39 from "bip39";
import { Wallet } from "./utils/wallet";
import privacyPoolIdl from "../program/idl/privacy_pool.json";
import { type PrivacyPool } from "../program/types/privacy_pool";
import "./App.css";
import { AnimatePresence } from "framer-motion";

import { encrypt, decrypt } from "./utils/encryption";
import {
  saveWallet,
  loadWallet,
  saveSession,
  loadSession,
  clearSession,
  isSessionValid,
} from "./utils/storage";
import { NoteManager } from "./lib/noteManager";
import { syncNotesFromRelayer } from "./lib/noteSync";
import { handleWithdraw } from "./lib/transactions/withdraw";

// Devnet RPC endpoint
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
}

// Simple interface for a stored note
interface StoredNote {
  commitment: string; // hex string
  amount: number;
  root: string; // hex string (dummy for now)
  timestamp: number;
}

function App() {
  // Auth state
  const { isAuthenticated, setAuth, user } = useAuthStore();
  const { mutateAsync: registerUser, isPending: isRegistering } =
    useRegisterUser();
  const { mutateAsync: restoreAccountApi, isPending: isRestoring } =
    useRestoreAccount();

  const [onboardingStep, setOnboardingStep] = useState<
    | "welcome"
    | "username"
    | "password"
    | "phrase"
    | "walkthrough"
    | "done"
    | "restore-seedphrase"
    | "restore-password"
  >("welcome");
  const [username, setUsername] = useState("");
  const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
  const [hasWallet, setHasWallet] = useState(false);
  const [error, setError] = useState("");

  // Restore flow state
  const [isRestoreFlow, setIsRestoreFlow] = useState(false);
  const [restoreMnemonic, setRestoreMnemonic] = useState("");

  // Check for existing wallet and session on mount
  useEffect(() => {
    const checkWalletAndSession = async () => {
      const encryptedWallet = await loadWallet();
      if (encryptedWallet) {
        console.log("Encrypted wallet found, checking session...");
        setHasWallet(true);

        // Check if there's a valid session (within 1 minute)
        const session = await loadSession();
        if (session && isSessionValid(session)) {
          console.log("Valid session found, auto-logging in...");
          // Auto-login with stored password
          try {
            await handleLogin(session.encryptedPassword);
          } catch (e) {
            console.error("Auto-login failed, clearing session", e);
            await clearSession();
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
  }, []);

  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");

  // Navigation State
  const [view, setView] = useState<"dashboard" | "activity" | "details">(
    "dashboard"
  );
  const [lastView, setLastView] = useState<"dashboard" | "activity">(
    "dashboard"
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [password, setPassword] = useState("");

  // SDK state
  const [connection, setConnection] = useState<Connection | undefined>();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [program, setProgram] = useState<Program<PrivacyPool> | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [noteManager, setNoteManager] = useState<NoteManager | null>(null);

  // Notes state
  const [storedNotes, setStoredNotes] = useState<StoredNote[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auto-refresh notes every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !noteManager || !wallet) return;

    const intervalId = setInterval(async () => {
      console.log("🔄 Auto-refreshing notes...");
      await handleSyncNotes();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, noteManager, wallet]);

  // Load stored notes from NoteManager
  const loadNotes = async () => {
    if (!noteManager) {
      console.log("NoteManager not initialized");
      return;
    }

    try {
      const notes = await noteManager.getAllNotes();
      const uiNotes = notes.map((n) => ({
        commitment: n.commitment,
        amount: Number(n.amount) / 1e9, // Convert Lamports to SOL
        root: "dummy",
        timestamp: n.timestamp,
      }));
      setStoredNotes(uiNotes);

      const balanceBigInt = await noteManager.getBalance();
      setBalance(Number(balanceBigInt) / 1e9); // Convert Lamports to SOL

      // Map notes to transactions for history
      const noteTxs: Transaction[] = notes.map((n) => ({
        id: n.id || n.commitment.slice(0, 8),
        type: "receive", // Default to receive for shielded notes
        amount: Number(n.amount) / 1e9, // Convert Lamports to SOL
        timestamp: n.timestamp,
        status: "confirmed",
        address: "Shielded Pool",
      }));

      // Merge with dummy for demo feeling and sort by timestamp (most recent first)
      setTransactions((prev) =>
        [...prev.filter((t) => t.address !== "Shielded Pool"), ...noteTxs].sort(
          (a, b) => b.timestamp - a.timestamp
        )
      );
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  };

  const handleSyncNotes = async () => {
    if (isSyncing) return;

    if (!noteManager) {
      console.error("NoteManager not initialized");
      return;
    }

    setIsSyncing(true);
    try {
      if (wallet && "payer" in wallet) {
        const storedWallet = await loadWallet();
        if (!storedWallet) {
          console.error("No wallet found");
          return;
        }

        // Decrypt the wallet private key
        const secretKeyStr = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );

        const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
        const keypair = Keypair.fromSecretKey(secretKey);

        // Initialize Session
        const walletInstance = new Wallet(keypair);

        console.log(walletInstance.payer.publicKey.toString());
        console.log(
          "Derived privacy private key:",
          Buffer.from(walletInstance.payer.secretKey).toString("hex")
        );
        const privKeyHex = Buffer.from(walletInstance.payer.secretKey).toString(
          "hex"
        );

        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const veiloPublicKeyStr = await decrypt(
          storedWallet.encryptedVeiloPublicKey,
          password
        );

        const count = await syncNotesFromRelayer(
          noteManager,
          walletInstance.payer.publicKey.toString(),
          privKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
        console.log(`Synced ${count} new notes`);
        await loadNotes();
      } else {
        console.log("Cannot sync: Wallet not unlocked or key unavailable");
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deposit = async (amount: number) => {
    console.log(`Starting deposit of ${amount} SOL to shielded pool`);
  };

  const withdraw = async (recipient: string, amount: number) => {
    if (!noteManager) {
      throw new Error("NoteManager not initialized");
    }

    try {
      // Get all notes from storage
      const notes = await noteManager.getAllNotes();

      // Call handleWithdraw with the notes and a callback to save change note
      const result = await handleWithdraw(
        notes,
        recipient,
        amount,
        async (changeNote) => {
          // Save the change note to storage
          await noteManager.saveNote(changeNote);
        }
      );

      console.log("✅ Withdrawal complete:", result);

      // Mark the spent notes as spent using the IDs from the result
      if (result.spentNoteIds && result.spentNoteIds.length > 0) {
        const txSig = result.txSignature || "withdrawal-completed";
        for (const noteId of result.spentNoteIds) {
          await noteManager.markAsSpent(noteId, txSig);
        }
        console.log(`Marked ${result.spentNoteIds.length} notes as spent`);
      }

      // Reload notes and update UI after withdrawal
      await loadNotes();

      return result;
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    }
  };

  const handleSend = async (recipient: string, amount: number) => {
    try {
      console.log(`Starting send operation: ${amount} SOL to ${recipient}`);

      await withdraw(recipient, amount);
      // await withdraw(recipient, amount, root);

      console.log(`✅ Successfully sent ${amount} SOL to ${recipient}`);
    } catch (error) {
      console.error("❌ Send failed:", error);
      throw error;
    }
  };

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setOnboardingStep("password");
  };

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
        password
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
        response.token
      );

      // 5. Store password in state for session use
      setPassword(password);

      // 6. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(
        response.publicKey,
        privateKeyHex
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
        provider
      ) as Program<any>;
      setProgram(programInstance);

      setAuth({ username: response.username, publicKey: response.publicKey });

      // Load notes from storage immediately, then sync with relayer
      setIsLoadingNotes(true);
      setTimeout(async () => {
        try {
          // First, load existing notes from storage
          const existingNotes = await accountNoteManager.getAllNotes();
          const existingBalance = await accountNoteManager.getBalance();
          setBalance(Number(existingBalance) / 1e9);

          // Update UI with existing notes
          const uiNotes = existingNotes.map((n) => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9,
            root: "dummy",
            timestamp: n.timestamp,
          }));
          setStoredNotes(uiNotes);

          const existingTxs: Transaction[] = existingNotes.map((n) => ({
            id: n.id || n.commitment.slice(0, 8),
            type: "receive",
            amount: Number(n.amount) / 1e9,
            timestamp: n.timestamp,
            status: "confirmed",
            address: "Shielded Pool",
          }));
          setTransactions(
            existingTxs.sort((a, b) => b.timestamp - a.timestamp)
          );

          // Then sync with relayer for new notes
          await syncNotesFromRelayer(
            accountNoteManager,
            response.publicKey,
            privateKeyHex,
            veiloPrivateKeyHex,
            veiloPublicKey
          );

          // Reload notes after sync to update balance and transaction history
          const notes = await accountNoteManager.getAllNotes();
          const balanceBigInt = await accountNoteManager.getBalance();
          setBalance(Number(balanceBigInt) / 1e9);

          // Update transaction history
          const updatedUiNotes = notes.map((n) => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9,
            root: "dummy",
            timestamp: n.timestamp,
          }));
          setStoredNotes(updatedUiNotes);

          const noteTxs: Transaction[] = notes.map((n) => ({
            id: n.id || n.commitment.slice(0, 8),
            type: "receive",
            amount: Number(n.amount) / 1e9,
            timestamp: n.timestamp,
            status: "confirmed",
            address: "Shielded Pool",
          }));
          setTransactions(noteTxs.sort((a, b) => b.timestamp - a.timestamp));
        } catch (e) {
          console.error("Initial sync failed:", e);
        } finally {
          setIsLoadingNotes(false);
        }
      }, 500);
    } catch (e) {
      console.error("Registration failed", e);
    }
  };

  // Handle continuing after viewing phrase
  const handlePhraseConfirm = () => {
    setOnboardingStep("walkthrough");
  };

  // Handle walkthrough completion
  const handleWalkthroughComplete = () => {
    setOnboardingStep("done");
  };

  // --- Restore Flow Handlers ---

  // Navigate to restore seedphrase step
  const handleStartRestore = () => {
    setIsRestoreFlow(true);
    setOnboardingStep("restore-seedphrase");
  };

  // Handle seedphrase submission for restore
  const handleSeedphraseSubmit = (seedphrase: string) => {
    setRestoreMnemonic(seedphrase);
    setOnboardingStep("restore-password");
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
        password
      );
      const encryptedVeiloPrivateKey = await encrypt(
        response.veiloPrivateKey || "",
        password
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
        response.token
      );

      // 5. Store password in state for session use
      setPassword(password);

      // 6. Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(
        response.publicKey,
        privateKeyHex
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
        provider
      ) as Program<any>;
      setProgram(programInstance);

      // 8. Set auth and skip to done (no phrase display or walkthrough for restore)
      setAuth({ username: response.username, publicKey: response.publicKey });
      setOnboardingStep("done");

      // 9. Sync notes after restore
      setTimeout(async () => {
        try {
          await syncNotesFromRelayer(
            accountNoteManager,
            response.publicKey,
            privateKeyHex
          );
          // Reload notes to update balance and transaction history
          const notes = await accountNoteManager.getAllNotes();
          const balanceBigInt = await accountNoteManager.getBalance();
          setBalance(Number(balanceBigInt) / 1e9);

          // Update transaction history
          const uiNotes = notes.map((n) => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9,
            root: "dummy",
            timestamp: n.timestamp,
          }));
          setStoredNotes(uiNotes);

          const noteTxs: Transaction[] = notes.map((n) => ({
            id: n.id || n.commitment.slice(0, 8),
            type: "receive",
            amount: Number(n.amount) / 1e9,
            timestamp: n.timestamp,
            status: "confirmed",
            address: "Shielded Pool",
          }));
          setTransactions(noteTxs);
        } catch (e) {
          console.error("Initial sync after restore failed:", e);
        }
      }, 500);
    } catch (e: any) {
      console.error("Restore failed", e);
      setError(e?.message || "Failed to restore account");
    }
  };

  // Handle login for returning users
  const handleLogin = async (password: string) => {
    try {
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        console.error("No wallet found");
        return;
      }

      // Decrypt all sensitive data
      const secretKeyStr = await decrypt(
        storedWallet.encryptedSecretKey,
        password
      );
      const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
      const keypair = Keypair.fromSecretKey(secretKey);

      const mnemonic = await decrypt(storedWallet.encryptedMnemonic, password);
      const veiloPublicKey = await decrypt(
        storedWallet.encryptedVeiloPublicKey,
        password
      );
      const veiloPrivateKey = await decrypt(
        storedWallet.encryptedVeiloPrivateKey,
        password
      );

      // Store decrypted keys for use in the session
      setPassword(password); // Keep password in memory for later use

      // Initialize NoteManager with account context
      const accountNoteManager = new NoteManager(
        storedWallet.publicKey,
        Buffer.from(secretKey).toString("hex")
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
        provider
      ) as Program<any>;
      setProgram(programInstance);

      setAuth({
        username: storedWallet.username || "User",
        publicKey: keypair.publicKey.toString(),
      });
      setPassword(password);

      // Save session for auto-login within timeout window
      await saveSession({
        encryptedPassword: password, // Store password for session (in memory only, cleared on timeout)
        timestamp: Date.now(),
        publicKey: keypair.publicKey.toString(),
        username: storedWallet.username || "User",
      });

      // Load notes from storage immediately, then sync with relayer
      setIsLoadingNotes(true);
      setTimeout(async () => {
        try {
          // First, load existing notes from storage
          const existingNotes = await accountNoteManager.getAllNotes();
          const existingBalance = await accountNoteManager.getBalance();
          setBalance(Number(existingBalance) / 1e9);

          // Update UI with existing notes
          const uiNotes = existingNotes.map((n) => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9,
            root: "dummy",
            timestamp: n.timestamp,
          }));
          setStoredNotes(uiNotes);

          const existingTxs: Transaction[] = existingNotes.map((n) => ({
            id: n.id || n.commitment.slice(0, 8),
            type: "receive",
            amount: Number(n.amount) / 1e9,
            timestamp: n.timestamp,
            status: "confirmed",
            address: "Shielded Pool",
          }));
          setTransactions(
            existingTxs.sort((a, b) => b.timestamp - a.timestamp)
          );

          // Then sync with relayer for new notes
          const privKeyHex = Buffer.from(secretKey).toString("hex");
          await syncNotesFromRelayer(
            accountNoteManager,
            keypair.publicKey.toString(),
            privKeyHex,
            veiloPrivateKey,
            veiloPublicKey
          );

          // Reload notes after sync to update balance and transaction history
          const notes = await accountNoteManager.getAllNotes();
          const balanceBigInt = await accountNoteManager.getBalance();
          setBalance(Number(balanceBigInt) / 1e9);

          // Update transaction history
          const updatedUiNotes = notes.map((n) => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9,
            root: "dummy",
            timestamp: n.timestamp,
          }));
          setStoredNotes(updatedUiNotes);

          const noteTxs: Transaction[] = notes.map((n) => ({
            id: n.id || n.commitment.slice(0, 8),
            type: "receive",
            amount: Number(n.amount) / 1e9,
            timestamp: n.timestamp,
            status: "confirmed",
            address: "Shielded Pool",
          }));
          setTransactions(noteTxs.sort((a, b) => b.timestamp - a.timestamp));
        } catch (e) {
          console.error("Initial sync failed:", e);
        } finally {
          setIsLoadingNotes(false);
        }
      }, 500);
    } catch (e) {
      console.error("Login failed:", e);
      setError("Incorrect Password");
      //  alert("Incorrect password"); // Simple feedback
    }
  };

  // Loading state
  if (isRegistering || isRestoring) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px]  flex flex-col items-center justify-center bg-black/90 border border-white/10">
          <div className="w-12 h-12 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          <p className="mt-4 text-zinc-500 font-mono text-sm">
            {isRestoring ? "Restoring account..." : "Creating account..."}
          </p>
        </div>
      </div>
    );
  }

  // Determine if we should show onboarding
  // Show if:
  // 1. No encrypted wallet found (New User) AND not authenticated
  // 2. OR we are in the middle of onboarding (step != welcome/done)
  const showOnboarding =
    (!hasWallet && !isAuthenticated) ||
    (onboardingStep !== "welcome" && onboardingStep !== "done");

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
      <div className="h-full bg-black flex items-center justify-center">
        <div className="w-full  max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <LoginPage error={error} setError={setError} onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Dashboard (logged in)
  return (
    <div className="h-full  bg-black flex items-center justify-center">
      <div className="w-full max-w-md h-[600px]  flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
        <WalletHeader
          address={user?.publicKey}
          username={user?.username}
          onSettings={() => setIsSettingsModalOpen(true)}
        />
        <BalanceDisplay
          balance={balance}
          // address={user?.publicKey?.toString() || ""}
          onSend={() => setIsSendModalOpen(true)}
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
          onTransfer={() => setIsTransferModalOpen(true)}
          onDeposit={() => setIsDepositModalOpen(true)}
          onWithdraw={() => setIsWithdrawModalOpen(true)}
        />

        <TransactionList
          transactions={transactions}
          onViewAll={() => setView("activity")}
          onSelectTransaction={(tx) => {
            setSelectedTransaction(tx);
            setLastView("dashboard");
            setView("details");
          }}
          solBalance={balance}
          isLoadingNotes={isLoadingNotes}
        />

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

        <SendModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          onSend={handleSend}
        />

        <ReceiveModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          address={address}
        />

        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onDeposit={deposit}
        />

        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          onWithdraw={withdraw}
          privateBalance={balance}
        />

        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          address={address}
        />
      </div>
    </div>
  );
}

export default App;
