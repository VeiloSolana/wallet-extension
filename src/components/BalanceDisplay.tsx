import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSolPrice } from "../hooks/useSolPrice";

interface BalanceDisplayProps {
  balance: number;
  onSend?: () => void;
  onReceive?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const BalanceDisplay = ({
  balance,
  onSend,
  onReceive,
  onSync,
  isSyncing,
}: BalanceDisplayProps) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const {
    price: solPrice,
    priceChange24h,
    isLoading: isPriceLoading,
  } = useSolPrice();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayBalance(balance);
    }, 100);
    return () => clearTimeout(timer);
  }, [balance]);

  // Calculate USD balance from live SOL price
  const usdBalance = displayBalance * solPrice;

  // Use actual 24h price change from API
  const isPositive = priceChange24h >= 0;

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
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPriceLoading ? (
              <span className="text-zinc-500">--</span>
            ) : (
              <>
                {isPositive ? "+" : ""}
                {priceChange24h.toFixed(2)}%
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
