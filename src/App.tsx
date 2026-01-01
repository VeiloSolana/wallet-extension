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
import { SendModal } from "./components/SendModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { Wallet } from "./utils/wallet";
import privacyPoolIdl from "../idl/privacy_pool.json";
import "./App.css";
import { createNoteWithCommitment, getPoolPdas, sol } from "./sdk/client";
import {
  createNoteDepositWithMerkle,
  MerkleTree,
  deriveNullifier,
  initPoseidon,
} from "veilo-sdk-core";

// Program ID deployed on devnet
const PRIVACY_POOL_PROGRAM_ID = new PublicKey(
  "AAiFgdAYeo8UXtZkZrN2frmRsS6hDrkstsTmeiPddLA8"
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

function App() {
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  // SDK state
  const [connection, setConnection] = useState<Connection | undefined>();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [program, setProgram] = useState<Program<any> | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);

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
      await initPoseidon();
      console.log(`Starting deposit: ${amount} SOL`);

      const { config } = getPoolPdas(program.programId);
      console.log("Expected config PDA:", config.toBase58());

      console.log("Creating privacy note...");
      const amountLamports = sol(amount);
      const { commitment } = createNoteWithCommitment({
        value: amountLamports,
        owner: wallet.publicKey,
      });
      console.log(
        "✓ Note created with commitment:",
        Buffer.from(commitment).toString("hex")
      );

      console.log("Depositing to privacy pool...");
      const offchainTree = new MerkleTree(16);
      const result = await createNoteDepositWithMerkle({
        program: program as any,
        depositor: wallet,
        denomIndex: 0,
        valueLamports: amountLamports,
        tree: offchainTree,
      });

      const depositNote = result.note;
      const depositRoot = result.root;
      const depositMerklePath = result.merklePath;
      const depositNullifier = deriveNullifier(depositNote);
      // console.log("✅ Deposit successful:", depositResult);

      return {
        commitment,
        result,
        root: depositRoot,
        depositMerklePath,
        depositNullifier,
      };
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  };

  const withdraw = async (
    recipient: string,
    amount: number,
    merkleRoot?: Uint8Array,
    depositNote?: any,
    depositMerklePath?: any,
    depositNullifier?: any
  ) => {
    if (!connection || !wallet || !program) {
      console.error("SDK not initialized");
      throw new Error("SDK not initialized");
    }

    try {
      console.log(`Starting withdrawal: ${amount} SOL to ${recipient}`);

      console.log("Generating zero-knowledge proof...");

      const nullifier = depositNullifier || new Uint8Array(32);
      if (!depositNullifier) {
        crypto.getRandomValues(nullifier);
      }

      const root = merkleRoot || new Uint8Array(32).fill(2);

      console.log("Submitting withdrawal to relayer...");

      // Convert BigInt values to strings for JSON serialization
      const serializableNote = depositNote
        ? {
            ...depositNote,
            value: depositNote.value?.toString(),
          }
        : null;

      const withdrawRequest = {
        root: Buffer.from(root).toString("hex"),
        nullifier: Buffer.from(nullifier).toString("hex"),
        denomIndex: 0,
        recipient: recipient,
        note: serializableNote,
        merklePath: depositMerklePath || null,
      };

      console.log("Sending withdrawal request to relayer:", withdrawRequest);

      const response = await fetch(
        "http://localhost:8080",
        // "https://relayer-uh9k.onrender.com/withdraw",
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

  const handleSend = async (recipient: string, amount: number) => {
    try {
      console.log(`Starting send operation: ${amount} SOL to ${recipient}`);

      const { root, depositMerklePath, depositNullifier, result } =
        await deposit(amount);
      await withdraw(
        recipient,
        amount,
        root,
        result.note,
        depositMerklePath,
        depositNullifier
      );

      console.log(`✅ Successfully sent ${amount} SOL to ${recipient}`);
    } catch (error) {
      console.error("❌ Send failed:", error);
      throw error;
    }
  };

  const handleSwap = () => {
    console.log("Opening swap interface");
    // TODO: Implement swap functionality
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <WalletHeader />
        <BalanceDisplay balance={balance} address={address} />

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
          onSwap={handleSwap}
        />
        <TransactionList transactions={transactions} />

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
      </div>
    </div>
  );
}

export default App;
