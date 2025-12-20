import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CyberButton } from "./CyberButton";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (address: string, amount: number) => void;
}

export const SendModal = ({ isOpen, onClose, onSend }: SendModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSend = async () => {
    if (!recipient || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Processing transaction...");

      // Call parent handler which contains the full withdrawal logic
      await onSend(recipient, parseFloat(amount));

      setStatus("Transaction completed successfully!");

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
      console.error("Send failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-black border border-white/20 z-50 max-w-md mx-auto"
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

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">SEND SOL</h2>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Status indicator */}
                {status && (
                  <div
                    className={`p-3 border ${
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
                  <div className="p-3 border border-red-500/30 bg-red-500/10">
                    <p className="text-xs font-mono text-center text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-400 font-mono tracking-widest mb-2">
                    RECIPIENT ADDRESS
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address"
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-sm font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 font-mono tracking-widest mb-2">
                    AMOUNT (SOL)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-sm font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <CyberButton
                    onClick={onClose}
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
                    disabled={!recipient || !amount || isProcessing}
                  >
                    {isProcessing ? "PROCESSING..." : "SEND"}
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
