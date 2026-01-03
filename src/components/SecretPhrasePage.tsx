import { motion } from "framer-motion";
import { useState } from "react";

interface SecretPhrasePageProps {
  phrase: string[];
  onContinue: () => void;
}

export const SecretPhrasePage = ({ phrase, onContinue }: SecretPhrasePageProps) => {
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
        <h2 className="text-lg font-bold tracking-tight text-center">Your Secret Phrase</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <h3 className="text-yellow-400 font-bold text-sm mb-1">
                Save this phrase securely!
              </h3>
              <p className="text-yellow-300/70 text-xs leading-relaxed">
                This is the ONLY way to recover your wallet. Write it down and store it somewhere safe. Never share it with anyone.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phrase Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/60 border border-white/10 rounded-lg p-4 mb-4"
        >
          <div className="grid grid-cols-3 gap-2">
            {phrase.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap- px-3 py-2 bg-black/40 rounded border border-white/5"
              >
                <span className="text-zinc-600 text-[10px] font-mono">{index + 1}.</span>
                <span className="text-white text-[10px] font-mono">{word}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-zinc-900/60 border border-white/10 rounded-lg text-sm font-mono text-zinc-400 hover:text-white hover:border-neon-green/50 transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-neon-green">COPIED!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setConfirmed(!confirmed)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                confirmed
                  ? "bg-neon-green border-neon-green"
                  : "border-zinc-600 group-hover:border-zinc-400"
              }`}
            >
              {confirmed && (
                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
              I have saved my secret phrase in a secure location. I understand that if I lose it, my wallet cannot be recovered.
            </span>
          </label>
        </motion.div>
      </div>

      {/* Continue Button */}
      <div className="p-6 border-t border-white/10 shrink-0">
        <button
          onClick={onContinue}
          disabled={!confirmed}
          className="w-full py-4 bg-white text-black font-bold text-lg tracking-wide rounded-lg hover:bg-neon-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neon-green"
        >
          CONTINUE TO WALLET
        </button>
      </div>
    </div>
  );
};
