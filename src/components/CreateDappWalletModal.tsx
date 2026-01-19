import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateDappWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, fundAmount: string) => void;
  availableBalance: number;
}

export const CreateDappWalletModal = ({
  isOpen,
  onClose,
  onCreate,
  availableBalance,
}: CreateDappWalletModalProps) => {
  const [dappName, setDappName] = useState("");
  const [fundAmount, setFundAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dappName.trim()) {
      onCreate(dappName.trim(), fundAmount);
      setDappName("");
      setFundAmount("");
      onClose();
    }
  };

  const handleClose = () => {
    setDappName("");
    setFundAmount("");
    onClose();
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
            onClick={handleClose}
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
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold tracking-tight">
                  CREATE DAPP WALLET
                </h2>
                <button
                  onClick={handleClose}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dapp Name */}
                <div>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-2">
                    DAPP NAME
                  </p>
                  <input
                    type="text"
                    value={dappName}
                    onChange={(e) => setDappName(e.target.value)}
                    placeholder="e.g. Uniswap, Jupiter"
                    className="w-full bg-zinc-900/60 border border-white/10 px-3 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/40 transition-colors"
                    required
                  />
                </div>

                {/* Fund Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                      FUND AMOUNT (OPTIONAL)
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Available: {availableBalance.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={fundAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setFundAmount(value);
                        }
                      }}
                      placeholder="0.0"
                      className="w-full bg-zinc-900/60 border border-white/10 px-3 py-2.5 pr-14 text-sm font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/40 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-400">
                      SOL
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                    Leave empty to create unfunded wallet
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 bg-zinc-900/60 border border-white/10 text-white font-mono text-xs uppercase tracking-wider hover:bg-zinc-800/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!dappName.trim()}
                    className="flex-1 px-4 py-2.5 bg-white text-black font-mono text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
