import { motion } from "framer-motion";
import { useCryptoPrices } from "../hooks/useSolPrice";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
  txSignature?: string;
}

interface ActivityPageProps {
  onBack: () => void;
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  solBalance: number;
}

export const ActivityPage = ({
  onBack,
  transactions,
  onSelectTransaction,
}: ActivityPageProps) => {
  const { sol, isLoading: isPriceLoading } = useCryptoPrices();

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
        <h2 className="text-sm font-bold tracking-tight">ALL ACTIVITY</h2>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
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
                className="p-2.5 bg-zinc-900/40 border border-white/10 hover:border-white/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      tx.type === "send"
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-neon-green/10 border border-neon-green/30"
                    }`}
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
                        className="w-3 h-3 text-neon-green"
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
                          tx.type === "send"
                            ? "text-red-500"
                            : "text-neon-green"
                        }`}
                      >
                        {tx.type === "send" ? "-" : "+"}
                        {tx.amount} SOL
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {isPriceLoading
                          ? "--"
                          : `≈ $${(tx.amount * sol.price).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
