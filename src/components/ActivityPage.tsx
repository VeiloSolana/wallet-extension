import { motion } from "framer-motion";

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
}

export const ActivityPage = ({ onBack, transactions, onSelectTransaction }: ActivityPageProps) => {
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-lg font-bold tracking-tight">ACTIVITY</h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {/* Reusing TransactionList but without the header/View All button logic inside it? 
                Actually TransactionList has "Recent Activity" header inside. 
                Ideally we refactor TransactionList to be pure list, or we just map lightly here.
                Let's reuse TransactionList for now but we might want to hide the "Recent Activity" header via prop or just implement list here.
                Implementing raw list here for full control and cleaner full-page look.
             */}
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    tx.type === "send"
                                        ? "bg-red-500/10 border border-red-500/30"
                                        : "bg-neon-green/10 border border-neon-green/30"
                                }`}>
                                    {tx.type === "send" ? (
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-white">{tx.type === "send" ? "Sent SOL" : "Received SOL"}</p>
                                    <p className="text-xs text-zinc-500 font-mono">
                                        {new Date(tx.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-medium ${tx.type === "send" ? "text-red-500" : "text-neon-green"}`}>
                                    {tx.type === "send" ? "-" : "+"}{tx.amount} SOL
                                </p>
                                <p className={`text-[10px] font-mono uppercase tracking-wider ${
                                    tx.status === "confirmed" ? "text-zinc-600" : "text-yellow-500"
                                }`}>
                                    {tx.status}
                                </p>
                            </div>
                        </div>
                     ))
                 )}
            </div>
        </div>
    </motion.div>
  );
};
