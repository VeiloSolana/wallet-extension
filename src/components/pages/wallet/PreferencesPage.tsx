import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberButton } from "../../common/ui/CyberButton";
import {
  type NetworkType,
  getSelectedNetwork,
  setSelectedNetwork,
} from "../../../lib/network";
import { loadWallet } from "../../../utils/storage";
import { decrypt } from "../../../utils/encryption";
import bs58 from "bs58";

type RevealTarget = "phrase" | "privateKey" | null;

interface PreferencesPageProps {
  address?: string;
  onLogout?: () => void;
  password: string; // Required - used for decryption
}

export const PreferencesPage = ({
  address = "",
  onLogout,
  password,
}: PreferencesPageProps) => {
  const [copied, setCopied] = useState(false);
  const [network, setNetwork] = useState<NetworkType>(getSelectedNetwork());

  // Reveal state
  const [revealTarget, setRevealTarget] = useState<RevealTarget>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revealedData, setRevealedData] = useState<string | null>(null);
  const [revealError, setRevealError] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedRevealed, setCopiedRevealed] = useState(false);

  useEffect(() => {
    const handleNetworkChange = (e: CustomEvent<NetworkType>) => {
      setNetwork(e.detail);
    };
    window.addEventListener(
      "networkChanged",
      handleNetworkChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "networkChanged",
        handleNetworkChange as EventListener,
      );
  }, []);

  const handleNetworkToggle = () => {
    const newNetwork = network === "devnet" ? "mainnet" : "devnet";
    setSelectedNetwork(newNetwork);
    setNetwork(newNetwork);
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevealRequest = (target: RevealTarget) => {
    setRevealTarget(target);
    setConfirmPassword("");
    setRevealedData(null);
    setRevealError("");
  };

  const handleCloseReveal = () => {
    setRevealTarget(null);
    setConfirmPassword("");
    setRevealedData(null);
    setRevealError("");
    setCopiedRevealed(false);
  };

  const handleConfirmReveal = async () => {
    if (!confirmPassword) {
      setRevealError("Please enter your password");
      return;
    }

    setIsRevealing(true);
    setRevealError("");

    try {
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        setRevealError("Wallet data not found");
        setIsRevealing(false);
        return;
      }

      if (revealTarget === "phrase") {
        const mnemonic = await decrypt(
          storedWallet.encryptedMnemonic,
          confirmPassword,
        );
        setRevealedData(mnemonic);
      } else if (revealTarget === "privateKey") {
        const secretKeyStr = await decrypt(
          storedWallet.encryptedSecretKey,
          confirmPassword,
        );
        const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
        setRevealedData(bs58.encode(secretKey));
      }
    } catch {
      setRevealError("Incorrect password");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyRevealed = () => {
    if (revealedData) {
      navigator.clipboard.writeText(revealedData);
      setCopiedRevealed(true);
      setTimeout(() => setCopiedRevealed(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      {/* Scrollable Content */}
      <div className="p-5 space-y-6">
        {/* Network Status - Always Visible at Top */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">
            Active Network
          </label>
          <button
            onClick={handleNetworkToggle}
            className="w-full flex items-center justify-between p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 relative group overflow-hidden transition-colors cursor-pointer"
          >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/20 group-hover:border-neon-green/50 transition-colors" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/20 group-hover:border-neon-green/50 transition-colors" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/20 group-hover:border-neon-green/50 transition-colors" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/20 group-hover:border-neon-green/50 transition-colors" />

            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    network === "mainnet" ? "bg-orange-500" : "bg-neon-green"
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full animate-ping ${
                    network === "mainnet"
                      ? "bg-orange-500/50"
                      : "bg-neon-green/50"
                  }`}
                />
              </div>
              <span className="text-xs font-mono text-white tracking-wide">
                Solana {network === "mainnet" ? "Mainnet" : "Devnet"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  network === "mainnet"
                    ? "text-orange-500 bg-orange-500/10 border-orange-500/20"
                    : "text-neon-green bg-neon-green/10 border-neon-green/20"
                }`}
              >
                {network === "mainnet" ? "MAINNET" : "DEVNET"}
              </span>
              <svg
                className="w-3 h-3 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          </button>
          <p className="text-[9px] font-mono text-zinc-600 pl-1">
            Tap to switch networks
          </p>
        </div>

        {/* Account Security Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-xs font-mono text-white font-bold tracking-widest uppercase">
              Account Security
            </h2>
          </div>

          {/* Address Display */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">
              Main Address
            </label>
            <div
              onClick={handleCopy}
              className="relative group cursor-pointer p-4 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-neon-green/30 group-hover:bg-neon-green/5 transition-all">
                  <svg
                    className="w-4 h-4 text-zinc-400 group-hover:text-neon-green transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 4.162 9 0 01-1.963.75A1 1 0 0116 19.5h-8a1 1 0 01-1-1 4.161 4.161 0 01-.036-.5m11.036 0c.036-.166.036-.316.036-.45a4.49 4.49 0 00-.776-2.5 4.5 4.5 0 00-1.875-1.583m-9.176 1.583c-.036.134-.036.284-.036.45a4.49 4.49 0 01.776 2.5 4.5 4.5 0 011.875 1.583"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-zinc-300 break-all">
                    {address}
                  </p>
                </div>
                <div className="absolute right-2 top-2">
                  {copied && (
                    <span className="text-[9px] font-mono text-neon-green bg-black/80 px-1 py-0.5 rounded border border-neon-green/30">
                      COPIED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRevealRequest("phrase")}
              className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <svg
                  className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-neon-green transition-colors" />
              </div>
              <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider mb-0.5">
                Recovery Phrase
              </p>
              <p className="text-[9px] text-zinc-600">View recovery words</p>
            </button>

            <button
              onClick={() => handleRevealRequest("privateKey")}
              className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <svg
                  className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                  />
                </svg>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors" />
              </div>
              <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider mb-0.5">
                Private Key
              </p>
              <p className="text-[9px] text-zinc-600">Export keys safely</p>
            </button>
          </div>
        </div>

        {/* Veilo Client Info & Logout */}
        <div className="pt-6 border-t border-white/5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Client Version
              </p>
              <p className="text-xs font-mono text-white mt-0.5">v0.1.0 Beta</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Build
              </p>
              <p className="text-xs font-mono text-white mt-0.5">Development</p>
            </div>
          </div>

          {onLogout && (
            <CyberButton
              onClick={onLogout}
              variant="secondary"
              fullWidth
              className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40"
            >
              DISCONNECT SESSION
            </CyberButton>
          )}
        </div>
      </div>

      {/* Password Confirmation & Reveal Modal */}
      <AnimatePresence>
        {revealTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={handleCloseReveal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-black border border-white/10 shadow-lg max-w-md w-full mx-4"
            >
              {/* Corner brackets */}
              <svg
                className="absolute -top-px -left-px w-3 h-3 text-neon-green"
                viewBox="0 0 12 12"
              >
                <path
                  d="M0 0 L0 8 M0 0 L8 0"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              <svg
                className="absolute -top-px -right-px w-3 h-3 text-neon-green"
                viewBox="0 0 12 12"
              >
                <path
                  d="M12 0 L12 8 M12 0 L4 0"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              <svg
                className="absolute -bottom-px -left-px w-3 h-3 text-neon-green"
                viewBox="0 0 12 12"
              >
                <path
                  d="M0 12 L0 4 M0 12 L8 12"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              <svg
                className="absolute -bottom-px -right-px w-3 h-3 text-neon-green"
                viewBox="0 0 12 12"
              >
                <path
                  d="M12 12 L12 4 M12 12 L4 12"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400">
                    ⚠️ Security Warning
                  </h2>
                  <button
                    onClick={handleCloseReveal}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {!revealedData ? (
                  <>
                    <div className="mb-4 p-2.5 bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-xs font-mono text-yellow-300 leading-relaxed">
                        {revealTarget === "phrase"
                          ? "Never share your recovery phrase. Anyone with access can steal your funds."
                          : "Never share your private key. Anyone with access can steal your funds."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block mb-1.5">
                          Enter Password to Reveal
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleConfirmReveal()
                          }
                          placeholder="Enter your password"
                          className="w-full px-3 py-2 bg-zinc-900/60 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-green/50 transition-colors font-mono text-sm"
                          autoFocus
                        />
                      </div>

                      {revealError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-mono text-red-400"
                        >
                          {revealError}
                        </motion.p>
                      )}

                      <button
                        onClick={handleConfirmReveal}
                        disabled={isRevealing || !confirmPassword}
                        className="w-full px-3 py-2 text-[10px] font-mono font-bold text-black bg-white hover:bg-zinc-200 uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRevealing ? "Verifying..." : "Reveal"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block mb-2">
                        {revealTarget === "phrase"
                          ? "Your Recovery Phrase"
                          : "Your Private Key (Base58)"}
                      </label>
                      {revealTarget === "phrase" ? (
                        <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-900/60 border border-white/10">
                          {revealedData.split(" ").map((word, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 p-1.5 bg-black/40 border border-white/5"
                            >
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {i + 1}.
                              </span>
                              <span className="text-xs text-white font-mono">
                                {word}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-900/60 border border-white/10">
                          <p className="text-xs font-mono text-white break-all">
                            {revealedData}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCopyRevealed}
                      className="w-full mt-3 px-3 py-2 text-[10px] font-mono font-bold text-black bg-white hover:bg-zinc-200 uppercase tracking-widest transition-all"
                    >
                      {copiedRevealed ? "✓ Copied" : "Copy to Clipboard"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
