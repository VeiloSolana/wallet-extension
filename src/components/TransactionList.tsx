import { motion } from "framer-motion";

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
}

export const TransactionList = ({ transactions, onViewAll, onSelectTransaction }: TransactionListProps) => {
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

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-400 font-mono tracking-widest">
            RECENT ACTIVITY
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
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
            <p className="text-zinc-500 font-mono text-xs">NO TRANSACTIONS YET</p>
            <p className="text-zinc-600 text-[10px] mt-1">
              Your activity will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-400 font-mono tracking-widest">
          RECENT ACTIVITY
        </span>
        <button 
            onClick={onViewAll}
            className="text-xs text-neon-green hover:text-neon-green/80 font-mono"
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
            className="p-3 bg-zinc-900/40 border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-7 h-7 rounded-full flex items-center justify-center
                ${
                  tx.type === "send"
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-neon-green/10 border border-neon-green/30"
                }
              `}
              >
                {tx.type === "send" ? (
                  <svg
                    className="w-3.5 h-3.5 text-red-500"
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
                    className="w-3.5 h-3.5 text-neon-green"
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
                  <span className="text-sm font-medium">
                    {tx.type === "send" ? "Sent" : "Received"}
                  </span>
                  <span
                    className={`text-sm font-mono ${
                      tx.type === "send" ? "text-red-500" : "text-neon-green"
                    }`}
                  >
                    {tx.type === "send" ? "-" : "+"}
                    {tx.amount} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {shortenAddress(tx.address)}
                  </span>
                  <div className="flex items-center gap-2">
                    {tx.status === "pending" && (
                      <span className="text-[10px] text-yellow-500 font-mono">
                        PENDING
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-600">
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
  );
};
