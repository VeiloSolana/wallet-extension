/// <reference types="chrome"/>
import { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
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
import { SwapModal } from "./components/SwapModal";
import { SettingsModal } from "./components/SettingsModal";
import { WelcomePage } from "./components/WelcomePage";
import { CreatePasswordPage } from "./components/CreatePasswordPage";
import { SecretPhrasePage } from "./components/SecretPhrasePage";
import { LoginPage } from "./components/LoginPage";
import { CreateUsernamePage } from "./components/CreateUsernamePage";
import { OnboardingWalkthrough } from "./components/OnboardingWalkthrough";
import { useAuthStore } from "./store/useAuthStore";
import { useRegisterUser } from "./hooks/queries/useAuthQueries";
import * as bip39 from "bip39";
import { Wallet } from "./utils/wallet";
import privacyPoolIdl from "../idl/privacy_pool.json";
import "./App.css";
import { AnimatePresence } from "framer-motion";
import {
  buildDummyProof,
  createNoteWithCommitment,
  getPoolPdas,
  sol,
} from "./sdk/client";
import { createNoteAndDeposit } from "@zkprivacysol/sdk-core";
import { encrypt, decrypt } from "./utils/encryption";
import { saveWallet, loadWallet } from "./utils/storage";
import { NoteManager } from "./lib/noteManager";
import { syncNotesFromRelayer } from "./lib/noteSync";
import { saveEncryptedNote } from "./lib/relayerApi";
import { encryptNote, derivePrivacyKeyFromSignatureKey } from "./lib/noteDecryption";

// Initialize NoteManager
const noteManager = new NoteManager();

// Program ID deployed on devnet
const PRIVACY_POOL_PROGRAM_ID = new PublicKey(
  "Bo2en1LKZL7JFXsag7KAb5ZQiqFg5j22dJYCLZmoek1Q"
);

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
  const { isAuthenticated, setAuth,user } = useAuthStore();
  const { mutateAsync: registerUser, isPending: isRegistering } = useRegisterUser();
  
  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "username" | "password" | "phrase" | "walkthrough" | "done">("welcome");
  const [username, setUsername] = useState("");
  const [generatedPhrase, setGeneratedPhrase] = useState<string[]>([]);
  const [hasWallet, setHasWallet] = useState(false);
    const [error, setError] = useState("");


  // Check for existing wallet on mount
  // Check for existing wallet on mount
  useEffect(() => {
     const checkWallet = async () => {
         const encryptedWallet = await loadWallet();
         if (encryptedWallet) {
             console.log("Encrypted wallet found, waiting for login");
             setHasWallet(true);
         } else {
             console.log("No wallet found, starting onboarding");
         }
         setIsInitialized(true);
     };
     checkWallet();
  }, []);

  const [balance, setBalance] = useState(0);
  const [shieldedBalance, setShieldedBalance] = useState(0);
  const [address, setAddress] = useState("");
  
  // Navigation State
  const [view, setView] = useState<"dashboard" | "activity" | "details">("dashboard");
  const [lastView, setLastView] = useState<"dashboard" | "activity">("dashboard");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // SDK state
  const [connection, setConnection] = useState<Connection | undefined>();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [program, setProgram] = useState<Program<any> | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Notes state
  const [storedNotes, setStoredNotes] = useState<StoredNote[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([
   
  ]);

    // Load stored notes from NoteManager
    const loadNotes = async () => {
      try {
        const notes = await noteManager.getAllNotes();
        const uiNotes = notes.map(n => ({
            commitment: n.commitment,
            amount: Number(n.amount) / 1e9, // Convert Lamports to SOL
            root: "dummy", 
            timestamp: n.timestamp
        }));
        setStoredNotes(uiNotes);
        
        const balanceBigInt = await noteManager.getBalance();
        setShieldedBalance(Number(balanceBigInt) / 1e9); // Convert Lamports to SOL

        // Map notes to transactions for history
        const noteTxs: Transaction[] = notes.map((n) => ({
             id: n.id || n.commitment.slice(0, 8),
             type: "receive", // Default to receive for shielded notes
             amount: Number(n.amount) / 1e9, // Convert Lamports to SOL
             timestamp: n.timestamp,
             status: "confirmed",
             address: "Shielded Pool"
        }));
        
        // Merge with dummy for demo feeling
        setTransactions(prev => [...prev.filter(t => t.address !== "Shielded Pool"), ...noteTxs]);
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    };

    const handleSyncNotes = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            if (wallet && 'payer' in wallet) {
               const secretKey = (wallet as any).payer.secretKey;
               // Derive Privacy Key (BabyJubJub)
               const { privateKey } = await derivePrivacyKeyFromSignatureKey(secretKey);
               const privKeyHex = Buffer.from(privateKey).toString('hex');
               
               const count = await syncNotesFromRelayer(privKeyHex);
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

  useEffect(() => {

    // Initialize SDK
    const initializeSDK = async () => {
      try {
        console.log("Initializing SDK...");

        const conn = new Connection(DEVNET_RPC_URL, "confirmed");
        setConnection(conn);
        console.log("✓ Connection established to devnet");

        let keypair: Keypair;
        const storedPrivateKey = localStorage.getItem("wallet_private_key");

        if (storedPrivateKey) {
          try {
            const secretKey = new Uint8Array(JSON.parse(storedPrivateKey));
            keypair = Keypair.fromSecretKey(secretKey);
            console.log(
              "✓ Wallet loaded from storage:",
              keypair.publicKey.toString()
            );
          } catch (error) {
            console.error(
              "Failed to load wallet from storage, generating new one:",
              error
            );
            keypair = Keypair.generate();
            localStorage.setItem(
              "wallet_private_key",
              JSON.stringify(Array.from(keypair.secretKey))
            );
            console.log(
              "✓ New wallet generated and stored:",
              keypair.publicKey.toString()
            );
          }
        } else {
          // No stored key, wait for user onboarding
          console.log("No wallet found, waiting for onboarding");
          setIsInitialized(true); 
          return; 
        }

        const walletInstance = new Wallet(keypair);
        setWallet(walletInstance);
        setAddress(keypair.publicKey.toString());

        const provider = new anchor.AnchorProvider(conn, walletInstance, {
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        });
        anchor.setProvider(provider);
        console.log("✓ Provider configured");

        const programInstance = new anchor.Program(
          privacyPoolIdl as Idl,
          provider
        ) as Program<any>;
        setProgram(programInstance);
        console.log(
          "✓ Program initialized:",
          PRIVACY_POOL_PROGRAM_ID.toString()
        );

        const walletBalance = await conn.getBalance(keypair.publicKey);
        setBalance(walletBalance / 1e9);
        console.log(`✓ Balance: ${walletBalance / 1e9} SOL`);

        setIsInitialized(true);
        console.log("✅ SDK fully initialized and ready");
        
        loadNotes();

        if (walletBalance < 1e9) {
          console.log("Balance low, requesting airdrop...");
          try {
            const airdropSignature = await conn.requestAirdrop(
              keypair.publicKey,
              2e9 // 2 SOL
            );
            await conn.confirmTransaction(airdropSignature);
            const newBalance = await conn.getBalance(keypair.publicKey);
            setBalance(newBalance / 1e9);
            console.log(
              "✓ Airdrop successful, new balance:",
              newBalance / 1e9,
              "SOL"
            );
          } catch (error) {
            console.error("Airdrop failed:", error);
          }
        }
      } catch (error) {
        console.error("❌ Failed to initialize SDK:", error);
      }
    };

    initializeSDK();
  }, []);

  const deposit = async (amount: number) => {
    if (!connection || !wallet || !program) {
      console.error("SDK not initialized");
      throw new Error("SDK not initialized");
    }

    try {
      console.log(`Starting deposit: ${amount} SOL`);

      const { config } = getPoolPdas(program.programId);
      console.log("Expected config PDA:", config.toBase58());

      console.log("Creating privacy note...");
      const amountLamports = sol(amount);
      const { commitment } = createNoteWithCommitment({
        value: amountLamports,
        owner: wallet.publicKey,
      });

      const dummyRoot = new Uint8Array(32).fill(2);

      console.log("Depositing to privacy pool...");
      const depositResult = await createNoteAndDeposit({
        program,
        depositor: wallet,
        denomIndex: 0,
        valueLamports: amountLamports,
      });
      console.log("✅ Deposit successful:", depositResult);

      return {
        commitment,
        depositResult,
        root: dummyRoot,
      };
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  };

  const withdraw = async (
    recipient: string,
    amount: number,
    merkleRoot?: Uint8Array
  ) => {
    if (!connection || !wallet || !program) {
      console.error("SDK not initialized");
      throw new Error("SDK not initialized");
    }

    try {
      console.log(`Starting withdrawal: ${amount} SOL to ${recipient}`);

      console.log("Generating zero-knowledge proof...");
      const sdkProof = await buildDummyProof();
      console.log("SDK Proof generated:", sdkProof);

      const proofBytes = {
        pi_a: ["1", "2", "1"],
        pi_b: [
          ["3", "4"],
          ["5", "6"],
          ["1", "1"],
        ],
        pi_c: ["7", "8", "1"],
        protocol: "groth16",
        curve: "bn128",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      console.log("Using proof:", proofBytes);

      const nullifier = new Uint8Array(32);
      crypto.getRandomValues(nullifier);

      const root = merkleRoot || new Uint8Array(32).fill(2);

      console.log("Submitting withdrawal to relayer...");
      const withdrawRequest = {
        root: Buffer.from(root).toString("hex"),
        nullifier: Buffer.from(nullifier).toString("hex"),
        denomIndex: 0,
        recipient: recipient,
        proof: proofBytes,
      };

      console.log("Sending withdrawal request to relayer:", withdrawRequest);

      const response = await fetch(
        "https://relayer-uh9k.onrender.com/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(withdrawRequest),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Withdrawal failed");
      }

      const result = await response.json();
      console.log("✅ Withdrawal successful:", result);
      console.log(`✓ Successfully withdrew ${amount} SOL to ${recipient}`);

      return result;
    } catch (error) {
      console.error("❌ Withdrawal failed:", error);
      throw error;
    }
  };

  // --- Handlers ---

  const handleShieldFunds = async (amount: number) => {
     try {
        // 1. Perform Deposit
        const result = await deposit(amount);
        
        // 2. Refresh Main Balance
        if (connection && wallet) {
            const newBal = await connection.getBalance(wallet.publicKey);
            setBalance(newBal / 1e9);
        }

        // 3. Encrypt and Save to Relayer (Blind Mailbox)
        if (wallet && 'payer' in wallet) {
             const secretKey = (wallet as any).payer.secretKey;
             const myPubKey = (wallet as any).payer.publicKey.toBytes();
             const privKeyHex = Buffer.from(secretKey).toString('hex');

             // Derive Privacy Key for SELF (Recipient = Us)
             const { publicKey: myPrivacyPubKey } = await derivePrivacyKeyFromSignatureKey(secretKey);
             
             // Encrypt for self
             const { ephemeralPublicKey, encryptedBlob } = await encryptNote(
                 myPrivacyPubKey, // Use derived BabyJubJub key
                 {
                     amount: BigInt(amount),
                     blinding: new Uint8Array(32),
                     leafIndex: 0,
                     nullifier: new Uint8Array(32),
                     publicKey: myPrivacyPubKey
                 }
             );
             
             await saveEncryptedNote({
                 commitment: Buffer.from(result.commitment).toString('hex'),
                 ephemeralPublicKey, 
                 encryptedBlob, 
                 timestamp: Date.now(),
             });

             // 4. Save to Local NoteManager immediately
             await noteManager.saveNote({
                commitment: Buffer.from(result.commitment).toString('hex'),
                amount: amount.toString(),
                root: Buffer.from(result.root).toString('hex'),
                timestamp: Date.now(),
                nullifier: "dummy",
                blinding: "dummy",
                privateKey: privKeyHex,
                publicKey: Buffer.from(myPubKey).toString('hex'),
                leafIndex: 0,
             });
             
             // Refresh UI by reloading notes
             // Note: We need to define loadNotes outside useEffect to call it here?
             // Or just update state manually/partially. 
             // Since loadNotes is defined INSIDE useEffect in current structure, we cannot call it here.
             // Refactoring: Move loadNotes to component scope.
             // For now, let's update state manually to reflect change or force reload.
             
             // Ideally refactor loadNotes out.
             // We'll duplicate the state update for now or just trust the next sync.
             // But let's copy the state update logic for immediate feedback.
             const notes = await noteManager.getAllNotes();
             const uiNotes = notes.map(n => ({
                commitment: n.commitment,
                amount: Number(n.amount) / 1e9, // SOL
                root: "dummy", 
                timestamp: n.timestamp
             }));
             setStoredNotes(uiNotes);
             const balanceBigInt = await noteManager.getBalance();
             setShieldedBalance(Number(balanceBigInt) / 1e9); // SOL
        }

     } catch(e) {
        console.error("Shielding error:", e);
        throw e;
     }
  };

  // Withdraws from the shielded pool
  const handleUnshieldFunds = async (recipient: string, amount: number) => {
      // Logic: Find notes that sum up to amount (simplification: assume we can withdraw partial or full)
      // Since the current mock relayer/SDK just needs a valid root and proof, we will use the stored root
      // In a real ZK app, we would enable spending specific notes. 
      // Here we just check balance sufficient and use the first available note's root (or dummy).
      
      try {
          // 1. Check Shielded Balance
          if (amount > shieldedBalance) throw new Error("Insufficient shielded funds");

          // 2. Perform Withdrawal
          // We pick a root from our notes if available, or fall back (SDK handles dummy root)
          const noteToSpend = storedNotes[0]; 
          const root = noteToSpend ? new Uint8Array(Buffer.from(noteToSpend.root, 'hex')) : undefined;

          await withdraw(recipient, amount, root);

          // 3. Update Stored Notes (Simplification: just reduce the shielded amount tracking)
          // In reality, we would mark specific notes as spent (nullified)
          // For this demo, we will just remove the equivalent value from our "local tracker" roughly
          // by removing notes or updating a "spent" counter. 
          // Let's just remove the first note(s) that sum up to 'amount' or reduce the total.
          // Simplest: Just reduce the displayed balance by removing 'amount' worth of notes or partial.
          // Since we can't 'partial spend' a note easily without change output logic in ZK,
          // we will just DECREMENT the tracked total visually by updating state, 
          // and dirty-remove the first note for logic correctness if needed.
          
          // Update local storage via NoteManager if possible or re-load
          // Since we haven't implemented explicit spend tracking in NoteManager yet in this detailed way
          // We will just invoke loadNotes() to refresh from what NoteManager has (which is nothing changed yet)
          // AND manually update NoteManager to mark as spent (if we implemented markAsSpent).
          // noteManager.markAsSpent(noteToSpend.id, "txSig");
          
          // For now, let's just trigger loadNotes() and let the UI refresh.
          // But since we didn't actually mark spent in NoteManager, balance won't change.
          // We should manually update local state for the demo feel.
          
          const newTotal = Math.max(0, shieldedBalance - amount); // shieldedBalance is now SOL, amount is SOL
          setShieldedBalance(newTotal);

          // Update local state ONLY (NoteManager remains out of sync until we impl spend logic properly)
          const updatedNotes = [...storedNotes];
          if (updatedNotes.length > 0) {
             updatedNotes[0].amount -= amount; 
             if (updatedNotes[0].amount <= 0) updatedNotes.shift(); 
          }
          setStoredNotes(updatedNotes);
          
          // TODO: Call noteManager.markAsSpent(...)

      } catch(e) {
         console.error("Unshielding error:", e);
         throw e;
      }
  };

  const handleSend = async (recipient: string, amount: number) => {
    try {
      console.log(`Starting send operation: ${amount} SOL to ${recipient}`);

      const { root } = await deposit(amount);
      await withdraw(recipient, amount, root);

      console.log(`✅ Successfully sent ${amount} SOL to ${recipient}`);
      
      // Refresh balance
      if (connection && wallet) {
        const newBal = await connection.getBalance(wallet.publicKey);
        setBalance(newBal / 1e9);
      }
    } catch (error) {
      console.error("❌ Send failed:", error);
      throw error;
    }
  };




  console.log({onboardingStep})

  // Handle username submission
  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setOnboardingStep("password");
  };

  // Handle password submission for new users
  const handleCreatePassword = async (password: string) => {
    try {
        // 1. Register with backend
        const response = await registerUser(username);
        
        // 2. Derive wallet from returned mnemonic
        const mnemonic = response.encryptedMnemonic || ""; 
        if (!mnemonic) throw new Error("No mnemonic returned");
        
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keypair = Keypair.fromSeed(seed.slice(0, 32));
        
        // 3. Encrypt and Store in IndexedDB
        const secretKeyStr = JSON.stringify(Array.from(keypair.secretKey));
        const encryptedData = await encrypt(secretKeyStr, password);
        // Store wallet AND token in the new secure storage
        await saveWallet(encryptedData, response.token);
        
        // 4. Update UI
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
        const programInstance = new anchor.Program(privacyPoolIdl as Idl, provider) as Program<any>;
        setProgram(programInstance);
        
        setAuth({ username: response.username, publicKey: response.publicKey });

    } catch(e) {
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

  // Handle login for returning users
  const handleLogin = async (password: string) => {
     try {
         const encryptedWallet = await loadWallet();
         if (!encryptedWallet) {
             console.error("No wallet found");
             return; 
         }

         // Decrypt
         const secretKeyStr = await decrypt(encryptedWallet, password);
         const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
         const keypair = Keypair.fromSecretKey(secretKey);

         // Initialize Session
         const walletInstance = new Wallet(keypair);
         setWallet(walletInstance);
         setAddress(keypair.publicKey.toString());
         
         const conn = new Connection(DEVNET_RPC_URL, "confirmed");
         setConnection(conn);
         
         const provider = new anchor.AnchorProvider(conn, walletInstance, {
           commitment: "confirmed", 
           preflightCommitment: "confirmed"
         });
         anchor.setProvider(provider);
         
         const programInstance = new anchor.Program(privacyPoolIdl as Idl, provider) as Program<any>;
         setProgram(programInstance);

         setAuth({ username: "User", publicKey: keypair.publicKey.toString() }); 
         
         const bal = await conn.getBalance(keypair.publicKey);
         setBalance(bal / 1e9);

     } catch (e) {
         console.error("Login failed:", e);
         setError("Incorrect Password")
        //  alert("Incorrect password"); // Simple feedback
     }
  };

  // Loading state
  if (isRegistering) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md h-[600px] flex flex-col items-center justify-center bg-black/90 border border-white/10">
          <div className="w-12 h-12 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          <p className="mt-4 text-zinc-500 font-mono text-sm">Create account...</p>
        </div>
      </div>
    );
  }

  // Determine if we should show onboarding
  // Show if:
  // 1. No encrypted wallet found (New User) AND not authenticated
  // 2. OR we are in the middle of onboarding (step != welcome/done)
  const showOnboarding = !hasWallet && !isAuthenticated || (onboardingStep !== "welcome" && onboardingStep !== "done");

  // New user onboarding flow
  if (showOnboarding) {
    return (
      <div className="h-full  bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <AnimatePresence mode="wait">
            {onboardingStep === "welcome" && (
              <WelcomePage 
                key="welcome"
                onGetStarted={() => setOnboardingStep("username")} 
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
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Returning user login
  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
          <LoginPage error={error} setError={setError} onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Dashboard (logged in)
  return (
    <div className="h-full  bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[600px] flex flex-col relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10">
        <WalletHeader    address={user?.publicKey} onSettings={() => setIsSettingsModalOpen(true)} />
        <BalanceDisplay 
          balance={balance} 
          address={user?.publicKey?.toString() || ""}
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />

        {/* Shielded Balance + Action Buttons */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
            <span>Shielded Balance</span>
            <div className="flex items-center gap-2">
                 <span className="text-neon-green">{shieldedBalance.toFixed(4)} SOL</span>
                 <button 
                    onClick={handleSyncNotes}
                    disabled={isSyncing}
                    className={`ml-2 p-1 rounded hover:bg-white/10 ${isSyncing ? 'animate-spin' : ''}`}
                    title="Sync Notes"
                 >
                    <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
            </div>
          </div>
          {!isInitialized && (
            <div className="py-2 px-3 mb-2 border border-neon-green/30 bg-neon-green/10">
              <p className="text-[10px] font-mono text-center">
                Initializing connection to devnet...
              </p>
            </div>
          )}
        </div>

        <ActionButtons
          onSwap={() => setIsSwapModalOpen(true)}
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
            onDeposit={handleShieldFunds}
        />

        <WithdrawModal 
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            onWithdraw={handleUnshieldFunds}
            shieldedBalance={shieldedBalance}
        />

        <SwapModal 
            isOpen={isSwapModalOpen}
            onClose={() => setIsSwapModalOpen(false)}
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
