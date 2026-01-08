import { motion } from "framer-motion";
import { useState } from "react";

interface CreatePasswordPageProps {
  onSubmit: (password: string) => void;
  onBack: () => void;
}

export const CreatePasswordPage = ({
  onSubmit,
  onBack,
}: CreatePasswordPageProps) => {
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-sm font-bold tracking-tight">Create Password</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/30 rounded-lg p-4 mb-4 overflow-hidden"
        >
          {/* Animated scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent animate-pulse" />

          {/* Corner brackets */}
          <svg
            className="absolute top-0 left-0 w-3 h-3 text-red-500"
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
            className="absolute top-0 right-0 w-3 h-3 text-red-500"
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
            className="absolute bottom-0 left-0 w-3 h-3 text-red-500"
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
            className="absolute bottom-0 right-0 w-3 h-3 text-red-500"
            viewBox="0 0 24 24"
          >
            <path
              d="M24 24 L24 12 M24 24 L12 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div className="relative flex items-start gap-3">
            {/* Warning Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-mono text-[10px] tracking-widest uppercase">
                  SECURITY ALERT
                </span>
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  <span
                    className="w-1 h-1 rounded-full bg-red-500 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-red-500 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
              <p className="text-red-200 text-xs leading-relaxed font-medium">
                No recovery possible if password is lost. This cannot be reset
                or recovered by anyone.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-400 font-mono mb-2 tracking-widest uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password "
                className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
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
                    className="w-4 h-4"
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
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 font-mono mb-2 tracking-widest uppercase">
              CONFIRM PASSWORD
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-[10px] font-mono"
            >
              {error}
            </motion.p>
          )}

          {/* Password Strength Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-zinc-500 font-mono uppercase tracking-widest">
                Password Strength
              </span>
              <span
                className={`font-mono font-bold ${
                  password.length < 6
                    ? "text-red-500"
                    : password.length < 10
                    ? "text-yellow-500"
                    : "text-neon-green"
                }`}
              >
                {password.length < 6
                  ? "WEAK"
                  : password.length < 10
                  ? "MEDIUM"
                  : "STRONG"}
              </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  password.length < 6
                    ? "bg-red-500 w-1/4"
                    : password.length < 10
                    ? "bg-yellow-500 w-2/3"
                    : "bg-neon-green w-full"
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
          className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10">CONTINUE</span>
        </button>
      </div>
    </div>
  );
};
