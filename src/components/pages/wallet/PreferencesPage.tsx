import { useState, useEffect } from "react";
import { CyberButton } from "./CyberButton";
import {
  type NetworkType,
  getSelectedNetwork,
  setSelectedNetwork,
} from "../lib/network";

interface PreferencesPageProps {
  address?: string;
  onLogout?: () => void;
}

export const PreferencesPage = ({
  address = "",
  onLogout,
}: PreferencesPageProps) => {
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
    window.location.reload();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPrivateKey = () => {
    alert("Export functionality coming soon");
  };

  const handleViewSeedPhrase = () => {
    alert("View seed phrase functionality coming soon");
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
              onClick={handleViewSeedPhrase}
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
                Seed Phrase
              </p>
              <p className="text-[9px] text-zinc-600">View recovery words</p>
            </button>

            <button
              onClick={handleExportPrivateKey}
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
    </div>
  );
};
