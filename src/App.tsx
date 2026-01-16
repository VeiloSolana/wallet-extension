/// <reference types="chrome"/>
import { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction as SolanaTransaction, VersionedTransaction } from "@solana/web3.js";
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
import { TransferModal } from "./components/TransferModal";
import { SettingsModal } from "./components/SettingsModal";
import { WelcomePage } from "./components/WelcomePage";
import { CreatePasswordPage } from "./components/CreatePasswordPage";
import { SecretPhrasePage } from "./components/SecretPhrasePage";
import { LoginPage } from "./components/LoginPage";
import { CreateUsernamePage } from "./components/CreateUsernamePage";
import { OnboardingWalkthrough } from "./components/OnboardingWalkthrough";
import { RestoreSeedphrasePage } from "./components/RestoreSeedphrasePage";
import { DAppApprovalPage } from "./components/DAppApprovalPage";
import { ConnectedDAppBar } from "./components/ConnectedDAppBar";
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
  saveSession,
  loadSession,
  clearSession,
  isSessionValid,
} from "./utils/storage";
import { NoteManager } from "./lib/noteManager";
import { syncNotesFromRelayer } from "./lib/noteSync";
import { handleWithdraw } from "./lib/transactions/withdraw";
import { handleTransfer as handlePrivateTransfer } from "./lib/transactions/transfer";
import { TOKEN_MINTS, SOL_MINT } from "./lib/transactions/shared";


// Devnet RPC endpoint
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// Helper function to get token info from mint address
const getTokenInfo = (
  mintAddress: string
): { symbol: string; decimals: number } => {
  const mint = mintAddress.toLowerCase();

  if (
    mint === SOL_MINT.toString().toLowerCase() ||
    mint === PublicKey.default.toString().toLowerCase()
  ) {
    return { symbol: "SOL", decimals: 9 };
  }

  // Check against known mints
  for (const [symbol, address] of Object.entries(TOKEN_MINTS)) {
    if (address.toString().toLowerCase() === mint) {
      // SOL has 9 decimals, USDC/USDT/VEILO have 6 decimals
      const decimals = symbol === "SOL" ? 9 : 6;
      return { symbol, decimals };
    }
  }

  // Default fallback
  return { symbol: "UNKNOWN", decimals: 9 };
};

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

// Pending dApp request interface
interface PendingDAppRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  origin: string;
}

function App() {
  // Auth state
  const { isAuthenticated, setAuth, user, logout } = useAuthStore();
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
  // @ts-expect-error - Used by setIsRestoreFlow
  const [isRestoreFlow, setIsRestoreFlow] = useState(false);
  const [restoreMnemonic, setRestoreMnemonic] = useState("");

  // dApp approval state
  const [pendingDAppRequest, setPendingDAppRequest] = useState<PendingDAppRequest | null>(null);
  const [isApprovalProcessing, setIsApprovalProcessing] = useState(false);

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
          console.log("Session expired, logging out...");
          await clearSession();
          // Clear authentication state to force login
          logout();
        }
      } else {
        console.log("No wallet found, starting onboarding");
      }
      setIsInitialized(true);
    };
    checkWalletAndSession();
  }, []);

  // Check for pending dApp requests on mount and listen for storage changes
  // Only runs when in Chrome extension context (not in dev mode)
  useEffect(() => {
    // Skip if not in Chrome extension context
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.log('Not in Chrome extension context, skipping dApp request check');
      return;
    }

    const checkPendingRequest = () => {
      chrome.storage.local.get(['pendingRequest'], (result) => {
        if (result.pendingRequest) {
          console.log('📱 Found pending dApp request:', result.pendingRequest);
          setPendingDAppRequest(result.pendingRequest as PendingDAppRequest);
        } else {
          setPendingDAppRequest(null);
        }
      });
    };

    // Check immediately
    checkPendingRequest();

    // Listen for storage changes (in case popup opens after request is made)
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.pendingRequest) {
        if (changes.pendingRequest.newValue) {
          console.log('📱 Storage changed - new pending request:', changes.pendingRequest.newValue);
          setPendingDAppRequest(changes.pendingRequest.newValue as PendingDAppRequest);
        } else {
          setPendingDAppRequest(null);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const [balance, setBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState({
    sol: 0,
    usdc: 0,
    usdt: 0,
    veilo: 0,
  });
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
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [password, setPassword] = useState("");

  // SDK state
  // @ts-expect-error - Used by setConnection
  const [connection, setConnection] = useState<Connection | undefined>();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  // @ts-expect-error - Used by setProgram
  const [program, setProgram] = useState<Program<PrivacyPool> | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [noteManager, setNoteManager] = useState<NoteManager | null>(null);

  // Notes state
  // @ts-expect-error - Used by setStoredNotes
  const [storedNotes, setStoredNotes] = useState<StoredNote[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load notes immediately when authenticated and noteManager is ready
  useEffect(() => {
    if (isAuthenticated && noteManager) {
      console.log("🔄 Loading notes on authentication...");
      loadNotes();
    }
  }, [isAuthenticated, noteManager]);

  // Auto-refresh notes every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !noteManager || !wallet) return;

    const intervalId = setInterval(async () => {
      console.log("🔄 Auto-refreshing notes...");
      await handleSyncNotes();
    }, 15000); // 15 seconds

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
      const uiNotes = notes.map((n) => {
        const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
        return {
          commitment: n.commitment,
          amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals), // Convert Lamports to SOL
          root: "dummy",
          timestamp: n.timestamp,
        };
      });
      setStoredNotes(uiNotes);

      const balanceBigInt = await noteManager.getBalance();
      setBalance(Number(balanceBigInt) / 1e9); // Convert Lamports to SOL

      // Calculate balances per token
      const balances = {
        sol: 0,
        usdc: 0,
        usdt: 0,
        veilo: 0,
      };

      notes.forEach((n) => {
        if (!n.spent) {
          const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
          const amount = Number(n.amount) / Math.pow(10, tokenInfo.decimals);
          if (tokenInfo.symbol === "SOL") {
            balances.sol += amount;
          } else if (tokenInfo.symbol === "USDC") {
            balances.usdc += amount;
          } else if (tokenInfo.symbol === "USDT") {
            balances.usdt += amount;
          } else if (tokenInfo.symbol === "VEILO") {
            balances.veilo += amount;
          }
        }
      });

      setTokenBalances(balances);
      console.log("📊 Token balances calculated:", balances);

      // Persist balances to chrome.storage for dApp access
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ tokenBalances: balances });
      }

      // Map notes to transactions for history
      const noteTxs: Transaction[] = notes.map((n) => {
        const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
        return {
          id: n.id || n.commitment.slice(0, 8),
          txSignature: n.txSignature,
          type: n.spent ? "send" : "receive",
          amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
          timestamp: n.timestamp,
          status: "confirmed",
          address: "Shielded Pool",
          token: tokenInfo.symbol,
          mintAddress: n.mintAddress || SOL_MINT.toString(),
        };
      });

      // Merge with dummy for demo feeling and sort: unspent notes first, then by timestamp
      setTransactions((prev) =>
        [...prev.filter((t) => t.address !== "Shielded Pool"), ...noteTxs].sort(
          (a, b) => {
            // Show receive (unspent) before send (spent)
            if (a.type !== b.type) {
              return a.type === "receive" ? -1 : 1;
            }
            // Within same type, sort by timestamp (most recent first)
            return b.timestamp - a.timestamp;
          }
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

        console.log("Syncing notes from relayer...");
        const notes = await noteManager.getAllNotes();
        console.log(`Currently have ${notes.length} notes stored locally`);
        console.log(notes);
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

  const withdraw = async (recipient: string, amount: number, token: string) => {
    if (!noteManager || !wallet) {
      throw new Error("NoteManager or wallet not initialized");
    }

    try {
      // Get all notes from storage
      const allNotes = await noteManager.getAllNotes();

      // Get mint address for the selected token
      const mintAddress = TOKEN_MINTS[token];
      if (!mintAddress) {
        throw new Error(`Invalid token: ${token}`);
      }

      // Filter notes by selected token mint
      const notes = allNotes.filter((note) => {
        const noteMintStr = note.mintAddress?.toString() || "";
        const targetMintStr = mintAddress.toString();
        // Handle legacy SOL notes with empty mint address
        if (token === "SOL" && noteMintStr === "") {
          return true;
        }
        return noteMintStr === targetMintStr;
      });

      // Get veilo public key for the withdraw request
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("Wallet not found");
      }
      const veiloPublicKeyStr = await decrypt(
        storedWallet.encryptedVeiloPublicKey,
        password
      );

      // Get token info for decimals
      const tokenInfo = getTokenInfo(mintAddress.toString());
      console.log("🎯 Token info:", tokenInfo);

      // Call handleWithdraw with the veilo public key and mint address
      const result = await handleWithdraw(
        notes,
        recipient,
        amount,
        storedWallet.publicKey,
        mintAddress,
        tokenInfo.decimals
      );

      console.log("✅ Withdrawal complete:", result);

      // Sync notes from relayer to get the change note and updated spent status
      console.log("Syncing notes from relayer after withdrawal...");
      if (storedWallet) {
        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const privateKeyHex = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );

        await syncNotesFromRelayer(
          noteManager,
          wallet.payer.publicKey.toString(),
          privateKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
      }

      // Reload notes and update UI after sync
      await loadNotes();

      return result;
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    }
  };

  const handleSend = async (
    recipient: string,
    amount: number,
    token: string
  ) => {
    try {
      console.log(
        `Starting send operation: ${amount} ${token} to ${recipient}`
      );

      await withdraw(recipient, amount, token);
      // await withdraw(recipient, amount, root, token);

      console.log(`✅ Successfully sent ${amount} ${token} to ${recipient}`);
    } catch (error) {
      console.error("❌ Send failed:", error);
      throw error;
    }
  };

  const handleTransfer = async (
    username: string,
    amount: number,
    token: string
  ) => {
    if (!noteManager || !wallet) {
      throw new Error("NoteManager or wallet not initialized");
    }

    try {
      console.log(
        `Starting private transfer: ${amount} ${token} to @${username}`
      );

      // Get all notes from storage
      const allNotes = await noteManager.getAllNotes();
      console.log("📝 All notes:", allNotes.length, "notes found");
      console.log(
        "📝 Notes detail:",
        allNotes.map((n) => ({
          id: n.id?.slice(0, 8),
          mintAddress: n.mintAddress,
          spent: n.spent,
          amount: n.amount,
        }))
      );

      // Get mint address for the selected token
      const mintAddress = TOKEN_MINTS[token];
      if (!mintAddress) {
        throw new Error(`Invalid token: ${token}`);
      }
      console.log("🎯 Looking for notes with mintAddress:", mintAddress);

      // Filter notes by selected token mint
      const notes = allNotes.filter((note) => {
        const noteMintStr = note.mintAddress?.toString() || "";
        const targetMintStr = mintAddress.toString();
        // Handle legacy SOL notes with empty mint address
        if (token === "SOL" && noteMintStr === "") {
          return true;
        }
        return noteMintStr === targetMintStr;
      });
      console.log(
        "🎯 Filtered notes:",
        notes.length,
        "notes match mintAddress"
      );
      console.log(
        "🎯 Unspent filtered notes:",
        notes.filter((n) => !n.spent).length
      );

      // Get veilo public key for the transfer request
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("Wallet not found");
      }

      // Get token info for decimals
      const tokenInfo = getTokenInfo(mintAddress.toString());
      console.log("🎯 Token info:", tokenInfo);

      // Call handlePrivateTransfer with the required parameters
      const result = await handlePrivateTransfer(
        notes,
        username,
        amount,
        storedWallet.publicKey,
        mintAddress,
        tokenInfo.decimals
      );

      console.log("✅ Private transfer complete:", result);

      // Sync notes from relayer to get the change note and updated spent status
      console.log("Syncing notes from relayer after transfer...");
      if (storedWallet) {
        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const privateKeyHex = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );
        const veiloPublicKeyStr = await decrypt(
          storedWallet.encryptedVeiloPublicKey,
          password
        );

        await syncNotesFromRelayer(
          noteManager,
          wallet.payer.publicKey.toString(),
          privateKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
      }

      // Reload notes and update UI after sync
      await loadNotes();

      return result;
    } catch (error) {
      console.error("❌ Transfer failed:", error);
      throw error;
    }
  };

  // Handle dApp connection approval
  const handleDAppApproval = async () => {
    if (!pendingDAppRequest) return;

    setIsApprovalProcessing(true);
    try {
      // Get stored wallet info
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("No wallet found");
      }

      if (pendingDAppRequest.method === "connect") {
        // Get public key as array of bytes
        const publicKeyBytes = Array.from(
          new PublicKey(storedWallet.publicKey).toBytes()
        );

        // Add this site to connected sites
        const result = await chrome.storage.local.get(['connectedSites']);
        const connectedSites: string[] = (result.connectedSites as string[] | undefined) || [];
        if (!connectedSites.includes(pendingDAppRequest.origin)) {
          connectedSites.push(pendingDAppRequest.origin);
        }

        // Store the wallet public key and connected sites
        await chrome.storage.local.set({
          connectedSites,
          walletPublicKey: publicKeyBytes,
        });

        // Send approval response to background script
        await chrome.runtime.sendMessage({
          type: 'POPUP_RESPONSE',
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { publicKey: publicKeyBytes },
        });
      } else if (pendingDAppRequest.method === "signTransaction") {
        // Sign transaction
        if (!wallet) {
          throw new Error("Wallet not unlocked");
        }
        const keypair = wallet.payer;

        const txData = pendingDAppRequest.params.transaction as number[];
        const txBuffer = new Uint8Array(txData);
        
        let signedTxBytes: number[];
        
        try {
          // Try to deserialize as Versioned Transaction first
          const tx = VersionedTransaction.deserialize(txBuffer);
          tx.sign([keypair]);
          signedTxBytes = Array.from(tx.serialize());
        } catch (e) {
             console.log("Versioned transaction deserialization failed, trying legacy:", e);
             // Fallback to legacy
             const tx = SolanaTransaction.from(txBuffer);
             tx.sign(keypair);
             signedTxBytes = Array.from(tx.serialize() as Uint8Array);
        }

        await chrome.runtime.sendMessage({
          type: 'POPUP_RESPONSE',
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { signedTransaction: signedTxBytes },
        });

      } else if (pendingDAppRequest.method === "sendShieldedTransaction") {
        if (!noteManager || !wallet) {
          throw new Error("Wallet not unlocked");
        }
        
        const { username, amount, mintAddress } = pendingDAppRequest.params as { 
             username: string;
             amount: string;
             mintAddress?: string;
        };
        
        const mint = mintAddress || "So11111111111111111111111111111111111111112";
        const tokenInfo = getTokenInfo(mint);
        
        const notes = await noteManager.getAllNotes();
        
        const result = await handlePrivateTransfer(
             notes,
             username,
             parseFloat(amount),
             wallet.publicKey.toString(), 
             new PublicKey(mint),
             tokenInfo.decimals
        );
        
        if (!result.success) throw new Error("Transfer failed");
        
        await chrome.runtime.sendMessage({
          type: 'POPUP_RESPONSE',
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { signature: result.txSignature },
        });

      } else if (pendingDAppRequest.method === "signAndSendTransaction") {
        // For signAndSend, we just sign and return signature for now (simpler flow) 
        // Or strictly follow standard: sign, send, return signature.
        throw new Error("signAndSendTransaction not fully implemented yet");
      } else if (pendingDAppRequest.method === "signMessage") {
         // Handle signMessage
        throw new Error("signMessage not implemented yet");
      }

      // Clear pending request
      await chrome.storage.local.remove('pendingRequest');
      setPendingDAppRequest(null);

      console.log('✅ dApp request approved');
    } catch (error) {
      console.error('Failed to approve dApp request:', error);
      // Still send error response
      await chrome.runtime.sendMessage({
        type: 'POPUP_RESPONSE',
        requestId: pendingDAppRequest.id,
        approved: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await chrome.storage.local.remove('pendingRequest');
      setPendingDAppRequest(null);
    } finally {
      setIsApprovalProcessing(false);
    }
  };

  // Handle dApp connection rejection
  const handleDAppRejection = async () => {
    if (!pendingDAppRequest) return;

    try {
      // Send rejection response to background script
      await chrome.runtime.sendMessage({
        type: 'POPUP_RESPONSE',
        requestId: pendingDAppRequest.id,
        approved: false,
        error: 'User rejected the request',
      });

      // Clear pending request
      await chrome.storage.local.remove('pendingRequest');
      setPendingDAppRequest(null);

      console.log('❌ dApp connection rejected');
    } catch (error) {
      console.error('Failed to reject dApp request:', error);
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
          const uiNotes = existingNotes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              commitment: n.commitment,
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              root: "dummy",
              timestamp: n.timestamp,
            };
          });
          setStoredNotes(uiNotes);

          const existingTxs: Transaction[] = existingNotes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              id: n.id || n.commitment.slice(0, 8),
              txSignature: n.txSignature,
              type: n.spent ? "send" : "receive",
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              timestamp: n.timestamp,
              status: "confirmed",
              address: "Shielded Pool",
              token: tokenInfo.symbol,
              mintAddress: n.mintAddress || SOL_MINT.toString(),
            };
          });
          setTransactions(
            existingTxs.sort((a, b) => {
              // Show receive (unspent) before send (spent)
              if (a.type !== b.type) {
                return a.type === "receive" ? -1 : 1;
              }
              // Within same type, sort by timestamp (most recent first)
              return b.timestamp - a.timestamp;
            })
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
          const updatedUiNotes = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              commitment: n.commitment,
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              root: "dummy",
              timestamp: n.timestamp,
            };
          });
          setStoredNotes(updatedUiNotes);

          const noteTxs: Transaction[] = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              id: n.id || n.commitment.slice(0, 8),
              txSignature: n.txSignature,
              type: n.spent ? "send" : "receive",
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              timestamp: n.timestamp,
              status: "confirmed",
              address: "Shielded Pool",
              token: tokenInfo.symbol,
              mintAddress: n.mintAddress || SOL_MINT.toString(),
            };
          });
          setTransactions(
            noteTxs.sort((a, b) => {
              // Show receive (unspent) before send (spent)
              if (a.type !== b.type) {
                return a.type === "receive" ? -1 : 1;
              }
              // Within same type, sort by timestamp (most recent first)
              return b.timestamp - a.timestamp;
            })
          );
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
            veiloPublicKey
          );
          // Reload notes to update balance and transaction history
          const notes = await accountNoteManager.getAllNotes();
          const balanceBigInt = await accountNoteManager.getBalance();
          setBalance(Number(balanceBigInt) / 1e9);

          // Update transaction history
          const uiNotes = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              commitment: n.commitment,
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              root: "dummy",
              timestamp: n.timestamp,
            };
          });
          setStoredNotes(uiNotes);

          const noteTxs: Transaction[] = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              id: n.id || n.commitment.slice(0, 8),
              txSignature: n.txSignature,
              type: n.spent ? "send" : "receive",
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              timestamp: n.timestamp,
              status: "confirmed",
              address: "Shielded Pool",
              token: tokenInfo.symbol,
              mintAddress: n.mintAddress || SOL_MINT.toString(),
            };
          });
          setTransactions(
            noteTxs.sort((a, b) => {
              // Show receive (unspent) before send (spent)
              if (a.type !== b.type) {
                return a.type === "receive" ? -1 : 1;
              }
              // Within same type, sort by timestamp (most recent first)
              return b.timestamp - a.timestamp;
            })
          );
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
          const uiNotes = existingNotes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              commitment: n.commitment,
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              root: "dummy",
              timestamp: n.timestamp,
            };
          });
          setStoredNotes(uiNotes);

          const existingTxs: Transaction[] = existingNotes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              id: n.id || n.commitment.slice(0, 8),
              txSignature: n.txSignature,
              type: n.spent ? "send" : "receive",
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              timestamp: n.timestamp,
              status: "confirmed",
              address: "Shielded Pool",
              token: tokenInfo.symbol,
              mintAddress: n.mintAddress || SOL_MINT.toString(),
            };
          });
          setTransactions(
            existingTxs.sort((a, b) => {
              // Show receive (unspent) before send (spent)
              if (a.type !== b.type) {
                return a.type === "receive" ? -1 : 1;
              }
              // Within same type, sort by timestamp (most recent first)
              return b.timestamp - a.timestamp;
            })
          );

          // Then sync with relayer for new notes
          const privKeyHex = Buffer.from(secretKey).toString("hex");
          console.log("🔄 Starting sync with relayer...");
          console.log("📋 Sync params:", {
            publicKey: keypair.publicKey.toString(),
            hasPrivateKey: !!privKeyHex,
            hasVeiloPrivateKey: !!veiloPrivateKey,
            hasVeiloPublicKey: !!veiloPublicKey,
          });
          
          try {
            const syncedCount = await syncNotesFromRelayer(
              accountNoteManager,
              keypair.publicKey.toString(),
              privKeyHex,
              veiloPrivateKey,
              veiloPublicKey
            );
            console.log(`✅ Sync completed. ${syncedCount} new notes synced.`);
          } catch (syncError) {
            console.error("❌ Sync from relayer failed:", syncError);
            // Don't throw - we still want to show whatever notes we have
          }

          // Reload notes after sync to update balance and transaction history
          console.log("📊 Reloading notes after sync...");
          const notes = await accountNoteManager.getAllNotes();
          console.log(`📊 Total notes after sync: ${notes.length}`);
          const balanceBigInt = await accountNoteManager.getBalance();
          console.log(`💰 Balance after sync: ${Number(balanceBigInt) / 1e9} SOL`);
          setBalance(Number(balanceBigInt) / 1e9);

          // Update transaction history
          const updatedUiNotes = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              commitment: n.commitment,
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              root: "dummy",
              timestamp: n.timestamp,
            };
          });
          setStoredNotes(updatedUiNotes);

          const noteTxs: Transaction[] = notes.map((n) => {
            const tokenInfo = getTokenInfo(
              n.mintAddress || SOL_MINT.toString()
            );
            return {
              id: n.id || n.commitment.slice(0, 8),
              txSignature: n.txSignature,
              type: n.spent ? "send" : "receive",
              amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
              timestamp: n.timestamp,
              status: "confirmed",
              address: "Shielded Pool",
              token: tokenInfo.symbol,
              mintAddress: n.mintAddress || SOL_MINT.toString(),
            };
          });
          setTransactions(
            noteTxs.sort((a, b) => {
              // Show receive (unspent) before send (spent)
              if (a.type !== b.type) {
                return a.type === "receive" ? -1 : 1;
              }
              // Within same type, sort by timestamp (most recent first)
              return b.timestamp - a.timestamp;
            })
          );
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

  // Show dApp approval page when there's a pending request
  if (pendingDAppRequest) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <DAppApprovalPage
            request={pendingDAppRequest}
            onApprove={handleDAppApproval}
            onReject={handleDAppRejection}
            isProcessing={isApprovalProcessing}
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
        <WalletHeader
          address={user?.publicKey}
          username={user?.username}
          onSettings={() => setIsSettingsModalOpen(true)}
        />
        <BalanceDisplay
          tokenBalances={tokenBalances}
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
          onWithdraw={() => setIsSendModalOpen(true)}
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
          tokenBalances={tokenBalances}
        />

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

        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onTransfer={handleTransfer}
          tokenBalances={tokenBalances}
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
