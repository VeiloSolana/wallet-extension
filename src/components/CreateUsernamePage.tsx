import { motion } from "framer-motion";
import { useState } from "react";

interface CreateUsernamePageProps {
  onSubmit: (username: string) => void;
  onBack: () => void;
}

export const CreateUsernamePage = ({ onSubmit, onBack }: CreateUsernamePageProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setIsChecking(true);

    // Simulate availability check
    setTimeout(() => {
      setIsChecking(false);
      // For demo, all usernames are available
      onSubmit(username);
    }, 800);
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
        <h2 className="text-lg font-bold tracking-tight">Create Username</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <h3 className="text-2xl font-bold text-white mb-2">Pick a Handle</h3>
            <p className="text-zinc-400 text-sm">
                This will be your unique identity on Veilo. You can use it to receive funds securely.
            </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 font-mono mb-2 tracking-widest">
              USERNAME
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="w-full bg-zinc-900/60 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
                autoFocus
              />
            </div>
            {error && (
                <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-mono mt-2"
                >
                {error}
                </motion.p>
            )}
          </div>

            {username.length >= 3 && !error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 text-neon-green text-xs font-mono bg-neon-green/10 p-3 rounded border border-neon-green/30"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>@{username} is available!</span>
                </motion.div>
            )}

        </form>
      </div>

      {/* Submit Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={username.length < 3 || !!error || isChecking}
          className="w-full py-4 bg-white text-black font-bold text-lg tracking-wide rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neon-green flex items-center justify-center gap-2"
        >
          {isChecking ? (
             <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                CHECKING...
             </>
          ) : (
              "NEXT"
          )}
        </button>
      </div>
    </div>
  );
};
