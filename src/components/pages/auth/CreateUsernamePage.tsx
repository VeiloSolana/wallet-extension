import { motion } from "framer-motion";
import { useState } from "react";
import { useCheckUsername } from "../../../hooks/queries/useAuthQueries";

interface CreateUsernamePageProps {
  onSubmit: (username: string) => void;
  onBack: () => void;
}

export const CreateUsernamePage = ({
  onSubmit,
  onBack,
}: CreateUsernamePageProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const { mutate: checkUsername, isPending: isChecking } = useCheckUsername();

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

    checkUsername(username, {
      onSuccess: (data) => {
        if (data.available) {
          onSubmit(username);
        } else {
          setError("Username is already taken");
        }
      },
      onError: () => {
        setError("Failed to check username availability");
      },
    });
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
        <h2 className="text-sm font-bold tracking-tight">Create Username</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
            Pick a Handle
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            This will be your unique identity on Veilo. You can use it to
            receive funds securely.
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-400 font-mono mb-2 tracking-widest uppercase">
              USERNAME
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  if (error) setError("");
                }}
                placeholder="username"
                className="w-full bg-zinc-900/60 border border-white/10 rounded-lg pl-7 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors"
                autoFocus
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-[10px] font-mono mt-2"
              >
                {error}
              </motion.p>
            )}
          </div>
        </form>
      </div>

      {/* Submit Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={username.length < 3 || !!error || isChecking}
          className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            {isChecking ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                CHECKING...
              </>
            ) : (
              "NEXT"
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
