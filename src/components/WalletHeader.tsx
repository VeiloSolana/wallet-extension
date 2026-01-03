import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WalletHeaderProps {
  onSettings?: () => void;
  address?: string;
}

export const WalletHeader = ({ onSettings,address }: WalletHeaderProps) => {
   const [copied, setCopied] = useState(false);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setCopied(true);
      }, 100);
      return () => clearTimeout(timer);
    }, [address]);
  
    const handleCopyAddress = () => {
      if (address) {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    };

    const shortenAddress = (addr: string) => {
      if (!addr) return '';
      return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

  return (
    <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Veilo Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>

          <h1 className="text-lg font-bold tracking-tight">VEILO</h1>
           <div
          onClick={handleCopyAddress}
          className="flex items-center gap-2   rounded-full hover:border-neon-green/50 transition-all group relative"
          title="Click to copy wallet address"
        >
          
          <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
            {shortenAddress(address || '')}
          </span>
          <svg className="w-3 h-3 text-zinc-500 group-hover:text-neon-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
         
        </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
         
          
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 rounded-full bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all"
              title="Settings"
            >
              <svg className="w-4 h-4 text-zinc-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
