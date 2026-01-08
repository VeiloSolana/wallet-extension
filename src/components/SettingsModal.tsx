import { motion, AnimatePresence } from "framer-motion";
import { CyberButton } from "./CyberButton";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  address,
}: SettingsModalProps) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);

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

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">SETTINGS</h2>
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

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-mono tracking-widest">
                    NETWORK
                  </p>
                  <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-white/10">
                    <span className="text-sm">Solana Devnet</span>
                    <span className="w-2 h-2 rounded-full bg-neon-green shadow-neon-sm"></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-mono tracking-widest">
                    WALLET ADDRESS
                  </p>
                  <div className="p-3 bg-zinc-900/60 border border-white/10 break-all text-xs font-mono text-zinc-300">
                    {address}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 font-mono tracking-widest">
                    PRIVATE KEY
                  </p>
                  {showPrivateKey ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 break-all text-xs font-mono text-white">
                      {getPrivateKey()}
                      <p className="text-red-400 mt-2 text-[10px]">
                        ⚠️ NEVER SHARE THIS KEY
                      </p>
                    </div>
                  ) : (
                    <CyberButton
                      onClick={() => setShowPrivateKey(true)}
                      variant="secondary"
                      fullWidth
                      className="text-xs py-2"
                    >
                      REVEAL PRIVATE KEY
                    </CyberButton>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-xs text-zinc-500 text-center">
                    Version 0.1.0 Beta
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
