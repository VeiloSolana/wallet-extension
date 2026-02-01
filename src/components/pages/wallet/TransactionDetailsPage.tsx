import { motion } from "framer-motion";
import { useCryptoPrices } from "../../../hooks/useSolPrice";
import { getExplorerUrl } from "../../../lib/network";
import type { Transaction } from "../../../types/transaction";

interface TransactionDetailsPageProps {
  onBack: () => void;
  transaction: Transaction;
}

export const TransactionDetailsPage = ({
  onBack,
  transaction,
}: TransactionDetailsPageProps) => {
  const {
    sol,
    usdc,
    usdt,
    veilo,
    isLoading: isPriceLoading,
  } = useCryptoPrices();

  // Get the appropriate price for the token
  const getTokenPrice = () => {
    switch (transaction.token) {
      case "SOL":
        return sol.price;
      case "USDC":
        return usdc.price;
      case "USDT":
        return usdt.price;
      case "VEILO":
        return veilo.price;
      default:
        return 0;
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-black/95 z-40 flex flex-col backdrop-blur-sm"
    >
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/90 shrink-0">
        <button
          onClick={onBack}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
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
        <h2 className="text-sm font-bold tracking-tight">
          TRANSACTION DETAILS
        </h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Compact Amount Display */}
        <div className="flex flex-col items-center py-4 border-b border-white/10 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              transaction.type === "send"
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-neon-green/10 border border-neon-green/30"
            }`}
          >
            {transaction.type === "send" ? (
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-neon-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
          <h3
            className={`text-xl font-light font-mono mb-0.5 ${
              transaction.type === "send" ? "text-red-500" : "text-neon-green"
            }`}
          >
            {transaction.type === "send" ? "-" : "+"}
            {transaction.amount} {transaction.token || "SOL"}
          </h3>
          <p className="text-xs text-zinc-500 font-mono mb-1.5">
            {isPriceLoading
              ? "--"
              : `≈ $${(transaction.amount * getTokenPrice()).toFixed(2)}`}
          </p>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${
              transaction.status === "confirmed"
                ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
            }`}
          >
            {transaction.status.toUpperCase()}
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">
              DATE
            </p>
            <p className="text-xs font-medium text-zinc-300">
              {new Date(transaction.timestamp).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">
              {transaction.type === "send" ? "TO" : "FROM"}
            </p>
            <div className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-white/10 text-xs font-mono break-all text-zinc-300">
              {transaction.address}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(transaction.address)
                }
                className="shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5 text-zinc-500 hover:text-white"
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
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">
              TRANSACTION ID
            </p>
            <div className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-white/10 text-[10px] font-mono break-all text-zinc-400">
              {transaction.id}
              {transaction.txSignature && (
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(transaction.txSignature!)
                  }
                  className="shrink-0"
                >
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500 hover:text-white"
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
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() =>
                transaction.txSignature &&
                window.open(
                  getExplorerUrl("tx", transaction.txSignature),
                  "_blank",
                )
              }
              disabled={!transaction.txSignature}
              className="w-full px-3 py-2 text-xs font-mono font-bold text-neon-green border border-neon-green hover:border-neon-green/80 hover:text-neon-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              VIEW ON EXPLORER
            </button>
          </div>

          {/* Note Breakdown — only show when transaction has multiple notes */}
          {transaction.notes && transaction.notes.length > 1 && (
            <div className="pt-4">
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-2">
                NOTE BREAKDOWN
              </p>
              <div className="space-y-1.5">
                {transaction.notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-2 bg-zinc-900/60 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          note.spent
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-neon-green/10 border border-neon-green/30"
                        }`}
                      >
                        {note.spent ? (
                          <svg
                            className="w-2 h-2 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-2 h-2 text-neon-green"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {note.spent ? "Spent" : "Received"}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono ${
                        note.spent ? "text-red-500" : "text-neon-green"
                      }`}
                    >
                      {note.spent ? "-" : "+"}
                      {note.amount} {note.token}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
