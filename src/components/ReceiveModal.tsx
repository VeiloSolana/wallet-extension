import { motion, AnimatePresence } from "framer-motion";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export const ReceiveModal = ({
  isOpen,
  onClose,
  address,
}: ReceiveModalProps) => {
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
                <h2 className="text-xl font-bold tracking-tight">
                  RECEIVE SOL
                </h2>
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

              <div className="text-center">
                <div className="mb-6 p-6 bg-white inline-block">
                  {/* Placeholder for QR code - in real implementation, use a QR library */}
                  <div className="w-48 h-48 bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-mono">
                      QR CODE
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 font-mono tracking-widest">
                    YOUR WALLET ADDRESS
                  </p>
                  <div className="p-4 bg-zinc-900/60 border border-white/10">
                    <p className="text-sm font-mono break-all text-zinc-300">
                      {address}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="w-full py-3 bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-colors font-mono text-sm"
                  >
                    COPY ADDRESS
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
