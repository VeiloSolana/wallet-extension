import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CyberButton } from "./CyberButton";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapModal = ({ isOpen, onClose }: SwapModalProps) => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock handler
  const handleSwap = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          alert("Swap feature coming soon!");
          onClose();
      }, 1500);
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
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">SWAP TOKENS</h2>
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
                 
                {/* From Token */}
                <div className="p-3 bg-zinc-900/60 border border-white/10">
                     <div className="flex justify-between mb-1">
                        <label className="text-xs text-zinc-400 font-mono tracking-widest">FROM</label>
                        <span className="text-xs text-zinc-500">Balance: 0.0 SOL</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent outline-none text-lg font-mono placeholder-zinc-600"
                        />
                         <span className="font-bold text-white bg-zinc-800 px-2 py-1 rounded border border-white/10 text-xs">SOL</span>
                     </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-black border border-white/20 p-2 rounded-full">
                         <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>

                {/* To Token */}
                 <div className="p-3 bg-zinc-900/60 border border-white/10">
                     <div className="flex justify-between mb-1">
                        <label className="text-xs text-zinc-400 font-mono tracking-widest">TO</label>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={amount ? (parseFloat(amount) * 145).toFixed(2) : ""}
                            readOnly
                            placeholder="0.00"
                            className="w-full bg-transparent outline-none text-lg font-mono placeholder-zinc-600 text-zinc-400"
                        />
                        <span className="font-bold text-white bg-zinc-800 px-2 py-1 rounded border border-white/10 text-xs">USDC</span>
                     </div>
                </div>

                <div className="pt-2">
                     <div className="flex justify-between text-xs text-zinc-500 font-mono mb-4">
                        <span>Rate</span>
                        <span>1 SOL = 145.00 USDC</span>
                     </div>

                    <CyberButton
                        onClick={handleSwap}
                        variant="primary"
                        fullWidth
                        disabled={!amount || isProcessing}
                    >
                        {isProcessing ? "SWAPPING..." : "SWAP"}
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
