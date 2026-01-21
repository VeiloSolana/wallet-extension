import { useState, useEffect } from "react";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { CyberButton } from "./CyberButton";
import { useSwap } from "../hooks/useSwap";
import { fromRawAmount, getTokenDecimals } from "../lib/swap";
import { getDappWallets, type DappWallet } from "../utils/dappWalletStorage";
import { decrypt } from "../utils/encryption";

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
        const connection = new Connection(
          "https://api.mainnet-beta.solana.com",
          "confirmed",
        );
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
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="space-y-4">
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-mono text-[#00FF00] uppercase tracking-widest">
              Token Swap
            </h2>
            <button
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
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
            <div className="mb-6 p-3 bg-black/60 border border-white/10">
              <p className="text-xs font-mono text-zinc-400 mb-3 uppercase tracking-wider">
                Slippage Tolerance
              </p>
              <div className="flex gap-2 mb-3">
                {[10, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => handleSlippagePreset(bps)}
                    className={`px-3 py-1 text-xs font-mono transition-colors ${
                      slippageBps === bps
                        ? "bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/50"
                        : "bg-black/40 text-zinc-400 border border-white/10 hover:border-white/30"
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(e.target.value)}
                    placeholder="Custom"
                    className="flex-1 px-2 py-1 text-xs font-mono bg-black/40 text-white border border-white/10 outline-none focus:border-[#00FF00]/50"
                  />
                  <button
                    onClick={handleCustomSlippage}
                    className="px-2 py-1 text-xs font-mono bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/50"
                  >
                    Set
                  </button>
                </div>
              </div>
              {slippageBps > 100 && (
                <p className="text-xs font-mono text-yellow-500">
                  High slippage may result in unfavorable trades
                </p>
              )}
            </div>
          )}

          {/* Wallet Selector */}
          <div className="mb-6">
            <label className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mb-2 block">
              Swap From Wallet
            </label>
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
              className="w-full bg-zinc-900/60 border border-white/10 text-white font-mono text-sm p-2 outline-none cursor-pointer focus:border-[#00FF00]/50 transition-colors"
              style={{ color: "white" }}
              disabled={isLoadingWallets}
            >
              {keypair && (
                <option value="master" style={{ background: "black" }}>
                  Master Wallet ({keypair.publicKey.toBase58().slice(0, 4)}...
                  {keypair.publicKey.toBase58().slice(-4)}) -{" "}
                  {(walletBalances["master"] || 0).toFixed(4)} SOL
                </option>
              )}
              {dappWallets.map((wallet) => (
                <option
                  key={wallet.id}
                  value={wallet.id}
                  style={{ background: "black" }}
                >
                  {wallet.name} ({wallet.publicKey.slice(0, 4)}...
                  {wallet.publicKey.slice(-4)}) -{" "}
                  {(walletBalances[wallet.id] || 0).toFixed(4)} SOL
                </option>
              ))}
            </select>
            {isLoadingWallets && (
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Loading wallets...
              </p>
            )}
            {walletError && (
              <p className="text-xs font-mono text-red-400 mt-1">
                {walletError}
              </p>
            )}
          </div>

          {/* From Token */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              From
            </label>
            <div className="bg-black/80 p-4">
              <div className="flex justify-between items-center mb-3">
                <select
                  value={inputToken.symbol}
                  onChange={(e) => {
                    const token = supportedTokens.find(
                      (t) => t.symbol === e.target.value,
                    );
                    if (token) setInputToken(token);
                  }}
                  className="bg-transparent text-white font-mono text-sm border-none outline-none cursor-pointer"
                  style={{ color: "white" }}
                >
                  {supportedTokens.map((token) => (
                    <option
                      key={token.symbol}
                      value={token.symbol}
                      style={{ background: "black" }}
                      disabled={token.symbol === outputToken.symbol}
                    >
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-mono outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={switchTokens}
              className="bg-black/80 p-2 transition-colors hover:bg-black/60 border border-white/10"
              aria-label="Swap tokens"
            >
              <svg
                className="w-4 h-4 text-white"
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
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
              Receive
            </label>

            <div className="bg-black/60 border border-white/10 p-3 hover:border-white/30 transition-colors flex items-center gap-3">
              <input
                type="number"
                value={outputAmount}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-mono text-zinc-400 outline-none placeholder:text-zinc-700 cursor-default"
              />
              <div className="h-8 w-[1px] bg-white/10" />
              <select
                value={outputToken.symbol}
                onChange={(e) => {
                  const token = supportedTokens.find(
                    (t) => t.symbol === e.target.value,
                  );
                  if (token) setOutputToken(token);
                }}
                className="bg-transparent text-white font-mono text-sm border-none outline-none cursor-pointer"
                style={{ color: "white" }}
              >
                {supportedTokens.map((token) => (
                  <option
                    key={token.symbol}
                    value={token.symbol}
                    style={{ background: "black" }}
                    disabled={token.symbol === inputToken.symbol}
                  >
                    {token.symbol}
                  </option>
                ))}
              </select>
              {isLoadingQuote && (
                <div className="w-4 h-4 border border-[#00FF00]/30 border-t-[#00FF00] rounded-full animate-spin" />
              )}
            </div>
            <div className="w-full text-white text-2xl font-mono">
              {isLoadingQuote ? (
                <span className="text-white/20">Loading...</span>
              ) : outputAmount ? (
                outputAmount
              ) : (
                <span className="text-white/20">0.0</span>
              )}
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="mt-6 p-4 bg-black/80 space-y-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">Exchange Rate</span>
                <span className="text-white">
                  1 {inputToken.symbol} = {exchangeRate} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">
                  Minimum Received
                </span>
                <span className="text-white">
                  {getMinimumReceived()} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">Price Impact</span>
                <span className={getPriceImpactClass()}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">Network Fee</span>
                <span className="text-white">{formatNetworkFee()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">Route</span>
                <span className="text-white capitalize">{quote.provider}</span>
              </div>
            </div>
          )}

          {/* No Quote / Rate Display */}
          {!quote && !isLoadingQuote && (
            <div className="mt-6 p-4 bg-black/80">
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                <span className="uppercase tracking-wider">Exchange Rate</span>
                <span className="text-white/40">Enter amount to see rate</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="uppercase tracking-wider">Network Fee</span>
                <span className="text-white">~0.000005 SOL</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {quoteError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-mono text-red-400">{quoteError}</p>
            </div>
          )}

          {swapError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-mono text-red-400">{swapError}</p>
              <button
                onClick={clearSwapResult}
                className="text-xs font-mono text-zinc-400 mt-2 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Success Display */}
          {swapResult?.success && (
            <div className="mt-4 p-3 bg-[#00FF00]/10 border border-[#00FF00]/30">
              <p className="text-xs font-mono text-[#00FF00] mb-2">
                Swap successful!
              </p>
              <p className="text-xs font-mono text-zinc-400">
                Swapped {swapResult.inputSpent} {inputToken.symbol} for{" "}
                {swapResult.outputReceived} {outputToken.symbol}
              </p>
              {swapResult.txSignature && (
                <a
                  href={`https://solscan.io/tx/${swapResult.txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#00FF00] hover:underline block mt-2"
                >
                  View on Solscan
                </a>
              )}
              <button
                onClick={clearSwapResult}
                className="text-xs font-mono text-zinc-400 mt-2 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Warning for high price impact */}
          {quote && quote.priceImpact > 1 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs font-mono text-yellow-400">
                {quote.priceImpact > 3
                  ? "High price impact! This trade may result in significant losses."
                  : "Price impact is higher than usual. Consider reducing your trade size."}
              </p>
            </div>
          )}

          {/* Wallet not connected warning */}
          {!activeKeypair && !walletError && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs font-mono text-yellow-400">
                {selectedWalletType === "dapp" && !selectedDappWalletId
                  ? "Please select a DApp wallet to swap tokens."
                  : "Please connect your wallet to swap tokens."}
              </p>
            </div>
          )}

          {/* Swap Button */}
          <div className="mt-6">
            <CyberButton onClick={handleSwap} disabled={isSwapDisabled}>
              {isExecuting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border border-black/30 border-t-black rounded-full animate-spin" />
                  Executing Swap...
                </span>
              ) : isLoadingQuote ? (
                "Getting Quote..."
              ) : (
                "Execute Swap"
              )}
            </CyberButton>
          </div>

          <CyberButton onClick={handleSwap} disabled={!inputAmount} fullWidth>
            EXECUTE SWAP
          </CyberButton>
        </div>

        {/* Provider info */}
        <div className="bg-black/40 backdrop-blur-md p-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#00FF00]" />
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Powered by Jupiter Aggregator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
