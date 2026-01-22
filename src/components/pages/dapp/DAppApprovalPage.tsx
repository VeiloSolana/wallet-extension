import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDappWallets } from "../../../utils/dappWalletStorage";
import { loadWallet } from "../../../utils/storage";

interface PendingDAppRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  origin: string;
}

interface DAppApprovalPageProps {
  request: PendingDAppRequest;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

import { CyberButton } from "../../common/ui/CyberButton";
import { CyberCard } from "../../common/ui/CyberCard";

export const DAppApprovalPage = ({
  request,
  onApprove,
  onReject,
  isProcessing = false,
}: DAppApprovalPageProps) => {
  const [connectingWallet, setConnectingWallet] = useState<{
    name: string;
    publicKey: string;
  } | null>(null);

  useEffect(() => {
    const fetchConnectingWallet = async () => {
      try {
        const storedWallet = await loadWallet();
        if (!storedWallet) return;

        // Default to main wallet
        let name = "Main Account";
        let publicKey = storedWallet.publicKey;

        // Check for DApp wallets
        const dappWallets = await getDappWallets();
        if (dappWallets.length > 0) {
          name = dappWallets[0].name;
          publicKey = dappWallets[0].publicKey;
        }

        setConnectingWallet({ name, publicKey });
      } catch (error) {
        console.error("Failed to load connecting wallet info", error);
      }
    };

    fetchConnectingWallet();
  }, []);

  const getTitle = () => {
    switch (request.method) {
      case "connect":
        return "Connect Wallet";
      case "signTransaction":
        return "Sign Transaction";
      case "signMessage":
        return "Sign Message";
      case "signAndSendTransaction":
        return "Sign & Send";
      case "sendShieldedTransaction":
        return "Shielded Transfer";
      default:
        return "Access Request";
    }
  };

  const getPermissions = () => {
    switch (request.method) {
      case "connect":
        return [
          "View your wallet balance and activity",
          "Request approval for transactions",
        ];
      case "signTransaction":
      case "signAndSendTransaction":
        return [
          "Sign transactions on your behalf",
          "This action may transfer funds",
        ];
      case "signMessage":
        return ["Verify your identity by signing a message"];
      case "sendShieldedTransaction":
        return ["Initiate a private shielded transfer"];
      default:
        return [];
    }
  };

  // Extract display-friendly origin
  const displayOrigin = request.origin
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  // Format public key
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen bg-black flex flex-col font-sans"
    >
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <h1 className="text-base font-medium text-white text-center tracking-tight">
          {getTitle()}
        </h1>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        {/* Origin / Site Info */}
        <div className="flex flex-col items-center justify-center mb-6">
          <CyberCard
            className="w-16 h-16 flex items-center justify-center mb-4 !bg-zinc-900/60 !rounded-xl"
            hoverable={false}
          >
            {/* Fallback Icon for Site */}
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </CyberCard>
          <h2 className="text-xl font-light text-white mb-2 tracking-tight">
            {displayOrigin}
          </h2>
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-neon-green/20 bg-neon-green/5">
            <div className="w-1 h-1 rounded-full bg-neon-green shadow-[0_0_8px_#00FF00]" />
            <span className="text-[10px] font-mono text-neon-green tracking-widest uppercase">
              Secure Connection
            </span>
          </div>
        </div>

        {/* Connection Details Card */}
        <CyberCard className="mb-6 !p-3" hoverable={false}>
          <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Target Wallet
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white tracking-wide leading-none mb-1">
                {connectingWallet ? connectingWallet.name : "Loading..."}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-zinc-400 font-mono leading-none">
                  {connectingWallet
                    ? formatAddress(connectingWallet.publicKey)
                    : "..."}
                </div>
              </div>
            </div>
          </div>
        </CyberCard>

        {/* Permissions List */}
        <div className="mb-4 pl-1">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
            Access Rights
          </p>
          <ul className="space-y-2">
            {getPermissions().map((permission, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <div className="mt-1 w-4 h-4 rounded border border-neon-green/30 bg-neon-green/10 flex items-center justify-center flex-shrink-0 group-hover:border-neon-green/60 transition-colors">
                  <svg
                    className="w-2.5 h-2.5 text-neon-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-zinc-300 font-light tracking-wide">
                  {permission}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning for signing requests */}
        {request.method !== "connect" && (
          <div className="bg-red-500/5 border border-red-500/20 rounded p-3 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-red-200/80 font-light">
                Only sign this if you trust{" "}
                <span className="text-white font-medium">{displayOrigin}</span>{" "}
                completely.
              </p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <CyberButton
            onClick={onReject}
            disabled={isProcessing}
            variant="secondary"
            fullWidth
          >
            Reject
          </CyberButton>
          <CyberButton
            onClick={onApprove}
            disabled={isProcessing}
            variant="primary"
            fullWidth
          >
            {isProcessing ? "Processing..." : "Authorize"}
          </CyberButton>
        </div>
      </div>
    </motion.div>
  );
};
