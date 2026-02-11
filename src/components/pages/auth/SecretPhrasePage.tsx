import { motion } from "framer-motion";
import { useState } from "react";

interface SecretPhrasePageProps {
  phrase: string[];
  onContinue: () => void;
}

export const SecretPhrasePage = ({
  phrase,
  onContinue,
}: SecretPhrasePageProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phrase.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-black relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <h2 className="text-sm font-bold tracking-tight text-center">
          Your Recovery Phrase
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-yellow-500/10 to-amber-600/5 border border-yellow-500/30 rounded-lg p-4 mb-4 overflow-hidden"
        >
          {/* Animated scanline */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent animate-pulse" />

          {/* Corner brackets */}
          <svg
            className="absolute top-0 left-0 w-3 h-3 text-yellow-500"
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
            className="absolute top-0 right-0 w-3 h-3 text-yellow-500"
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
            className="absolute bottom-0 left-0 w-3 h-3 text-yellow-500"
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
            className="absolute bottom-0 right-0 w-3 h-3 text-yellow-500"
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 font-mono text-[10px] tracking-widest uppercase">
                  Critical Backup
                </span>
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                  <span
                    className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
              <p className="text-yellow-200 text-xs leading-relaxed font-medium">
                Only way to recover wallet. Write down and store safely. Never
                share with anyone.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phrase Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-zinc-900/60 border border-white/10 rounded-lg p-4 mb-4 overflow-hidden"
        >
          {/* Corner brackets */}
          <svg
            className="absolute top-0 left-0 w-3 h-3 text-neon-green/50"
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
            className="absolute top-0 right-0 w-3 h-3 text-neon-green/50"
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
            className="absolute bottom-0 left-0 w-3 h-3 text-neon-green/50"
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
            className="absolute bottom-0 right-0 w-3 h-3 text-neon-green/50"
            viewBox="0 0 24 24"
          >
            <path
              d="M24 24 L24 12 M24 24 L12 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          <div className="grid grid-cols-3 gap-2 relative">
            {phrase.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1.5 bg-black/40 rounded border border-white/5 hover:border-neon-green/30 transition-colors"
              >
                <span className="text-zinc-600 text-[10px] font-mono w-4">
                  {index + 1}.
                </span>
                <span className="text-white text-xs font-mono">{word}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 bg-zinc-900/60 border border-white/10 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:border-neon-green/50 transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4 text-neon-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-neon-green">COPIED!</span>
            </>
          ) : (
            <>
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              COPY TO CLIPBOARD
            </>
          )}
        </button>

        {/* Confirmation Checkbox */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setConfirmed(!confirmed)}
              className={`relative w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                confirmed
                  ? "bg-white border-white"
                  : "border-zinc-600 bg-zinc-900/60 hover:border-zinc-400"
              }`}
            >
              {confirmed && (
                <motion.svg
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-3.5 h-3.5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </button>
            <p className="text-xs text-zinc-400 leading-relaxed select-none">
              I have saved my recovery phrase in a secure location. I understand
              that if I lose it, my wallet cannot be recovered.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Continue Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={onContinue}
          disabled={!confirmed}
          className="relative overflow-hidden group w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10">CONTINUE TO WALLET</span>
        </button>
      </div>
    </div>
  );
};
