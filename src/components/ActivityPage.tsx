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

interface ActivityPageProps {
  onBack: () => void;
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  solBalance: number;
}

type TabType = "balances" | "history";

export const ActivityPage = ({
  onBack,
  transactions,
  onSelectTransaction,
  solBalance,
}: ActivityPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("balances");
  const { sol, usdc, usdt, isLoading: isPriceLoading } = useCryptoPrices();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-black/95 z-30 flex flex-col backdrop-blur-sm"
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
        <h2 className="text-lg font-bold tracking-tight">WALLET</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/20 bg-zinc-900/50 shrink-0">
        <button
          onClick={() => setActiveTab("balances")}
          className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-all relative ${
            activeTab === "balances"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          BALANCES
          {activeTab === "balances" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-all relative ${
            activeTab === "history"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          HISTORY
          {activeTab === "history" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {activeTab === "balances" ? (
          <div className="p-4 space-y-3">
            {/* SOL Balance */}
            <div className="p-4 bg-zinc-900/40 border border-white/10 rounded-lg relative overflow-hidden group hover:border-white/20 transition-all">
              {/* Corner Brackets */}
              <svg
                className="absolute top-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute top-0 right-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 right-0 w-3 h-3 text-neon-green/40"
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">◎</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                      Solana
                    </p>
                    <p className="text-sm text-white font-bold">SOL</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-white">
                    {solBalance.toFixed(4)}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
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
            <div className="p-4 bg-zinc-900/40 border border-white/10 rounded-lg relative overflow-hidden group hover:border-white/20 transition-all">
              {/* Corner Brackets */}
              <svg
                className="absolute top-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute top-0 right-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 right-0 w-3 h-3 text-neon-green/40"
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">$</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                      USD Coin
                    </p>
                    <p className="text-sm text-white font-bold">USDC</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-white">0.00</p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {isPriceLoading
                      ? "--"
                      : `≈ $${(0 * usdc.price).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* USDT Balance */}
            <div className="p-4 bg-zinc-900/40 border border-white/10 rounded-lg relative overflow-hidden group hover:border-white/20 transition-all">
              {/* Corner Brackets */}
              <svg
                className="absolute top-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute top-0 right-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 left-0 w-3 h-3 text-neon-green/40"
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
                className="absolute bottom-0 right-0 w-3 h-3 text-neon-green/40"
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">₮</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                      Tether
                    </p>
                    <p className="text-sm text-white font-bold">USDT</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-white">0.00</p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {isPriceLoading
                      ? "--"
                      : `≈ $${(0 * usdt.price).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-mono text-sm">
                NO TRANSACTIONS YET
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-4 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "send"
                          ? "bg-red-500/10 border border-red-500/30"
                          : "bg-neon-green/10 border border-neon-green/30"
                      }`}
                    >
                      {tx.type === "send" ? (
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
                    <div>
                      <p className="font-medium text-sm text-white">
                        {tx.type === "send" ? "Spent SOL" : "Received SOL"}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono font-medium ${
                        tx.type === "send" ? "text-red-500" : "text-neon-green"
                      }`}
                    >
                      {tx.type === "send" ? "-" : "+"}
                      {tx.amount} SOL
                    </p>
                    <p
                      className={`text-[10px] font-mono uppercase tracking-wider ${
                        tx.status === "confirmed"
                          ? "text-zinc-600"
                          : "text-yellow-500"
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
