import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface BalanceDisplayProps {
  balance: number;
  address: string;
}

export const BalanceDisplay = ({ balance, address }: BalanceDisplayProps) => {
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayBalance(balance);
    }, 100);
    return () => clearTimeout(timer);
  }, [balance]);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="p-6 bg-black/40 border-b border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 font-mono tracking-widest">
          BALANCE
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-zinc-400 font-mono">SOL</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="text-4xl font-light tracking-tight mb-1">
          {displayBalance.toFixed(4)}
          <span className="text-neon-green ml-2 text-2xl">SOL</span>
        </div>
        <div className="text-sm text-zinc-400">
          ≈ ${(displayBalance * 100).toFixed(2)} USD
        </div>
      </motion.div>

      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-white/10 rounded">
        <span className="text-xs font-mono text-zinc-400 flex-1">
          {shortenAddress(address)}
        </span>
        <button
          className="text-zinc-500 hover:text-white transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(address);
            const btn = document.getElementById("copy-feedback");
            if(btn) {
               btn.style.opacity = "1";
               setTimeout(() => btn.style.opacity = "0", 1500);
            }
          }}
          title="Copy Address"
        >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
           </svg>
           <span id="copy-feedback" className="absolute -top-8 right-0 bg-neon-green text-black text-[10px] px-2 py-1 rounded opacity-0 transition-opacity pointer-events-none font-bold">COPIED!</span>
        </button>
      </div>
    </div>
  );
};
