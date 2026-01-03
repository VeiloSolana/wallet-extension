import { motion } from "framer-motion";

interface WelcomePageProps {
  onGetStarted: () => void;
}

export const WelcomePage = ({ onGetStarted }: WelcomePageProps) => {
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
          className="w-24 h-24 mb-6 relative"
        >
          <div className="absolute inset-0 bg-neon-green/30 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-black border-2 border-neon-green/50 rounded-2xl flex items-center justify-center shadow-neon">
            <img
              src="/images/logo.png"
              alt="Veilo Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold tracking-tight mb-2 text-center"
        >
          Welcome to{" "}
          <span className="text-neon-green text-shadow-neon">VEILO</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-400 text-center text-sm font-mono tracking-wider mb-8"
        >
          Your Privacy-First Solana Wallet
        </motion.p>

       
      {/* Get Started Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="p-6"
      >
        <button
          onClick={onGetStarted}
          className="w-full py-4 z-10 bg-white text-black font-bold text-lg tracking-wide rounded-lg hover:bg-white/90 transition-all shadow-neon hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] active:scale-[0.98]"
        >
          GET STARTED
        </button>
        <p className="text-center text-zinc-600 text-xs mt-3 font-mono">
          Powered by Zero-Knowledge Technology
        </p>
      </motion.div>
      </div>


     
    </div>
  );
};
