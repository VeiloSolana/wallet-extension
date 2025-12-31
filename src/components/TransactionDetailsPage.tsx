import { motion } from "framer-motion";
import { CyberButton } from "./CyberButton";

interface Transaction {
    id: string;
    type: "send" | "receive";
    amount: number;
    timestamp: number;
    status: "confirmed" | "pending";
    address: string;
  }

interface TransactionDetailsPageProps {
  onBack: () => void;
  transaction: Transaction;
}

export const TransactionDetailsPage = ({ onBack, transaction }: TransactionDetailsPageProps) => {
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-lg font-bold tracking-tight">TRANSACTION DETAILS</h2>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
             
             {/* Large Amount Display */}
             <div className="flex flex-col items-center py-8 border-b border-white/10 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    transaction.type === "send"
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-neon-green/10 border border-neon-green/30"
                }`}>
                    {transaction.type === "send" ? (
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    )}
                </div>
                <h3 className={`text-3xl font-light font-mono mb-1 ${transaction.type === "send" ? "text-red-500" : "text-neon-green"}`}>
                    {transaction.type === "send" ? "-" : "+"}{transaction.amount} SOL
                </h3>
                <span className={`text-xs px-2 py-1 rounded border ${
                    transaction.status === "confirmed" 
                    ? "bg-neon-green/10 border-neon-green/30 text-neon-green" 
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                }`}>
                    {transaction.status.toUpperCase()}
                </span>
             </div>

             {/* Details Grid */}
             <div className="space-y-6">
                 
                 <div>
                     <p className="text-xs text-zinc-500 font-mono tracking-widest mb-1">DATE</p>
                     <p className="text-sm font-medium">{new Date(transaction.timestamp).toLocaleString()}</p>
                 </div>

                 <div>
                     <p className="text-xs text-zinc-500 font-mono tracking-widest mb-1">
                        {transaction.type === "send" ? "TO" : "FROM"}
                     </p>
                     <div className="flex items-center gap-2 p-3 bg-zinc-900/60 border border-white/10 text-sm font-mono break-all text-zinc-300">
                         {transaction.address}
                         <button onClick={() => navigator.clipboard.writeText(transaction.address)}>
                            <svg className="w-4 h-4 text-zinc-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                         </button>
                     </div>
                 </div>

                 <div>
                     <p className="text-xs text-zinc-500 font-mono tracking-widest mb-1">TRANSACTION ID</p>
                     <div className="flex items-center gap-2 p-3 bg-zinc-900/60 border border-white/10 text-xs font-mono break-all text-zinc-400">
                         {/* Mock ID if simulated, usually we'd have tx hash */}
                         {transaction.id.length > 10 ? transaction.id : "2vD...9q (Mock Signature)"}
                     </div>
                 </div>

                 <div className="pt-4">
                     <CyberButton 
                        onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.id}?cluster=devnet`, "_blank")}
                        variant="secondary"
                        fullWidth
                        className="text-xs"
                     >
                        VIEW ON EXPLORER
                     </CyberButton>
                 </div>

             </div>

        </div>
    </motion.div>
  );
};
