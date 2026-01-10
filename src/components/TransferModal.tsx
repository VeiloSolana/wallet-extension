import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CyberButton } from "./CyberButton";
import { getVeiloPublicKey } from "../lib/relayerApi";
import solLogo from "/images/sol-logo.svg";
import usdcLogo from "/images/usdc-logo.svg";
import usdtLogo from "/images/usdt-logo.svg";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (username: string, amount: number, token: string) => Promise<any>;
  tokenBalances?: {
    sol: number;
    usdc: number;
    usdt: number;
    veilo: number;
  };
}

export const TransferModal = ({
  isOpen,
  onClose,
  onTransfer,
  tokenBalances,
}: TransferModalProps) => {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isVerifyingUsername, setIsVerifyingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [selectedToken, setSelectedToken] = useState("SOL");

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setAmount("");
      setStatus("");
      setError("");
      setIsProcessing(false);
      setIsVerifyingUsername(false);
      setUsernameValid(null);
      setSelectedToken("SOL");
    }
  }, [isOpen]);

  // Verify username when it changes
  useEffect(() => {
    if (!username || username.trim().length === 0) {
      setUsernameValid(null);
      setError("");
      return;
    }

    const verifyUsername = async () => {
      setIsVerifyingUsername(true);
      try {
        await getVeiloPublicKey(username.trim());
        setUsernameValid(true);
        setError("");
      } catch (err) {
        setUsernameValid(false);
        setError(err instanceof Error ? err.message : "User not found");
      } finally {
        setIsVerifyingUsername(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      verifyUsername();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [username]);

  // Auto-clear error messages after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleTransfer = async () => {
    if (!username || !amount) {
      setError("Please enter recipient username and amount");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Processing private transfer...");

      // Call parent handler which contains the full transfer logic
      await onTransfer(username, parseFloat(amount), selectedToken);

      setStatus("Transfer completed successfully!");

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Transfer failed:", err);
      setError(err instanceof Error ? err.message : "Transfer failed");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-black border border-white/10 shadow-lg shadow-neon-green/5 z-50 max-w-md mx-auto"
          >
            {/* Corner brackets */}
            <svg
              className="absolute top-0 left-0 w-6 h-6 text-neon-green"
              viewBox="0 0 24 24"
            >
              <path
                d="M0 0 L0 12 M0 0 L12 0"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <svg
              className="absolute top-0 right-0 w-6 h-6 text-neon-green"
              viewBox="0 0 24 24"
            >
              <path
                d="M24 0 L24 12 M24 0 L12 0"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <svg
              className="absolute bottom-0 left-0 w-6 h-6 text-neon-green"
              viewBox="0 0 24 24"
            >
              <path
                d="M0 24 L0 12 M0 24 L12 24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <svg
              className="absolute bottom-0 right-0 w-6 h-6 text-neon-green"
              viewBox="0 0 24 24"
            >
              <path
                d="M24 24 L24 12 M24 24 L12 24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold tracking-tight">
                  PRIVATE TRANSFER
                </h2>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Status indicator */}
                {status && (
                  <div
                    className={`p-2 border ${
                      isProcessing
                        ? "border-neon-green/30 bg-neon-green/10"
                        : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <p className="text-xs font-mono text-center">{status}</p>
                  </div>
                )}

                {/* General Error indicator (not user not found) */}
                {error && !error.toLowerCase().includes("user not found") && (
                  <div className="p-2 border border-red-500/30 bg-red-500/10">
                    <p className="text-xs font-mono text-center text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Available Balance Display */}
                <div className="p-2.5 bg-zinc-900/60 border border-white/10">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-0.5">
                    AVAILABLE SHIELDED
                  </p>
                  <p className="text-sm font-mono text-neon-green">
                    {(selectedToken === "SOL"
                      ? tokenBalances?.sol || 0
                      : selectedToken === "USDC"
                      ? tokenBalances?.usdc || 0
                      : selectedToken === "USDT"
                      ? tokenBalances?.usdt || 0
                      : tokenBalances?.veilo || 0
                    ).toFixed(4)}{" "}
                    {selectedToken}
                  </p>
                </div>

                {/* Token Selector */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    SELECT TOKEN
                  </label>
                  <div className="relative">
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 pl-10 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="SOL">SOL - Solana</option>
                      <option value="USDC">USDC - USD Coin</option>
                      <option value="USDT">USDT - Tether</option>
                      <option value="VEILO">VEILO - Veilo Token</option>
                    </select>
                    {/* Token Icon */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {selectedToken === "SOL" && (
                        <img src={solLogo} alt="SOL" className="w-4 h-4" />
                      )}
                      {selectedToken === "USDC" && (
                        <img src={usdcLogo} alt="USDC" className="w-4 h-4" />
                      )}
                      {selectedToken === "USDT" && (
                        <img src={usdtLogo} alt="USDT" className="w-4 h-4" />
                      )}
                      {selectedToken === "VEILO" && (
                        <div className="w-4 h-4 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-neon-green">
                            V
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    VEILO USERNAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@ss"
                      disabled={isProcessing}
                      className={`w-full px-3 py-2 pr-8 bg-zinc-900/60 border ${
                        usernameValid === false
                          ? "border-red-500/50"
                          : usernameValid === true
                          ? "border-neon-green/50"
                          : "border-white/10"
                      } focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    {/* Validation indicator */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {isVerifyingUsername && (
                        <svg
                          className="w-4 h-4 text-zinc-400 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      {!isVerifyingUsername && usernameValid === true && (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {!isVerifyingUsername && usernameValid === false && (
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  {usernameValid === false && error && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">
                      {error}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    AMOUNT (SOL)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <CyberButton
                    onClick={onClose}
                    variant="secondary"
                    fullWidth
                    disabled={isProcessing}
                  >
                    CANCEL
                  </CyberButton>
                  <CyberButton
                    onClick={handleTransfer}
                    variant="primary"
                    fullWidth
                    disabled={
                      !username ||
                      !amount ||
                      isProcessing ||
                      isVerifyingUsername ||
                      usernameValid !== true
                    }
                  >
                    {isProcessing ? "PROCESSING..." : "TRANSFER"}
                  </CyberButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
