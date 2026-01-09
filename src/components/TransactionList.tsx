import { motion } from "framer-motion";
import { useState } from "react";
import { useCryptoPrices } from "../hooks/useSolPrice";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
  solBalance: number;
  isLoadingNotes?: boolean;
}

type TabType = "balances" | "history";

export const TransactionList = ({
  transactions,
  onViewAll,
  onSelectTransaction,
  solBalance,
  isLoadingNotes = false,
}: TransactionListProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const { sol, usdc, usdt, isLoading: isPriceLoading } = useCryptoPrices();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 px-4">
        <button
          onClick={() => setActiveTab("balances")}
          className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase transition-all relative ${
            activeTab === "balances"
              ? "text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          BALANCES
          {activeTab === "balances" && (
            <motion.div
              layoutId="dashboardTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF00]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-xs font-medium tracking-widest uppercase transition-all relative ${
            activeTab === "history"
              ? "text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          HISTORY
          {activeTab === "history" && (
            <motion.div
              layoutId="dashboardTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF00]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      {activeTab === "balances" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* SOL Balance */}
          <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
            {/* Corner Brackets */}
            <svg
              className="absolute top-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,3 L0,0 L3,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute top-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M7,0 L10,0 L10,3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,7 L0,10 L3,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M10,7 L10,10 L7,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/images/sol-logo.svg" alt="SOL" className="w-8 h-8" />
                <div>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                    Solana
                  </p>
                  <p className="text-xs text-white font-medium">SOL</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-light text-white">
                  {solBalance.toFixed(4)}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isPriceLoading ? (
                    <span>--</span>
                  ) : (
                    <span>≈ ${(solBalance * sol.price).toFixed(2)}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* USDC Balance */}
          <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
            {/* Corner Brackets */}
            <svg
              className="absolute top-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,3 L0,0 L3,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute top-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M7,0 L10,0 L10,3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,7 L0,10 L3,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M10,7 L10,10 L7,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/usdc-logo.svg"
                  alt="USDC"
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                    USD Coin
                  </p>
                  <p className="text-xs text-white font-medium">USDC</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-light text-white">0.00</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isPriceLoading ? "--" : `≈ $${(0 * usdc.price).toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>

          {/* USDT Balance */}
          <div className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all relative overflow-hidden group">
            {/* Corner Brackets */}
            <svg
              className="absolute top-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,3 L0,0 L3,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute top-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M7,0 L10,0 L10,3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 left-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M0,7 L0,10 L3,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="absolute bottom-0 right-0 w-2.5 h-2.5 text-[#00FF00]/40"
              viewBox="0 0 10 10"
            >
              <path
                d="M10,7 L10,10 L7,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/usdt-logo.svg"
                  alt="USDT"
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">
                    Tether
                  </p>
                  <p className="text-xs text-white font-medium">USDT</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-light text-white">0.00</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isPriceLoading ? "--" : `≈ $${(0 * usdt.price).toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isLoadingNotes ? (
        <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
              RECENT ACTIVITY
            </span>
          </div>

          {/* Skeleton Loader */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-2.5 bg-zinc-900/40 border border-white/10 animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-zinc-800 rounded w-20 mb-1"></div>
                    <div className="h-2 bg-zinc-800 rounded w-24"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-zinc-800 rounded w-16 mb-1"></div>
                    <div className="h-2 bg-zinc-800 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900/60 border border-white/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-zinc-500 font-mono text-xs">
              NO TRANSACTIONS YET
            </p>
            <p className="text-zinc-600 text-[10px] mt-1">
              Your activity will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
              RECENT ACTIVITY
            </span>
            <button
              onClick={onViewAll}
              className="text-xs text-[#00FF00] hover:text-[#00FF00]/80 font-mono transition-colors"
            >
              VIEW ALL
            </button>
          </div>

          {/* Scrollable transaction list */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                className="p-2.5 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${
                      tx.type === "send"
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-[#00FF00]/10 border border-[#00FF00]/30"
                    }
                  `}
                  >
                    {tx.type === "send" ? (
                      <svg
                        className="w-3 h-3 text-red-500"
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
                        className="w-3 h-3 text-[#00FF00]"
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {tx.type === "send" ? "Spent" : "Received"}
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          tx.type === "send" ? "text-red-500" : "text-[#00FF00]"
                        }`}
                      >
                        {tx.type === "send" ? "-" : "+"}
                        {tx.amount} SOL
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {shortenAddress(tx.address)}
                      </span>
                      <div className="flex items-center gap-2">
                        {tx.status === "pending" && (
                          <span className="text-[10px] text-yellow-500 font-mono uppercase tracking-widest">
                            PENDING
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatTime(tx.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
