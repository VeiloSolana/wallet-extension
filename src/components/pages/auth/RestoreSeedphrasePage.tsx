import { motion } from "framer-motion";
import { useState } from "react";
import * as bip39 from "bip39";

interface RestoreSeedphrasePageProps {
  onSubmit: (seedphrase: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RestoreSeedphrasePage = ({
  onSubmit,
  onBack,
  isLoading = false,
  error: externalError,
}: RestoreSeedphrasePageProps) => {
  const [seedphrase, setSeedphrase] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedPhrase = seedphrase.trim().toLowerCase();
    const words = trimmedPhrase.split(/\s+/);

    // Validate word count
    if (words.length !== 12) {
      setError("Please enter exactly 12 words");
      return;
    }

    // Validate BIP39 mnemonic
    if (!bip39.validateMnemonic(trimmedPhrase)) {
      setError("Invalid seed phrase. Please check your words and try again.");
      return;
    }

    onSubmit(trimmedPhrase);
  };

  const displayError = externalError || error;

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
        <h2 className="text-sm font-bold tracking-tight">Restore Account</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
            Enter Your Seed Phrase
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Enter your 12-word recovery phrase to restore your wallet. Make sure
            to enter the words in the correct order.
          </p>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-4 mb-4 overflow-hidden"
        >
          {/* Animated scanline */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent animate-pulse" />

          {/* Corner brackets */}
          <svg
            className="absolute top-0 left-0 w-3 h-3 text-blue-500"
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
            className="absolute top-0 right-0 w-3 h-3 text-blue-500"
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
            className="absolute bottom-0 left-0 w-3 h-3 text-blue-500"
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
            className="absolute bottom-0 right-0 w-3 h-3 text-blue-500"
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
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400 font-mono text-[10px] tracking-widest uppercase">
                  Security Tip
                </span>
              </div>
              <p className="text-blue-200 text-xs leading-relaxed font-medium">
                Never share your seed phrase with anyone. Veilo will never ask
                for it outside of this restore process.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-400 font-mono mb-2 tracking-widest uppercase">
              SEED PHRASE
            </label>
            <textarea
              value={seedphrase}
              onChange={(e) => {
                setSeedphrase(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter your 12-word seed phrase separated by spaces..."
              rows={4}
              className="w-full bg-zinc-900/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors resize-none font-mono"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                {seedphrase.trim().split(/\s+/).filter(Boolean).length} / 12
                words
              </span>
            </div>
          </div>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <svg
                className="w-4 h-4 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-400 text-xs font-mono">{displayError}</p>
            </motion.div>
          )}
        </form>
      </div>

      {/* Submit Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={
            seedphrase.trim().split(/\s+/).filter(Boolean).length !== 12 ||
            isLoading
          }
          className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                RESTORING...
              </>
            ) : (
              "RESTORE WALLET"
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
