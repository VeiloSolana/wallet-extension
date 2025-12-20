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
import {
  buildDummyProof,
  createNoteAndDeposit,
  createNoteWithCommitment,
  getPoolPdas,
  sol,
} from "./sdk/client";

// Program ID deployed on devnet
const PRIVACY_POOL_PROGRAM_ID = new PublicKey(
  "9uHaXDntTPSN1jBhHZwvPT2PFrQzsb4JbmNyVLJHVc6D"
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
      console.log(`Starting deposit: ${amount} SOL`);

      const { config } = getPoolPdas(program.programId);
      console.log("Expected config PDA:", config.toBase58());

      // let poolInitialized = false;
      // try {
      //   const configAccount = await program.account.config.fetch(config);
      //   poolInitialized = true;
      //   console.log("Pool already initialized", configAccount);
      // } catch (error) {
      //   console.log("Pool not initialized or cannot deserialize");
      //   throw new Error(
      //     "Pool must be initialized by the program admin. " +
      //       "The client cannot initialize the pool due to PDA seed constraints. " +
      //       "Please contact the program deployers or check if pool is already initialized with different parameters."
      //   );
      // }

      console.log("Creating privacy note...");
      const amountLamports = sol(amount);
      const { commitment } = createNoteWithCommitment({
        value: amountLamports,
        owner: wallet.publicKey,
      });
      // const leaf = merkleLeafFromCommitment(commitment);
      // console.log("Note commitment and leaf:", { commitment, leaf });

      // // Compute root from an array of leaves, padded up to next power-of-two
      // const root = merkleRootFromLeaves([leaf]);
      // console.log("Computed Merkle root:", root);

      // console.log("Note created with commitment:", commitment);

      console.log("Depositing to privacy pool...");
      const dummyRoot = new Uint8Array(32).fill(6);
      const depositResult = await createNoteAndDeposit({
        program,
        depositor: wallet,
        denomIndex: 0,
        valueLamports: amountLamports,
        newRoot: dummyRoot,
      });
      console.log("✅ Deposit successful:", depositResult);

      return { commitment, depositResult, root: dummyRoot };
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

      const proof = {
        pi_a: ["0", "0", "1"],
        pi_b: [
          ["0", "0"],
          ["0", "0"],
          ["1", "0"],
        ],
        pi_c: ["0", "0", "1"],
        protocol: "groth16",
        curve: "bn128",
      };
      console.log("Using proof:", proof);

      const nullifier = new Uint8Array(32);
      crypto.getRandomValues(nullifier);

      const root = merkleRoot || new Uint8Array(32).fill(21);

      console.log("Submitting withdrawal to relayer...");
      const withdrawRequest = {
        root: Buffer.from(root).toString("hex"),
        nullifier: Buffer.from(nullifier).toString("hex"),
        denomIndex: 0,
        recipient: recipient,
        proof: {
          pi_a: proof.pi_a,
          pi_b: proof.pi_b,
          pi_c: proof.pi_c,
          protocol: proof.protocol,
          curve: proof.curve,
        },
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

  const handleSend = async (recipient: string, amount: number) => {
    try {
      console.log(`Starting send operation: ${amount} SOL to ${recipient}`);

      const { root } = await deposit(amount);
      await withdraw(recipient, amount, root);

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
