import { motion, AnimatePresence } from "framer-motion";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

const DEPOSIT_DAPP_URL = "http://localhost:3000/deposit"; // TODO: Update with actual dapp URL

export const DepositModal = ({
  isOpen,
  onClose,
  username,
}: DepositModalProps) => {
  const handleOpenDepositDapp = () => {
    // Open deposit dapp in new tab with username parameter
    const url = username
      ? `${DEPOSIT_DAPP_URL}?username=${encodeURIComponent(username)}`
      : DEPOSIT_DAPP_URL;
    window.open(url, "_blank");
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
                  DEPOSIT FUNDS
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

              <div className="space-y-2.5">
                {/* Info Box */}
                <div className="p-2.5 bg-zinc-900/60 border border-neon-green/20">
                  <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                    Use our deposit dapp to add SOL privately to your shielded
                    balance.
                  </p>
                </div>

                {/* Username Display */}
                {username && (
                  <div className="p-2 bg-zinc-900/60 border border-white/10">
                    <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-0.5">
                      USERNAME
                    </p>
                    <p className="text-xs font-mono text-neon-green">
                      @{username}
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                    STEPS:
                  </p>
                  <div className="space-y-1 text-xs font-mono text-zinc-500 leading-snug">
                    <div className="flex gap-1.5">
                      <span className="text-neon-green">1.</span>
                      <span>Open deposit dapp</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-neon-green">2.</span>
                      <span>Enter amount & confirm</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-neon-green">3.</span>
                      <span>Funds appear as private notes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={handleOpenDepositDapp}
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-bold text-neon-green border border-neon-green hover:border-neon-green/80 hover:text-neon-green/80 transition-colors"
                  >
                    OPEN DAPP
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
