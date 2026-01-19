import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CreateDappWalletModal } from "./CreateDappWalletModal";
import { DappWalletCard } from "./DappWalletCard";
import type { DappWallet } from "../utils/dappWalletStorage";
import {
  getDappWallets,
  saveDappWallet,
  deleteDappWallet,
  generateDappWalletKeypair,
} from "../utils/dappWalletStorage";
import { encrypt } from "../utils/encryption";
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
  onTransferToWallet?: (toAddress: string, amount: number) => Promise<void>;
}

export const DAppPage = ({
  availableBalance = 0,
  password = "",
  onTransferToWallet,
}: DAppPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState<DappWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<DappWallet | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<
    "balances" | "history"
  >("balances");

  // On-chain token balances for selected wallet
  const [walletBalances, setWalletBalances] = useState<{
    sol: number;
    usdc: number;
    usdt: number;
    veilo: number;
  }>({ sol: 0, usdc: 0, usdt: 0, veilo: 0 });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Get token prices from hook
  const {
    sol,
    usdc,
    usdt,
    veilo,
    isLoading: isPriceLoading,
  } = useCryptoPrices();

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const loadedWallets = await getDappWallets();
      setWallets(loadedWallets);
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
      if (fundAmount && parseFloat(fundAmount) > 0 && onTransferToWallet) {
        await onTransferToWallet(publicKey, parseFloat(fundAmount));
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
        /* Wallet Detail View - Matching Home Privacy Wallet Page */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header - Like WalletHeader with back button */}
          <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedWallet(null)}
                  className="p-1.5 rounded-full bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all"
                >
                  <svg
                    className="w-4 h-4 text-zinc-400 hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Veilo Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight">
                    {selectedWallet.name}
                  </h1>
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(selectedWallet.publicKey);
                    }}
                    className="flex items-center gap-2 hover:border-neon-green/50 transition-all group relative cursor-pointer"
                    title="Click to copy wallet address"
                  >
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                      {shortenAddress(selectedWallet.publicKey)}
                    </span>
                    <svg
                      className="w-3 h-3 text-zinc-500 group-hover:text-neon-green transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
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
                className="p-1.5 rounded-full bg-zinc-900/60 border border-white/10 hover:border-red-500/50 transition-all"
                title="Delete Wallet"
              >
                <svg
                  className="w-4 h-4 text-zinc-400 hover:text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Balance Display - Like BalanceDisplay component */}
          <div className="px-4 py-4 bg-black/40 border-b border-white/10 shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between"
            >
              {/* Balance */}
              <div>
                <div className="text-3xl font-light tracking-tight">
                  {isPriceLoading || isLoadingBalances ? (
                    <span className="text-zinc-500">Loading...</span>
                  ) : (
                    <>${usdBalance.toFixed(2)}</>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // TODO: Implement receive for dapp wallet
                    navigator.clipboard.writeText(selectedWallet.publicKey);
                    alert("Address copied to clipboard!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
                  title="Receive"
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
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement send for dapp wallet
                    alert("Send feature coming soon for dApp wallets");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
                  title="Send"
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
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons - Like ActionButtons component */}
          <div className="flex justify-center gap-2 px-4 py-3 border-b border-white/10 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedWallet.publicKey);
                alert("Address copied to clipboard!");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
            >
              <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
                <svg
                  className="w-3.5 h-3.5 text-neon-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                RECEIVE
              </span>
            </button>

            <button
              onClick={() => {
                alert("Send feature coming soon for dApp wallets");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
            >
              <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
                <svg
                  className="w-3.5 h-3.5 text-neon-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3-3m0 0l3 3m-3-3v12"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                WITHDRAW
              </span>
            </button>

            <button
              onClick={() => {
                if (onTransferToWallet) {
                  const amount = prompt(
                    `Enter amount to fund ${selectedWallet.name} (SOL):`,
                  );
                  if (amount && parseFloat(amount) > 0) {
                    onTransferToWallet(
                      selectedWallet.publicKey,
                      parseFloat(amount),
                    );
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
            >
              <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
                <svg
                  className="w-3.5 h-3.5 text-neon-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                FUND
              </span>
            </button>
          </div>

          {/* Transaction List - Like TransactionList component */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 px-4">
              <button
                onClick={() => setActiveDetailTab("balances")}
                className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase transition-all relative ${
                  activeDetailTab === "balances"
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                BALANCES
                {activeDetailTab === "balances" && (
                  <motion.div
                    layoutId="dappWalletTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveDetailTab("history")}
                className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase transition-all relative ${
                  activeDetailTab === "history"
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                HISTORY
                {activeDetailTab === "history" && (
                  <motion.div
                    layoutId="dappWalletTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {activeDetailTab === "balances" ? (
              /* Balances Tab - Like TransactionList balances */
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* SOL Balance */}
                <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
                  {/* Corner Brackets */}
                  <svg
                    className="absolute top-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,3 L0,0 L3,0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute top-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M7,0 L10,0 L10,3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,7 L0,10 L3,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M10,7 L10,10 L7,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={solLogo} alt="SOL" className="w-8 h-8" />
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                          Solana
                        </p>
                        <p className="text-xs text-white font-medium">SOL</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-light text-white">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.sol.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {isPriceLoading || isLoadingBalances ? (
                          <span>--</span>
                        ) : (
                          <span>
                            ≈ $
                            {(walletBalances.sol * (sol?.price || 0)).toFixed(
                              2,
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* USDC Balance */}
                <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
                  {/* Corner Brackets */}
                  <svg
                    className="absolute top-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,3 L0,0 L3,0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute top-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M7,0 L10,0 L10,3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,7 L0,10 L3,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M10,7 L10,10 L7,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={usdcLogo} alt="USDC" className="w-8 h-8" />
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                          USD Coin
                        </p>
                        <p className="text-xs text-white font-medium">USDC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-light text-white">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.usdc.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.usdc * (usdc?.price || 1)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* USDT Balance */}
                <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
                  {/* Corner Brackets */}
                  <svg
                    className="absolute top-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,3 L0,0 L3,0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute top-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M7,0 L10,0 L10,3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,7 L0,10 L3,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M10,7 L10,10 L7,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={usdtLogo} alt="USDT" className="w-8 h-8" />
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                          Tether
                        </p>
                        <p className="text-xs text-white font-medium">USDT</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-light text-white">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.usdt.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.usdt * (usdt?.price || 1)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* VEILO Balance */}
                <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
                  {/* Corner Brackets */}
                  <svg
                    className="absolute top-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,3 L0,0 L3,0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute top-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M7,0 L10,0 L10,3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 left-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M0,7 L0,10 L3,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 text-neon-green/40"
                    viewBox="0 0 10 10"
                  >
                    <path
                      d="M10,7 L10,10 L7,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-neon-green">
                          V
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                          Veilo
                        </p>
                        <p className="text-xs text-white font-medium">VEILO</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-light text-white">
                        {isLoadingBalances
                          ? "..."
                          : walletBalances.veilo.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {isPriceLoading || isLoadingBalances
                          ? "--"
                          : `≈ $${(walletBalances.veilo * (veilo?.price || 0)).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* History Tab - Empty State */
              <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-white/40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    No transactions yet
                  </p>
                </div>
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

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-white text-black font-mono text-xs uppercase tracking-wider hover:bg-white/90 transition-colors"
          >
            Create Dapp Wallet
          </button>
        </div>
      ) : (
        /* Wallet List */
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-mono text-white uppercase tracking-wider">
                Dapp Wallet
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                1 wallet maximum
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={wallets.length >= 1}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
                balance={wallet.balance}
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
    </div>
  );
};
