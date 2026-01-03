import { motion } from "framer-motion";
import { useState } from "react";

interface CreatePasswordPageProps {
  onSubmit: (password: string) => void;
  onBack: () => void;
}

export const CreatePasswordPage = ({ onSubmit, onBack }: CreatePasswordPageProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onSubmit(password);
  };

  return (
    <div className="h-full w-full flex flex-col bg-black relative overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-white/10 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold tracking-tight">Create Password</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            
            <div>
              <h3 className="text-red-400 font-bold text-lg mb-1">
                ⚠️ IMPORTANT WARNING
              </h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                <strong className="text-red-400">If you forget this password, we CANNOT help you recover it.</strong>
                {/* {" "}Your wallet and funds will be permanently inaccessible. There is no password reset or recovery option. */}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 font-mono mb-2 tracking-widest">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password "
                className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 font-mono mb-2 tracking-widest">
              CONFIRM PASSWORD
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm font-mono"
            >
              {error}
            </motion.p>
          )}

          {/* Password Strength Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-500 font-mono">Password Strength</span>
              <span className={`font-mono ${
                password.length < 6 ? "text-red-500" :
                password.length < 10 ? "text-yellow-500" : "text-neon-green"
              }`}>
                {password.length < 6 ? "Weak" : password.length < 10 ? "Medium" : "Strong"}
              </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  password.length < 6 ? "bg-red-500 w-1/4" :
                  password.length < 10 ? "bg-yellow-500 w-2/3" : "bg-neon-green w-full"
                }`}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Submit Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={password.length < 6 || password !== confirmPassword}
          className="w-full py-4 bg-white text-black font-bold text-lg tracking-wide rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neon-green"
        >
          CONTINUE
        </button>
      </div>

      {/* Submit Button */}
    </div>
  );
};
