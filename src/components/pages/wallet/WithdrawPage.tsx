import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CyberButton } from "../../common/ui/CyberButton";
import { PublicKey } from "@solana/web3.js";
import solLogo from "/images/sol-logo.svg";
import usdcLogo from "/images/usdc-logo.svg";
import usdtLogo from "/images/usdt-logo.svg";

interface WithdrawPageProps {
  onBack: () => void;
  onSend: (address: string, amount: number, token: string) => void;
  tokenBalances?: {
    sol: number;
    usdc: number;
    usdt: number;
    veilo: number;
  };
}

type TransactionPhase = "idle" | "processing" | "success";

export const WithdrawPage = ({
  onBack,
  onSend,
  tokenBalances,
}: WithdrawPageProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [transactionPhase, setTransactionPhase] =
    useState<TransactionPhase>("idle");

  // Debug tokenBalances
  useEffect(() => {
    console.log("WithdrawPage tokenBalances:", tokenBalances);
  }, [tokenBalances]);

  // Verify recipient address when it changes
  useEffect(() => {
    if (!recipient || recipient.trim().length === 0) {
      setAddressValid(null);
      setError("");
      return;
    }

    const verifyAddress = async () => {
      setIsVerifyingAddress(true);
      try {
        new PublicKey(recipient.trim());
        setAddressValid(true);
        setError("");
      } catch {
        setAddressValid(false);
        setError("Invalid Solana address");
      } finally {
        setIsVerifyingAddress(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      verifyAddress();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [recipient]);

  // Auto-clear error messages after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSend = async () => {
    if (!recipient || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("");
      setTransactionPhase("processing");

      await onSend(recipient, parseFloat(amount), selectedToken);

      setTransactionPhase("success");
      setStatus("Transaction completed successfully!");

      // Go back after showing success animation
      setTimeout(() => {
        onBack();
      }, 2500);
    } catch (err) {
      console.error("Send failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      setIsProcessing(false);
      setTransactionPhase("idle");
    }
  };

  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* Header with back button */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-base font-bold tracking-tight">WITHDRAW</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        {/* Corner brackets */}
        <svg
          className="absolute top-4 left-4 w-6 h-6 text-neon-green"
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
          className="absolute top-4 right-4 w-6 h-6 text-neon-green"
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
          className="absolute bottom-4 left-4 w-6 h-6 text-neon-green"
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
          className="absolute bottom-4 right-4 w-6 h-6 text-neon-green"
          viewBox="0 0 24 24"
        >
          <path
            d="M24 24 L24 12 M24 24 L12 24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Processing Overlay */}
        <AnimatePresence>
          {transactionPhase === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
            >
              {/* Animated rings */}
              <div className="relative w-24 h-24">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-neon-green/30"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-green/50"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-transparent border-b-neon-green/70 border-l-neon-green/30"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <svg
                      className="w-8 h-8 text-neon-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>

              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm font-mono text-neon-green tracking-widest">
                  PROCESSING
                </p>
                <motion.div
                  className="flex justify-center gap-1 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-neon-green"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/50 to-transparent"
                animate={{
                  top: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <p className="mt-4 text-xs text-zinc-400 font-mono">
                Sending {amount} {selectedToken}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {transactionPhase === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
            >
              <div className="relative w-28 h-28">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-neon-green/30"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                      scale: [0.8 + i * 0.2, 1.4 + i * 0.2],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeOut",
                    }}
                  />
                ))}

                <motion.div
                  className="absolute inset-2 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  <motion.svg
                    className="w-12 h-12 text-neon-green"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </motion.svg>
                </motion.div>
              </div>

              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.p
                  className="text-lg font-bold text-neon-green tracking-wider"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  SENT!
                </motion.p>
                <motion.p
                  className="mt-2 text-xs text-zinc-400 font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {amount} {selectedToken} transferred successfully
                </motion.p>
              </motion.div>

              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-neon-green"
                  style={{
                    left: "50%",
                    top: "40%",
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: [0, Math.cos((i * Math.PI) / 4) * 60],
                    y: [0, Math.sin((i * Math.PI) / 4) * 60],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.4 + i * 0.05,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form content */}
        <div className="space-y-3 pt-6">
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

          {/* General Error indicator */}
          {error && !error.toLowerCase().includes("invalid solana address") && (
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

          {/* Recipient Address */}
          <div>
            <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
              RECIPIENT ADDRESS
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address"
                disabled={isProcessing}
                className={`w-full px-3 py-2 pr-8 bg-zinc-900/60 border ${
                  addressValid === false
                    ? "border-red-500/50"
                    : addressValid === true
                      ? "border-neon-green/50"
                      : "border-white/10"
                } focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isVerifyingAddress && (
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
                {!isVerifyingAddress && addressValid === true && (
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
                {!isVerifyingAddress && addressValid === false && (
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
            {addressValid === false && error && (
              <p className="mt-1.5 text-xs text-red-400 font-mono">{error}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
              AMOUNT ({selectedToken})
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

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2">
            <CyberButton
              onClick={onBack}
              variant="secondary"
              fullWidth
              disabled={isProcessing}
            >
              CANCEL
            </CyberButton>
            <CyberButton
              onClick={handleSend}
              variant="primary"
              fullWidth
              disabled={
                !recipient ||
                !amount ||
                isProcessing ||
                isVerifyingAddress ||
                addressValid !== true
              }
            >
              {isProcessing ? "PROCESSING..." : "SEND"}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
};
