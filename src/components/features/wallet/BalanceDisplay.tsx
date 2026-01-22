import { motion } from "framer-motion";
import {
  useCryptoPrices,
  usePortfolio24hChange,
} from "../../../hooks/useSolPrice";

interface BalanceDisplayProps {
  tokenBalances?: {
    sol: number;
    usdc: number;
    usdt: number;
    veilo: number;
  };
  onSend?: () => void;
  onReceive?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const BalanceDisplay = ({
  tokenBalances = { sol: 0, usdc: 0, usdt: 0, veilo: 0 },
  onSend,
  onSync,
  isSyncing,
}: BalanceDisplayProps) => {
  const {
    sol,
    usdc,
    usdt,
    veilo,
    isLoading: isPriceLoading,
  } = useCryptoPrices();

  // Calculate USD balance from all tokens
  const usdBalance =
    tokenBalances.sol * (sol?.price || 0) +
    tokenBalances.usdc * (usdc?.price || 0) +
    tokenBalances.usdt * (usdt?.price || 0) +
    tokenBalances.veilo * (veilo?.price || 0);

  // Use calculated portfolio 24h change
  const { change24h, isLoading: isChangeLoading } =
    usePortfolio24hChange(usdBalance);

  const isPositive = change24h >= 0;

  return (
    <div className="px-4 py-4 bg-black/40 border-b border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        {/* Balance */}
        <div>
          <div className="text-3xl font-light tracking-tight mb-1">
            {isPriceLoading ? (
              <span className="text-zinc-500">Loading...</span>
            ) : (
              <>${usdBalance.toFixed(2)}</>
            )}
          </div>
          <div
            className={`text-xs font-medium flex items-center gap-1 ${
              // If loading/no data, use neutral color, otherwise green/red
              isChangeLoading
                ? "text-zinc-500"
                : isPositive
                  ? "text-green-500"
                  : "text-red-500"
            }`}
          >
            {isChangeLoading || isPriceLoading ? (
              <span className="text-zinc-500">--</span>
            ) : (
              <>
                {isPositive ? "+" : ""}
                {change24h.toFixed(2)}%
                <span className="text-zinc-500 text-[10px]">24h</span>
              </>
            )}
          </div>
        </div>

        {/* Send/Receive/Sync Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSend}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
          >
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
          {/* <button
            onClick={onReceive}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group"
          >
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
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button> */}
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-white/10 hover:border-neon-green/50 transition-all rounded group ${
                isSyncing ? "opacity-50" : ""
              }`}
              title="Sync Notes"
            >
              <svg
                className={`w-4 h-4 text-neon-green ${
                  isSyncing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
