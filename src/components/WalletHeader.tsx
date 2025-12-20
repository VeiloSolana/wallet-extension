import { motion } from "framer-motion";

export const WalletHeader = () => {
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
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
              PRIVACY WALLET
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-neon-green"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs text-zinc-400 font-mono">ONLINE</span>
        </div>
      </div>
    </div>
  );
};
