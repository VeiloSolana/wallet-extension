import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { CyberButton } from "./CyberButton";
import { CreateDappWalletModal } from "./CreateDappWalletModal";
import { ReceiveModal } from "./ReceiveModal";
import { DappSendModal } from "./DappSendModal";
import { DappWalletCard } from "./DappWalletCard";
import type { DappWallet } from "../utils/dappWalletStorage";
import {
  getDappWallets,
  saveDappWallet,
  deleteDappWallet,
  generateDappWalletKeypair,
} from "../utils/dappWalletStorage";
import { encrypt, decrypt } from "../utils/encryption";
import { useCryptoPrices } from "../hooks/useSolPrice";
import solLogo from "/images/sol-logo.svg";
import usdcLogo from "/images/usdc-logo.svg";
import usdtLogo from "/images/usdt-logo.svg";

// Devnet RPC
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// Token mint addresses (devnet)
const TOKEN_MINTS = {
  usdc: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet
  usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT (placeholder)
  veilo: "VeiLoYourTokenMintAddressHere11111111111111", // VEILO (placeholder)
};

interface DAppPageProps {
  availableBalance?: number;
  password?: string;
  onWithdrawToWallet?: (toAddress: string, amount: number) => Promise<void>;
}

export const DAppPage = ({
  availableBalance = 0,
  password = "",
  onWithdrawToWallet,
}: DAppPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState<DappWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<DappWallet | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<
    "balances" | "history"
  >("balances");
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // On-chain token balances for selected wallet
  const [walletBalances, setWalletBalances] = useState<{
    sol: number;
    usdc: number;
    usdt: number;
    veilo: number;
  }>({ sol: 0, usdc: 0, usdt: 0, veilo: 0 });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // On-chain SOL balances for wallet list
  const [walletListBalances, setWalletListBalances] = useState<
    Record<string, number>
  >({});

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Get token prices from hook
  const {
    sol,
    usdc,
    usdt,
    veilo,
    isLoading: isPriceLoading,
  } = useCryptoPrices();

  // Fetch on-chain SOL balance for a single wallet
  const fetchSolBalance = async (publicKeyStr: string): Promise<number> => {
    try {
      const connection = new Connection(DEVNET_RPC_URL, "confirmed");
      const publicKey = new PublicKey(publicKeyStr);
      const solBalance = await connection.getBalance(publicKey);
      return solBalance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Failed to fetch SOL balance for", publicKeyStr, error);
      return 0;
    }
  };

  // Fetch transaction history
  const fetchHistory = useCallback(async (publicKeyStr: string) => {
    setIsHistoryLoading(true);
    try {
      const connection = new Connection(DEVNET_RPC_URL, "confirmed");
      const publicKey = new PublicKey(publicKeyStr);
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 20,
      });

      const signatureList = signatures.map((s) => s.signature);
      const txs = await connection.getParsedTransactions(signatureList, {
        maxSupportedTransactionVersion: 0,
      });

      const processed = txs
        .map((tx, index) => {
          if (!tx) return null;

          const sigInfo = signatures[index];
          const date = sigInfo.blockTime
            ? new Date(sigInfo.blockTime * 1000)
            : new Date();

          let type = "unknown";
          let amount = 0;
          let symbol = "SOL";

          // Calculate SOL change for this wallet
          const preBalances = tx.meta?.preBalances || [];
          const postBalances = tx.meta?.postBalances || [];
          const accountKeys = tx.transaction.message.accountKeys.map((k) =>
            k.pubkey ? k.pubkey.toString() : k.toString(),
          );

          const myIndex = accountKeys.indexOf(publicKeyStr);
          if (myIndex !== -1) {
            const diff =
              (postBalances[myIndex] - preBalances[myIndex]) / LAMPORTS_PER_SOL;
            if (diff > 0) {
              type = "receive";
              amount = diff;
            } else if (diff < 0) {
              type = "send";
              amount = Math.abs(diff);
            }
          }

          // If change is tiny (txn fees), mark as interaction
          if (amount < 0.00001 && type === "send") {
            type = "interaction"; // likely just paying gas
          }

          if (Math.abs(amount) < 0.000000001) {
            type = "interaction";
          }

          return {
            signature: sigInfo.signature,
            date,
            type,
            amount,
            symbol,
            status: sigInfo.confirmationStatus,
            err: sigInfo.err,
          };
        })
        .filter((item) => item !== null);

      setHistory(processed as any[]);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWallet && activeDetailTab === "history") {
      fetchHistory(selectedWallet.publicKey);
    }
  }, [selectedWallet, activeDetailTab, fetchHistory]);

  // Fetch balances for all wallets in the list
  const fetchAllWalletBalances = async (walletList: DappWallet[]) => {
    const balances: Record<string, number> = {};
    await Promise.all(
      walletList.map(async (wallet) => {
        balances[wallet.publicKey] = await fetchSolBalance(wallet.publicKey);
      }),
    );
    setWalletListBalances(balances);
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const loadedWallets = await getDappWallets();
      setWallets(loadedWallets);
      // Fetch on-chain balances for all wallets
      fetchAllWalletBalances(loadedWallets);
    } catch (error) {
      console.error("Failed to load dapp wallets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDappWallet = async (name: string, fundAmount: string) => {
    try {
      // Generate new keypair
      const keypair = generateDappWalletKeypair();
      const publicKey = keypair.publicKey.toString();

      // Encrypt the private key
      const privateKeyArray = Array.from(keypair.secretKey);
      const privateKeyString = JSON.stringify(privateKeyArray);
      const encryptedPrivateKey = await encrypt(privateKeyString, password);

      // Create wallet object
      const newWallet: DappWallet = {
        id: Date.now().toString(),
        name,
        publicKey,
        encryptedPrivateKey,
        balance: 0,
        createdAt: Date.now(),
      };

      // Save wallet
      await saveDappWallet(newWallet);

      // If funding amount is provided, transfer from main wallet
      if (fundAmount && parseFloat(fundAmount) > 0 && onWithdrawToWallet) {
        await onWithdrawToWallet(publicKey, parseFloat(fundAmount));
        newWallet.balance = parseFloat(fundAmount);
      }

      // Reload wallets
      await loadWallets();
    } catch (error) {
      console.error("Failed to create dapp wallet:", error);
      alert("Failed to create dapp wallet. Please try again.");
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (confirm("Are you sure you want to delete this dapp wallet?")) {
      try {
        await deleteDappWallet(id);
        await loadWallets();
      } catch (error) {
        console.error("Failed to delete dapp wallet:", error);
        alert("Failed to delete dapp wallet. Please try again.");
      }
    }
  };

  const handleSelectWallet = (wallet: DappWallet) => {
    setSelectedWallet(wallet);
  };

  const handleSendFunds = async (recipient: string, amount: number) => {
    if (!selectedWallet) return;
    try {
      // Decrypt private key
      let encryptedData = selectedWallet.encryptedPrivateKey;

      // Legacy support: checks if it's a string somehow
      if (typeof (encryptedData as unknown) === "string") {
        try {
          encryptedData = JSON.parse(encryptedData as unknown as string);
        } catch (e) {
          console.error("Failed to parse encrypted data", e);
        }
      }

      const decryptedKeyStr = await decrypt(encryptedData, password);
      // decryptedKeyStr is "[1,2,3...]"
      const secretKeyJson = JSON.parse(decryptedKeyStr);
      const secretKey = Uint8Array.from(secretKeyJson);
      const keypair = Keypair.fromSecretKey(secretKey);

      const connection = new Connection(DEVNET_RPC_URL, "confirmed");

      // Verify destination is valid pubkey
      let toPubkey;
      try {
        toPubkey = new PublicKey(recipient);
      } catch (e) {
        throw new Error("Invalid recipient address");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        }),
      );

      const signature = await connection.sendTransaction(transaction, [
        keypair,
      ]);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed",
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed on chain");
      }

      // Refresh data
      fetchWalletBalances(selectedWallet.publicKey);
      if (activeDetailTab === "history") {
        fetchHistory(selectedWallet.publicKey);
      }
    } catch (error: any) {
      console.error("Send failed:", error);
      throw new Error(error.message || "Failed to send funds");
    }
  };

  // Fetch on-chain balances for selected wallet
  const fetchWalletBalances = useCallback(async (publicKeyStr: string) => {
    setIsLoadingBalances(true);
    try {
      const connection = new Connection(DEVNET_RPC_URL, "confirmed");
      const publicKey = new PublicKey(publicKeyStr);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Fetch SPL token balances
      let usdcBalance = 0;
      let usdtBalance = 0;
      let veiloBalance = 0;

      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            ),
          },
        );

        for (const account of tokenAccounts.value) {
          const mintAddress = account.account.data.parsed.info.mint;
          const amount =
            account.account.data.parsed.info.tokenAmount.uiAmount || 0;

          if (mintAddress === TOKEN_MINTS.usdc) {
            usdcBalance = amount;
          } else if (mintAddress === TOKEN_MINTS.usdt) {
            usdtBalance = amount;
          } else if (mintAddress === TOKEN_MINTS.veilo) {
            veiloBalance = amount;
          }
        }
      } catch (tokenError) {
        console.log("No token accounts found or error fetching:", tokenError);
      }

      setWalletBalances({
        sol: solAmount,
        usdc: usdcBalance,
        usdt: usdtBalance,
        veilo: veiloBalance,
      });
    } catch (error) {
      console.error("Failed to fetch wallet balances:", error);
      setWalletBalances({ sol: 0, usdc: 0, usdt: 0, veilo: 0 });
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  // Fetch balances when wallet is selected
  useEffect(() => {
    if (selectedWallet) {
      fetchWalletBalances(selectedWallet.publicKey);
    }
  }, [selectedWallet, fetchWalletBalances]);

  // Helper function to shorten address
  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // Calculate USD balance from all tokens
  const usdBalance = selectedWallet
    ? walletBalances.sol * (sol?.price || 0) +
      walletBalances.usdc * (usdc?.price || 1) +
      walletBalances.usdt * (usdt?.price || 1) +
      walletBalances.veilo * (veilo?.price || 0)
    : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-400">Loading wallets...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {selectedWallet ? (
        /* Detail View */
        <div className="flex-1 flex flex-col min-h-0 bg-black">
          {/* Header */}
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-md shrink-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedWallet(null)}
                className="w-8 h-8 rounded border border-white/10 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all hover:scale-105 active:scale-95"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </button>

              <div>
                <h2 className="text-sm font-mono font-bold tracking-widest text-white uppercase flex items-center gap-2">
                  {selectedWallet.name}
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(0,255,163,0.5)] animate-pulse" />
                </h2>
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(selectedWallet.publicKey);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer group"
                >
                  <p className="text-[10px] font-mono text-zinc-500 group-hover:text-neon-green transition-colors">
                    {shortenAddress(selectedWallet.publicKey)}
                  </p>
                  <svg
                    className="w-3 h-3 text-zinc-600 group-hover:text-neon-green transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleDeleteWallet(selectedWallet.id);
                setSelectedWallet(null);
              }}
              className="w-8 h-8 rounded border border-white/10 bg-zinc-900/50 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
              title="Delete Wallet"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>

          {/* Main Dashboard Card */}
          <div className="px-4 pt-4 pb-2 shrink-0">
            <div className="relative bg-zinc-900/40 border border-white/10 p-3.5 group overflow-hidden">
              {/* Tech Corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-white/20 group-hover:border-neon-green/60 transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-white/20 group-hover:border-neon-green/60 transition-colors" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-white/20 group-hover:border-neon-green/60 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white/20 group-hover:border-neon-green/60 transition-colors" />

              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest pl-0.5 mb-0.5">
                      Total Balance
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-mono text-white tracking-tighter font-light">
                        {isPriceLoading || isLoadingBalances ? (
                          <span className="animate-pulse">--.--</span>
                        ) : (
                          <>${usdBalance.toFixed(2)}</>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        USD
                      </span>
                    </div>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                    <span className="text-[9px] font-mono text-neon-green">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 border-b border-white/10 shrink-0">
            <CyberButton
              onClick={() => setIsReceiveModalOpen(true)}
              variant="secondary"
              className="flex flex-col items-center gap-1.5 py-2 h-auto"
            >
              <svg
                className="w-4 h-4 text-neon-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-[9px] font-mono tracking-wider">
                RECEIVE
              </span>
            </CyberButton>

            <CyberButton
              onClick={() => setIsSendModalOpen(true)}
              variant="secondary"
              className="flex flex-col items-center gap-1.5 py-2 h-auto"
            >
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <span className="text-[9px] font-mono tracking-wider text-zinc-400">
                SEND
              </span>
            </CyberButton>

            <CyberButton
              onClick={() => {
                if (onWithdrawToWallet) {
                  const amount = prompt(`Fund ${selectedWallet.name} (SOL):`);
                  if (amount && parseFloat(amount) > 0) {
                    onWithdrawToWallet(
                      selectedWallet.publicKey,
                      parseFloat(amount),
                    );
                  }
                }
              }}
              variant="secondary"
              className="flex flex-col items-center gap-1.5 py-2 h-auto"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="text-[9px] font-mono tracking-wider text-white">
                FUND
              </span>
            </CyberButton>
          </div>

          {/* Transaction List - Like TransactionList component */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-black shrink-0 px-4">
              <button
                onClick={() => setActiveDetailTab("balances")}
                className={`flex-1 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-all relative ${
                  activeDetailTab === "balances"
                    ? "text-neon-green"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                BALANCES
                {activeDetailTab === "balances" && (
                  <motion.div
                    layoutId="dappWalletTab"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveDetailTab("history")}
                className={`flex-1 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-all relative ${
                  activeDetailTab === "history"
                    ? "text-neon-green"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                HISTORY
                {activeDetailTab === "history" && (
                  <motion.div
                    layoutId="dappWalletTab"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {activeDetailTab === "balances" ? (
              /* Balances Tab */
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Available Assets Header */}
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Asset
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Balance
                  </span>
                </div>

                {/* SOL Balance */}
                <div className="relative p-3 bg-zinc-900/20 border border-white/5 hover:border-white/20 hover:bg-zinc-900/40 transition-all group">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={solLogo}
                        alt="SOL"
                        className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div>
                        <p className="text-sm font-mono text-white font-bold group-hover:text-neon-green transition-colors">
                          SOL
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                          Solana
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white tracking-tight">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.sol.toFixed(4)}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.sol * (sol?.price || 0)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* USDC Balance */}
                <div className="relative p-3 bg-zinc-900/20 border border-white/5 hover:border-white/20 hover:bg-zinc-900/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={usdcLogo}
                        alt="USDC"
                        className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div>
                        <p className="text-sm font-mono text-white font-bold group-hover:text-neon-green transition-colors">
                          USDC
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                          USD Coin
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white tracking-tight">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.usdc.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.usdc * (usdc?.price || 1)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* USDT Balance */}
                <div className="relative p-3 bg-zinc-900/20 border border-white/5 hover:border-white/20 hover:bg-zinc-900/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={usdtLogo}
                        alt="USDT"
                        className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div>
                        <p className="text-sm font-mono text-white font-bold group-hover:text-neon-green transition-colors">
                          USDT
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                          Tether
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white tracking-tight">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.usdt.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.usdt * (usdt?.price || 1)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* VEILO Balance */}
                <div className="relative p-3 bg-zinc-900/20 border border-white/5 hover:border-white/20 hover:bg-zinc-900/40 transition-all group">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/10 group-hover:border-neon-green/50 transition-colors" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                        <span className="text-[10px] font-bold text-white">
                          V
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-mono text-white font-bold group-hover:text-neon-green transition-colors">
                          VEILO
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                          Veilo Token
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white tracking-tight">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.veilo.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.veilo * (veilo?.price || 0)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* History Tab */
              <div className="flex-1 overflow-y-auto bg-black/50">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="w-5 h-5 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                    <p className="text-[10px] font-mono text-zinc-500 animate-pulse">
                      Loading transactions...
                    </p>
                  </div>
                ) : history.length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/5">
                      <svg
                        className="w-5 h-5 text-zinc-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  /* Transaction List */
                  <div className="divide-y divide-white/5">
                    {history.map((tx) => (
                      <div
                        key={tx.signature}
                        className="p-3 pl-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded border border-white/5 flex items-center justify-center shrink-0 ${
                              tx.type === "receive"
                                ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                                : tx.type === "send"
                                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                                  : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {tx.type === "receive" && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                              </svg>
                            )}
                            {tx.type === "send" && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                              </svg>
                            )}
                            {(tx.type === "interaction" ||
                              tx.type === "unknown") && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-mono text-white font-medium mb-0.5">
                              {tx.type === "receive"
                                ? "Received"
                                : tx.type === "send"
                                  ? "Sent"
                                  : "Interaction"}
                            </p>
                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                              {tx.date.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-mono mb-0.5 ${
                              tx.type === "receive"
                                ? "text-neon-green font-bold"
                                : tx.type === "send"
                                  ? "text-white"
                                  : "text-zinc-400"
                            }`}
                          >
                            {tx.type === "receive"
                              ? "+"
                              : tx.type === "send"
                                ? "-"
                                : ""}
                            {tx.amount > 0 ? tx.amount.toFixed(4) : ""}{" "}
                            {tx.symbol}
                          </p>
                          <a
                            href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-mono text-zinc-600 hover:text-neon-green transition-colors block"
                          >
                            Explorer ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : wallets.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white/60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          </div>

          <h2 className="text-base font-mono text-white mb-2">
            No dapp wallets
          </h2>

          <p className="text-xs font-mono text-zinc-400 text-center mb-6 max-w-xs leading-relaxed">
            Create a unique wallet for dApps while keeping main funds private.
          </p>

          <div className="w-full max-w-[200px]">
            <CyberButton
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              CREATE DAPP WALLET
            </CyberButton>
          </div>
        </div>
      ) : (
        /* Wallet List */
        <div className="flex-1 overflow-y-auto bg-black">
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono text-white font-bold tracking-widest uppercase">
                  Dapp Wallets
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[9px] font-mono text-zinc-400">
                  {wallets.length}/1 ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Isolated wallets for safe interaction
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={wallets.length >= 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-neon-green hover:border-neon-green/50 hover:bg-neon-green/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-zinc-400 disabled:hover:bg-zinc-900/50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            {wallets.map((wallet) => (
              <DappWalletCard
                key={wallet.id}
                name={wallet.name}
                publicKey={wallet.publicKey}
                balance={walletListBalances[wallet.publicKey] ?? 0}
                onSelect={() => handleSelectWallet(wallet)}
                onDelete={() => handleDeleteWallet(wallet.id)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateDappWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateDappWallet}
        availableBalance={availableBalance}
      />

      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        address={selectedWallet?.publicKey || ""}
      />

      <DappSendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendFunds}
        balance={walletBalances.sol}
      />
    </div>
  );
};
