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

  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "receive",
      amount: 1.5,
      timestamp: Date.now() - 3600000,
      status: "confirmed",
      address: "9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    },
    {
      id: "2",
      type: "send",
      amount: 0.5,
      timestamp: Date.now() - 7200000,
      status: "confirmed",
      address: "3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    },
    {
      id: "3",
      type: "receive",
      amount: 0.8,
      timestamp: Date.now() - 86400000,
      status: "confirmed",
      address: "5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    },
  ]);

  useEffect(() => {
    // Load stored notes
    const loadNotes = () => {
      const notesStr = localStorage.getItem("shielded_notes");
      if (notesStr) {
        try {
          const notes: StoredNote[] = JSON.parse(notesStr);
          setStoredNotes(notes);
          const totalShielded = notes.reduce((acc, note) => acc + note.amount, 0);
          setShieldedBalance(totalShielded);
          console.log("Loaded shielded notes:", notes.length, "Total:", totalShielded);
        } catch (e) {
          console.error("Failed to load notes", e);
        }
      }
    };

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

        // 3. Store Note locally to track shielded balance
        const newNote: StoredNote = {
            commitment: Buffer.from(result.commitment).toString('hex'),
            amount: amount,
            root: Buffer.from(result.root).toString('hex'),
            timestamp: Date.now()
        };
        const updatedNotes = [...storedNotes, newNote];
        setStoredNotes(updatedNotes);
        localStorage.setItem("shielded_notes", JSON.stringify(updatedNotes));
        
        // 4. Update Shielded Balance State
        const totalShielded = updatedNotes.reduce((acc, note) => acc + note.amount, 0);
        setShieldedBalance(totalShielded);

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
          
          const newTotal = Math.max(0, shieldedBalance - amount);
          setShieldedBalance(newTotal);

          // Update local storage (approximation for demo)
          // If we had a real note manager, we'd update specific UTXOs.
          const updatedNotes = [...storedNotes];
          if (updatedNotes.length > 0) {
             updatedNotes[0].amount -= amount; // partial spend simulation
             if (updatedNotes[0].amount <= 0) updatedNotes.shift(); // remove if empty
          }
          setStoredNotes(updatedNotes);
          localStorage.setItem("shielded_notes", JSON.stringify(updatedNotes));

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md relative overflow-hidden bg-black/90 border border-white/10 shadow-2xl shadow-neon-green/10" style={{ minHeight: "600px" }}>
        <WalletHeader />
        <BalanceDisplay balance={balance} address={address} />

        <div className="px-4 pb-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500 font-mono border-b border-white/5 pb-1">
                <span>Shielded Balance</span>
                <span className="text-neon-green">{shieldedBalance.toFixed(4)} SOL</span>
            </div>
        </div>

        {!isInitialized && (
          <div className="px-4 py-3 mx-4 mt-4 border border-neon-green/30 bg-neon-green/10">
            <p className="text-xs font-mono text-center">
              Initializing connection to devnet...
            </p>
          </div>
        )}

        <ActionButtons
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
          onSwap={() => setIsSwapModalOpen(true)}
          onDeposit={() => setIsDepositModalOpen(true)}
          onWithdraw={() => setIsWithdrawModalOpen(true)}
          onSettings={() => setIsSettingsModalOpen(true)}
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
