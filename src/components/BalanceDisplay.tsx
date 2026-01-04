import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface BalanceDisplayProps {
  balance: number;
  onSend?: () => void;
  onReceive?: () => void;
}

export const BalanceDisplay = ({
  balance,
  onSend,
  onReceive,
}: BalanceDisplayProps) => {
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayBalance(balance);
    }, 100);
    return () => clearTimeout(timer);
  }, [balance]);

  return (
    <div className="px-4 py-3 bg-black/40 border-b border-white/10">
      {/* Privacy Wallet Label - Copiable */}

      {/* Balance and Send/Receive Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        {/* Balance */}
        <div>
          <div className="text-3xl font-light tracking-tight">
            {displayBalance.toFixed(4)}
            <span className="text-neon-green ml-1 text-xl">SOL</span>
          </div>
          <div className="text-xs text-zinc-500">
            ≈ ${(displayBalance * 100).toFixed(2)} USD
          </div>
        </div>

        {/* Send/Receive Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSend}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
          >
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
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {/* <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">SEND</span> */}
          </button>
          <button
            onClick={onReceive}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
          >
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
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            {/* <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">RECEIVE</span> */}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
