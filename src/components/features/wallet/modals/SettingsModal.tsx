import { motion, AnimatePresence } from "framer-motion";
import { CyberButton } from "../../../common/ui/CyberButton";
import { useState, useEffect } from "react";
import {
  type NetworkType,
  getSelectedNetwork,
  setSelectedNetwork,
} from "../../../../lib/network";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  address,
}: SettingsModalProps) => {
  const [copied, setCopied] = useState(false);
  const [network, setNetwork] = useState<NetworkType>(getSelectedNetwork());

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
    // Reload to apply network change across all components
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            {/* Main Container */}
            <div className="relative bg-black border border-white/10 overflow-hidden group shadow-2xl shadow-black/50">
              {/* Tech Corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-neon-green/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-neon-green/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-neon-green/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-neon-green/50" />

              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
                <h2 className="text-sm font-mono font-bold tracking-widest text-white uppercase">
                  System Settings
                </h2>
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-white transition-colors p-1"
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
                      strokeWidth="1.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-6">
                {/* Network Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Active Network
                  </label>
                  <button
                    onClick={handleNetworkToggle}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          network === "mainnet"
                            ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                            : "bg-neon-green shadow-[0_0_8px_rgba(0,255,163,0.5)]"
                        }`}
                      />
                      <span className="text-xs font-mono text-white">
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
                  <p className="text-[9px] font-mono text-zinc-600">
                    Tap to switch networks
                  </p>
                </div>

                {/* Security Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Security
                    </label>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-400">
                      Main Account Address
                    </label>
                    <div
                      onClick={handleCopy}
                      className="relative group/copy cursor-pointer p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-colors"
                    >
                      <p className="text-[11px] font-mono text-zinc-300 break-all select-all font-light tracking-tight">
                        {address}
                      </p>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 p-1.5 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity border border-white/10">
                        {copied ? (
                          <svg
                            className="w-3.5 h-3.5 text-neon-green"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Private Key Button */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-400">
                      Private Keys
                    </label>
                    <CyberButton
                      onClick={() => {}}
                      disabled
                      fullWidth
                      className="text-xs py-2 opacity-50 cursor-not-allowed border-dashed bg-transparent hover:bg-transparent"
                      variant="secondary"
                    >
                      REVEAL PRIVATE KEY
                    </CyberButton>
                  </div>
                </div>

                {/* Footer / Version */}
                <div className="pt-2 flex justify-center border-t border-white/5 mt-4">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-4">
                    Veilo Client v0.1.0-beta
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
