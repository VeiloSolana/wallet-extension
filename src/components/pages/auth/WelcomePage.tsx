import { motion } from "framer-motion";

interface WelcomePageProps {
  onGetStarted: () => void;
  onRestore: () => void;
}

export const WelcomePage = ({ onGetStarted, onRestore }: WelcomePageProps) => {
  return (
    <div className="h-full w-full flex flex-col bg-black relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Glowing orb effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon-green/20 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-16 h-16 mb-4 relative"
        >
          <div className="absolute inset-0 bg-neon-green/30 rounded-xl blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-black border-2 border-neon-green/50 rounded-xl flex items-center justify-center shadow-neon">
            {/* Corner brackets */}
            <svg
              className="absolute top-0 left-0 w-4 h-4 text-neon-green"
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
              className="absolute top-0 right-0 w-4 h-4 text-neon-green"
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
              className="absolute bottom-0 left-0 w-4 h-4 text-neon-green"
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
              className="absolute bottom-0 right-0 w-4 h-4 text-neon-green"
              viewBox="0 0 24 24"
            >
              <path
                d="M24 24 L24 12 M24 24 L12 24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <img
              src="/images/logo.png"
              alt="Veilo Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold tracking-tight mb-2 text-center"
        >
          Welcome to{" "}
          <span className="text-neon-green text-shadow-neon">VEILO</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-400 text-center text-xs font-mono tracking-widest uppercase mb-6"
        >
          A Secure Solana Wallet
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="p-6 w-full space-y-3"
        >
          <button
            onClick={onGetStarted}
            className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all shadow-neon hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">CREATE ACCOUNT</span>
          </button>

          <button
            onClick={onRestore}
            className="relative overflow-hidden group w-full py-3 bg-transparent border border-white/20 text-white font-bold text-sm tracking-wide rounded-lg transition-all hover:border-neon-green/50 hover:bg-white/5 active:scale-[0.98]"
          >
            <span className="relative z-10">RESTORE ACCOUNT</span>
          </button>

          <p className="text-center text-zinc-600 text-[10px] mt-2 font-mono tracking-widest uppercase">
            Powered by Zero-Knowledge Technology
          </p>
        </motion.div>
      </div>
    </div>
  );
};
