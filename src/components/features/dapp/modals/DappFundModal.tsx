import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CyberButton } from "../../../common/ui/CyberButton";
import solLogo from "/images/sol-logo.svg";

interface DappFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFund: (amount: number) => Promise<void>;
  availableBalance: number;
  walletName: string;
}

export const DappFundModal = ({
  isOpen,
  onClose,
  onFund,
  availableBalance,
  walletName,
}: DappFundModalProps) => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Reset state when opening
  if (!isOpen && (amount || error || success)) {
    setAmount("");
    setError("");
    setSuccess(false);
    setIsProcessing(false);
  }

  const handleFund = async () => {
    if (!amount) {
      setError("Please enter amount");
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Invalid amount");
      return;
    }

    if (val > availableBalance) {
      setError("Insufficient Veilo balance");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      await onFund(val);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction failed");
    } finally {
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
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-neon-green" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-neon-green" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-neon-green" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-neon-green" />

            <div className="p-6">
              <h2 className="text-xl font-mono text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                Fund Wallet
                <div className="flex-1 h-px bg-white/10" />
              </h2>

              {!success ? (
                <div className="space-y-4">
                  <div className="p-3 bg-zinc-900/40 border border-white/10">
                    <p className="text-xs font-mono text-zinc-400 mb-1">
                      WALLET
                    </p>
                    <p className="text-sm font-mono text-white">{walletName}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Amount (SOL)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.0001"
                        className="w-full bg-zinc-900/50 border border-white/10 text-white pl-3 pr-16 py-2 text-sm font-mono focus:outline-none focus:border-neon-green/50 placeholder:text-zinc-600"
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <img src={solLogo} alt="SOL" className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                      Available: {availableBalance.toFixed(4)} SOL
                    </p>
                  </div>

                  <div className="p-3 bg-neon-green/5 border border-neon-green/20">
                    <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                      This will withdraw SOL from your Veilo balance to fund
                      this dApp wallet.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <CyberButton
                      onClick={onClose}
                      variant="secondary"
                      className="flex-1 text-xs py-2.5"
                      disabled={isProcessing}
                    >
                      CANCEL
                    </CyberButton>
                    <CyberButton
                      onClick={handleFund}
                      variant="primary"
                      className="flex-1 text-xs py-2.5"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "FUNDING..." : "FUND NOW"}
                    </CyberButton>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-neon-green"
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
                  </div>
                  <p className="text-lg font-mono text-neon-green mb-2">
                    SUCCESS
                  </p>
                  <p className="text-sm font-mono text-zinc-400">
                    Wallet funded successfully!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
