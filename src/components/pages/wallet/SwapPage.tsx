import { useState, useEffect } from "react";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { CyberButton } from "../../common/ui/CyberButton";
import { useSwap } from "../../../hooks/useSwap";
import { fromRawAmount, getTokenDecimals } from "../../../lib/swap";
import {
  getDappWallets,
  type DappWallet,
} from "../../../utils/dappWalletStorage";
import { decrypt } from "../../../utils/encryption";
import { getRpcEndpoint } from "../../../lib/network";

interface SwapPageProps {
  keypair: Keypair | null;
  password: string;
}

export const SwapPage = ({ keypair, password }: SwapPageProps) => {
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");

  // Wallet selection state
  const [selectedWalletType, setSelectedWalletType] = useState<
    "master" | "dapp"
  >("master");
  const [selectedDappWalletId, setSelectedDappWalletId] = useState<
    string | null
  >(null);
  const [dappWallets, setDappWallets] = useState<DappWallet[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>(
    {},
  );
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [activeKeypair, setActiveKeypair] = useState<Keypair | null>(keypair);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Load DApp wallets and their balances on mount
  useEffect(() => {
    const loadWallets = async () => {
      setIsLoadingWallets(true);
      try {
        const wallets = await getDappWallets();
        setDappWallets(wallets);

        // Fetch balances for all wallets
        const connection = new Connection(getRpcEndpoint(), "confirmed");
        const balances: Record<string, number> = {};

        // Fetch master wallet balance if available
        if (keypair) {
          try {
            const masterBalance = await connection.getBalance(
              keypair.publicKey,
            );
            balances["master"] = masterBalance / LAMPORTS_PER_SOL;
          } catch (e) {
            console.error("Failed to fetch master wallet balance:", e);
            balances["master"] = 0;
          }
        }

        // Fetch DApp wallet balances
        for (const wallet of wallets) {
          try {
            const pubKey = new PublicKey(wallet.publicKey);
            const balance = await connection.getBalance(pubKey);
            balances[wallet.id] = balance / LAMPORTS_PER_SOL;
          } catch (e) {
            console.error(`Failed to fetch balance for ${wallet.name}:`, e);
            balances[wallet.id] = 0;
          }
        }

        setWalletBalances(balances);
      } catch (e) {
        console.error("Failed to load DApp wallets:", e);
      } finally {
        setIsLoadingWallets(false);
      }
    };

    loadWallets();
  }, [keypair]);

  // Update active keypair when selection changes
  useEffect(() => {
    const updateActiveKeypair = async () => {
      setWalletError(null);

      if (selectedWalletType === "master") {
        setActiveKeypair(keypair);
        return;
      }

      if (selectedWalletType === "dapp" && selectedDappWalletId) {
        const selectedWallet = dappWallets.find(
          (w) => w.id === selectedDappWalletId,
        );
        if (!selectedWallet) {
          setActiveKeypair(null);
          setWalletError("Selected wallet not found");
          return;
        }

        try {
          const decryptedPrivateKey = await decrypt(
            selectedWallet.encryptedPrivateKey,
            password,
          );
          const secretKey = Uint8Array.from(JSON.parse(decryptedPrivateKey));
          const dappKeypair = Keypair.fromSecretKey(secretKey);
          setActiveKeypair(dappKeypair);
        } catch (e) {
          console.error("Failed to decrypt DApp wallet:", e);
          setActiveKeypair(null);
          setWalletError("Failed to decrypt wallet. Please try again.");
        }
      }
    };

    updateActiveKeypair();
  }, [
    selectedWalletType,
    selectedDappWalletId,
    dappWallets,
    keypair,
    password,
  ]);

  const {
    inputToken,
    outputToken,
    setInputToken,
    setOutputToken,
    switchTokens,
    inputAmount,
    outputAmount,
    setInputAmount,
    quote,
    isLoadingQuote,
    quoteError,
    slippageBps,
    setSlippageBps,
    executeSwap,
    isExecuting,
    swapResult,
    swapError,
    clearSwapResult,
    exchangeRate,
    supportedTokens,
  } = useSwap({ keypair: activeKeypair });

  const handleSwap = async () => {
    const result = await executeSwap();
    if (result?.success) {
      console.log("Swap successful:", result.txSignature);
    }
  };

  const handleSlippagePreset = (bps: number) => {
    setSlippageBps(bps);
    setCustomSlippage("");
    setShowSlippageSettings(false);
  };

  const handleCustomSlippage = () => {
    const value = parseFloat(customSlippage);
    if (!isNaN(value) && value > 0 && value <= 5) {
      setSlippageBps(Math.round(value * 100));
      setShowSlippageSettings(false);
    }
  };

  const getMinimumReceived = () => {
    if (!quote) return "0";
    const decimals = getTokenDecimals(outputToken.mintAddress);
    return fromRawAmount(quote.minimumReceived, decimals);
  };

  const getPriceImpactClass = () => {
    if (!quote) return "text-white";
    if (quote.priceImpact > 3) return "text-red-500";
    if (quote.priceImpact > 1) return "text-yellow-500";
    return "text-white";
  };

  const formatNetworkFee = () => {
    if (!quote) return "~0.000005 SOL";
    const feeLamports = BigInt(quote.fees.networkFee);
    const feeSOL = Number(feeLamports) / 1e9;
    return `~${feeSOL.toFixed(6)} SOL`;
  };

  const isSwapDisabled =
    !activeKeypair ||
    !inputAmount ||
    parseFloat(inputAmount) <= 0 ||
    isLoadingQuote ||
    isExecuting ||
    !!quoteError ||
    !!walletError;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-mono text-[#00FF00] uppercase tracking-widest">
            Token Swap
          </h2>
          <button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
          >
            <svg
              className="w-3 h-3 group-hover:text-[#00FF00] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {(slippageBps / 100).toFixed(1)}%
          </button>
        </div>

        {/* Slippage Settings Panel */}
        {showSlippageSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 p-3 bg-black/60 border border-white/10"
          >
            <p className="text-[10px] font-mono text-zinc-400 mb-3 uppercase tracking-wider">
              Slippage Tolerance
            </p>
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                {[10, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => handleSlippagePreset(bps)}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono transition-colors border ${
                      slippageBps === bps
                        ? "bg-[#00FF00]/10 text-[#00FF00] border-[#00FF00]/50"
                        : "bg-black/40 text-zinc-400 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSlippage}
                  onChange={(e) => setCustomSlippage(e.target.value)}
                  placeholder="Custom %"
                  className="flex-1 px-3 py-1.5 text-[10px] font-mono bg-black/40 text-white border border-white/10 outline-none focus:border-[#00FF00]/50 placeholder:text-zinc-600"
                />
                <button
                  onClick={handleCustomSlippage}
                  className="px-4 py-1.5 text-[10px] font-mono bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/50 hover:bg-[#00FF00]/20 whitespace-nowrap"
                >
                  Set
                </button>
              </div>
            </div>
            {slippageBps > 100 && (
              <p className="text-[10px] font-mono text-yellow-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                High slippage may result in unfavorable trades
              </p>
            )}
          </motion.div>
        )}

        {/* Wallet Selector */}
        <div className="mb-6">
          <label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-1.5 block">
            Swap From
          </label>
          <div className="relative">
            <select
              value={
                selectedWalletType === "master"
                  ? "master"
                  : selectedDappWalletId || ""
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === "master") {
                  setSelectedWalletType("master");
                  setSelectedDappWalletId(null);
                } else {
                  setSelectedWalletType("dapp");
                  setSelectedDappWalletId(value);
                }
              }}
              className="w-full appearance-none bg-black/60 border border-white/10 text-white font-mono text-xs px-3 py-2.5 outline-none cursor-pointer focus:border-[#00FF00]/50 transition-colors"
              disabled={isLoadingWallets}
            >
              {keypair && (
                <option value="master" className="bg-black">
                  Master Wallet ({keypair.publicKey.toBase58().slice(0, 4)}...
                  {keypair.publicKey.toBase58().slice(-4)}) -{" "}
                  {(walletBalances["master"] || 0).toFixed(4)} SOL
                </option>
              )}
              {dappWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id} className="bg-black">
                  {wallet.name} ({wallet.publicKey.slice(0, 4)}...
                  {wallet.publicKey.slice(-4)}) -{" "}
                  {(walletBalances[wallet.id] || 0).toFixed(4)} SOL
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          {isLoadingWallets && (
            <p className="text-[10px] font-mono text-zinc-500 mt-1 animate-pulse">
              Loading wallets...
            </p>
          )}
          {walletError && (
            <p className="text-[10px] font-mono text-red-400 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-400 rounded-full" />
              {walletError}
            </p>
          )}
        </div>

        {/* From Token */}
        <div className="space-y-1.5 mb-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            You Pay
          </label>
          <div className="bg-black/60 border border-white/10 p-3 hover:border-white/20 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-white text-xl font-mono outline-none placeholder:text-white/10"
              />
              <div className="relative shrink-0 ml-2">
                <select
                  value={inputToken.symbol}
                  onChange={(e) => {
                    const token = supportedTokens.find(
                      (t) => t.symbol === e.target.value,
                    );
                    if (token) setInputToken(token);
                  }}
                  className="appearance-none bg-zinc-900 border border-white/10 text-white font-mono text-xs pl-3 pr-8 py-1.5 cursor-pointer outline-none hover:border-white/30 transition-colors rounded-none"
                >
                  {supportedTokens.map((token) => (
                    <option
                      key={token.symbol}
                      value={token.symbol}
                      className="bg-zinc-900"
                      disabled={token.symbol === outputToken.symbol}
                    >
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg
                    width="8"
                    height="4"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 text-right">
              Balance:{" "}
              {inputToken.symbol === "SOL"
                ? (
                    (activeKeypair
                      ? walletBalances[
                          selectedWalletType === "master"
                            ? "master"
                            : selectedDappWalletId || ""
                        ]
                      : 0) || 0
                  ).toFixed(4)
                : "0.00"}{" "}
              {inputToken.symbol}
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={switchTokens}
            className="bg-black border border-white/20 p-2 hover:bg-zinc-900 hover:border-[#00FF00]/50 hover:text-[#00FF00] transition-all rounded-full group shadow-lg shadow-black/50"
            aria-label="Swap tokens"
          >
            <svg
              className="w-3 h-3 text-zinc-400 group-hover:text-[#00FF00] transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
          </button>
        </div>

        {/* To Input */}
        <div className="space-y-1.5 mt-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
            You Receive
          </label>

          <div className="bg-black/60 border border-white/10 p-3 hover:border-white/20 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={outputAmount}
                  readOnly
                  placeholder="0.00"
                  className="w-full bg-transparent text-xl font-mono text-[#00FF00] outline-none placeholder:text-zinc-700 cursor-default"
                />
                {isLoadingQuote && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border border-[#00FF00]/30 border-t-[#00FF00] rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="relative shrink-0 ml-2">
                <select
                  value={outputToken.symbol}
                  onChange={(e) => {
                    const token = supportedTokens.find(
                      (t) => t.symbol === e.target.value,
                    );
                    if (token) setOutputToken(token);
                  }}
                  className="appearance-none bg-zinc-900 border border-white/10 text-white font-mono text-xs pl-3 pr-8 py-1.5 cursor-pointer outline-none hover:border-white/30 transition-colors rounded-none"
                >
                  {supportedTokens.map((token) => (
                    <option
                      key={token.symbol}
                      value={token.symbol}
                      className="bg-zinc-900"
                      disabled={token.symbol === inputToken.symbol}
                    >
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg
                    width="8"
                    height="4"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 text-right h-4">
              {/* Spacer for alignment with top input */}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <AnimatePresence>
          {quote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 p-4 bg-black/60 border border-white/5 space-y-2 overflow-hidden"
            >
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-wider">Rate</span>
                <span className="text-zinc-300">
                  1 {inputToken.symbol} ≈ {exchangeRate} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-wider">Min Received</span>
                <span className="text-zinc-300">
                  {getMinimumReceived()} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-wider">Impact</span>
                <span className={getPriceImpactClass()}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-wider">Network Fee</span>
                <span className="text-zinc-300">{formatNetworkFee()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-wider">Route</span>
                <span className="text-zinc-300 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full" />
                  {quote.provider}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Quote / Rate Display */}
        {!quote && !isLoadingQuote && (
          <div className="mt-6 p-4 bg-black/40 border border-white/5">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
              <span className="uppercase tracking-wider">Exchange Rate</span>
              <span className="text-zinc-600 italic">
                Enter amount to see rate
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span className="uppercase tracking-wider">Estimated Fee</span>
              <span className="text-zinc-400">~0.000005 SOL</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {quoteError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-3 bg-red-500/5 border border-red-500/20"
            >
              <p className="text-[10px] font-mono text-red-400">{quoteError}</p>
            </motion.div>
          )}

          {swapError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-3 bg-red-500/5 border border-red-500/20"
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-mono text-red-400">
                  {swapError}
                </p>
                <button
                  onClick={clearSwapResult}
                  className="text-[10px] font-mono text-zinc-500 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {/* Success Display */}
          {swapResult?.success && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-3 bg-[#00FF00]/5 border border-[#00FF00]/20"
            >
              <p className="text-[10px] font-mono text-[#00FF00] mb-2 uppercase tracking-wide">
                Swap Successful
              </p>
              <p className="text-[10px] font-mono text-zinc-400 mb-2">
                Swapped {swapResult.inputSpent} {inputToken.symbol} for{" "}
                {swapResult.outputReceived} {outputToken.symbol}
              </p>
              {swapResult.txSignature && (
                <a
                  href={`https://solscan.io/tx/${swapResult.txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-[#00FF00] hover:underline flex items-center gap-1"
                >
                  View on Solscan
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
              <button
                onClick={clearSwapResult}
                className="text-[10px] font-mono text-zinc-500 mt-3 hover:text-white w-full text-center border-t border-white/5 pt-2"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning for high price impact */}
        {quote && quote.priceImpact > 1 && (
          <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-[10px] font-mono text-yellow-500 flex items-start gap-2">
              <span className="text-lg leading-none">⚠</span>
              {quote.priceImpact > 3
                ? "High price impact! This trade may result in significant losses."
                : "Price impact is higher than usual. Consider reducing your trade size."}
            </p>
          </div>
        )}

        {/* Wallet not connected warning */}
        {!activeKeypair && !walletError && (
          <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-[10px] font-mono text-yellow-500">
              {selectedWalletType === "dapp" && !selectedDappWalletId
                ? "Please select a DApp wallet to swap tokens."
                : "Please connect your wallet to swap tokens."}
            </p>
          </div>
        )}

        {/* Swap Button */}
        <div className="mt-6">
          <CyberButton
            onClick={handleSwap}
            disabled={isSwapDisabled}
            variant="primary"
            fullWidth
          >
            {isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                SWAPPING...
              </span>
            ) : isLoadingQuote ? (
              <span className="flex items-center justify-center gap-2 animate-pulse">
                GETTING QUOTE...
              </span>
            ) : !inputAmount ? (
              "ENTER AMOUNT"
            ) : (
              "EXECUTE SWAP"
            )}
          </CyberButton>
        </div>
      </div>

      {/* Provider info */}
      <div className="py-2 text-center">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
          <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-full shadow-[0_0_5px_#00FF00]" />
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Jupiter Aggregator
          </p>
        </div>
      </div>
    </div>
  );
};
