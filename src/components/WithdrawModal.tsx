import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CyberButton } from "./CyberButton";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (
    recipient: string,
    amount: number
  ) => Promise<{
    success: boolean;
    withdrawAmount: number;
    changeAmount: number;
    recipient: string;
    spentNoteIds: string[];
    txSignature: string | undefined;
  }>;
  privateBalance: number;
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  onWithdraw,
  privateBalance,
}: WithdrawModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleWithdraw = async () => {
    if (!recipient || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    if (parseFloat(amount) > privateBalance) {
      setError("Insufficient private balance");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Generating Zero-Knowledge Proof...");

      await onWithdraw(recipient, parseFloat(amount));

      setStatus("Withdrawn successfully!");

      // Reset form after delay
      setTimeout(() => {
        setRecipient("");
        setAmount("");
        setStatus("");
        setError("");
        setIsProcessing(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdrawal failed");
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
                  UNSHIELD FUNDS
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

                {/* Error indicator */}
                {error && (
                  <div className="p-2 border border-red-500/30 bg-red-500/10">
                    <p className="text-xs font-mono text-center text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-zinc-900/60 border border-white/10">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-0.5">
                    AVAILABLE SHIELDED
                  </p>
                  <p className="text-sm font-mono text-neon-green">
                    {privateBalance.toFixed(4)} SOL
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    RECIPIENT ADDRESS
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
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
                    onClick={handleWithdraw}
                    variant="primary"
                    fullWidth
                    disabled={!recipient || !amount || isProcessing}
                  >
                    {isProcessing ? "PROCESSING..." : "UNSHIELD"}
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
