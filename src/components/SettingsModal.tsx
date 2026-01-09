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
                <h2 className="text-base font-bold tracking-tight">SETTINGS</h2>
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

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                    NETWORK
                  </p>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-white/10">
                    <span className="text-xs">Solana Devnet</span>
                    <span className="w-2 h-2 rounded-full bg-neon-green shadow-neon-sm"></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                    WALLET ADDRESS
                  </p>
                  <div className="p-2.5 bg-zinc-900/60 border border-white/10 break-all text-[10px] font-mono text-zinc-300">
                    {address}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                    PRIVATE KEY
                  </p>
                  {showPrivateKey ? (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 break-all text-[10px] font-mono text-white">
                      Private key export not yet implemented
                      <p className="text-red-400 mt-1.5 text-[9px]">
                        ⚠️ NEVER SHARE THIS KEY
                      </p>
                    </div>
                  ) : (
                    <CyberButton
                      onClick={() => setShowPrivateKey(true)}
                      variant="secondary"
                      fullWidth
                      className="text-xs py-1.5"
                    >
                      REVEAL PRIVATE KEY
                    </CyberButton>
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-zinc-500 text-center">
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
