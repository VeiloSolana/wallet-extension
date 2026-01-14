import { motion } from "framer-motion";

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

export const DAppApprovalPage = ({
  request,
  onApprove,
  onReject,
  isProcessing = false,
}: DAppApprovalPageProps) => {
  const getTitle = () => {
    switch (request.method) {
      case "connect":
        return "Connection Request";
      case "signTransaction":
        return "Sign Transaction";
      case "signMessage":
        return "Sign Message";
      case "signAndSendTransaction":
        return "Sign & Send Transaction";
      case "sendShieldedTransaction":
        return "Shielded Transfer";
      default:
        return "Request";
    }
  };

  const getDescription = () => {
    switch (request.method) {
      case "connect":
        return "wants to connect to your Veilo wallet";
      case "signTransaction":
        return "wants you to sign a transaction";
      case "signMessage":
        return "wants you to sign a message";
      case "signAndSendTransaction":
        return "wants you to sign and send a transaction";
      case "sendShieldedTransaction":
        return "wants to transfer shielded funds";
      default:
        return "is requesting access";
    }
  };

  const getPermissions = () => {
    switch (request.method) {
      case "connect":
        return [
          "View your wallet address",
          "Request transaction signatures",
        ];
      case "signTransaction":
      case "signAndSendTransaction":
        return [
          "Sign transactions on your behalf",
          "This may transfer tokens from your wallet",
        ];
      case "signMessage":
        return ["Sign messages to verify your identity"];
      case "sendShieldedTransaction":
        return [
          "Transfer shielded funds from your privacy pool",
          "Send to another Veilo user privately",
        ];
      default:
        return [];
    }
  };

  // Extract display-friendly origin
  const displayOrigin = request.origin.replace(/^https?:\/\//, "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">{getTitle()}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6">
        {/* Origin Card */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{displayOrigin}</p>
              <p className="text-sm text-zinc-400">{getDescription()}</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <p className="text-sm text-zinc-400 mb-3">This site will be able to:</p>
          <ul className="space-y-2">
            {getPermissions().map((permission, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0"
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
                <span className="text-sm text-zinc-300">{permission}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning for signing requests */}
        {request.method !== "connect" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
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
              <p className="text-sm text-yellow-200">
                Only approve transactions from sites you trust.
              </p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-white hover:bg-white/90 disabled:bg-white/50 text-black font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Approve"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
