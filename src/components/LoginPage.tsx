import { motion } from "framer-motion";
import { useState } from "react";
// import { clearWallet } from "../utils/storage";

interface LoginPageProps {
  onLogin: (password: string) => void;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

export const LoginPage = ({ onLogin, error, setError }: LoginPageProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    // Call the parent handler, which might throw or return
    // We should ideally wrap this in a try/catch if onLogin is async and propagates errors
    try {
      await onLogin(password);
      // If successful, the parent app will likely unmount this component (switch view)
      // So we don't necessarily need to set isLoading(false) unless it fails without unmounting
    } catch (e) {
      // If login failed (thrown error)
      setIsLoading(false);
    }
    // Note: The App.tsx handleLogin currently catches errors and sets error state passed down props.
    // So 'onLogin' likely finishes. If it failed, we want to stop loading.
    setIsLoading(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-neon-green/10 rounded-full blur-[80px]" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 mb-6 relative"
        >
          <div className="absolute inset-0 bg-neon-green/20 rounded-2xl blur-xl" />
          <div className="relative w-full h-full bg-black border-2 border-neon-green/30 rounded-2xl flex items-center justify-center">
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
              className="w-14 h-14 object-contain"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-bold tracking-tight mb-1"
        >
          Welcome Back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-[10px] font-mono mb-6 tracking-widest uppercase"
        >
          Enter Password to Unlock
        </motion.p>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xs space-y-4"
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm font-mono text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  UNLOCKING...
                </>
              ) : (
                "UNLOCK"
              )}
            </span>
          </button>
        </motion.form>

        {/* Forgot Password */}
        {/* Forgot Password */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-zinc-600 text-xs font-mono">Forgot password?</p>
          <p className="text-zinc-500 text-xs mt-1">
            Sorry, there is no recovery option.
          </p>

          {/* <button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure you want to reset everything? This will delete your wallet."
                )
              ) {
                await clearWallet();
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="mt-8 text-red-500 text-xs hover:text-red-400 transition-colors underline block w-full"
          >
            [DEV] Reset Wallet
          </button> */}
        </motion.div>
      </div>

      {/* Bottom decoration */}
      <div className="h-px bg-linear-to-r from-transparent via-neon-green/30 to-transparent" />
    </div>
  );
};
