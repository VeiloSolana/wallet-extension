import { useState } from "react";
import { CyberButton } from "./CyberButton";

export const SwapPage = () => {
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  const handleSwap = () => {
    // Swap logic will be implemented later
    console.log("Swap:", { fromToken, toToken, fromAmount, toAmount });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <h2 className="text-sm font-mono font-bold tracking-widest text-white uppercase">
          Swap Tokens
        </h2>
        <span className="px-1.5 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 text-[9px] font-mono text-neon-green">
          JUPITER AGGREGATOR
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Swap Card */}
        <div className="relative bg-zinc-900/40 border border-white/10 p-1 group">
          {/* Tech Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-neon-green/50 transition-colors" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20 group-hover:border-neon-green/50 transition-colors" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20 group-hover:border-neon-green/50 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-neon-green/50 transition-colors" />

          <div className="p-4 space-y-1">
            {/* From Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Pay
                </label>
                <div className="flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                  <svg
                    className="w-3 h-3 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                  <span className="text-[10px] font-mono text-zinc-400">
                    MAX
                  </span>
                </div>
              </div>

              <div className="bg-black/60 border border-white/10 p-3 hover:border-white/30 transition-colors flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-mono text-white outline-none placeholder:text-zinc-700"
                />
                <div className="h-8 w-[1px] bg-white/10" />
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm font-bold border-none outline-none cursor-pointer uppercase tracking-wider hover:text-neon-green transition-colors"
                  style={{ color: "white" }}
                >
                  <option value="SOL" className="bg-zinc-900 text-white">
                    SOL
                  </option>
                  <option value="USDC" className="bg-zinc-900 text-white">
                    USDC
                  </option>
                  <option value="USDT" className="bg-zinc-900 text-white">
                    USDT
                  </option>
                </select>
              </div>
              <div className="flex justify-end px-1">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Balance: --
                </span>
              </div>
            </div>

            {/* Divider / Switcher */}
            <div className="relative h-8 flex items-center justify-center my-2">
              <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <button
                onClick={() => {
                  const temp = fromToken;
                  setFromToken(toToken);
                  setToToken(temp);
                  const tempAmount = fromAmount;
                  setFromAmount(toAmount);
                  setToAmount(tempAmount);
                }}
                className="relative z-10 w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-zinc-400 hover:text-neon-green hover:border-neon-green transition-all hover:scale-110 active:scale-90"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
              </button>
            </div>

            {/* To Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
                Receive
              </label>

              <div className="bg-black/60 border border-white/10 p-3 hover:border-white/30 transition-colors flex items-center gap-3">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-mono text-zinc-400 outline-none placeholder:text-zinc-700 cursor-default"
                />
                <div className="h-8 w-[1px] bg-white/10" />
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm font-bold border-none outline-none cursor-pointer uppercase tracking-wider hover:text-neon-green transition-colors"
                  style={{ color: "white" }}
                >
                  <option value="USDC" className="bg-zinc-900 text-white">
                    USDC
                  </option>
                  <option value="USDT" className="bg-zinc-900 text-white">
                    USDT
                  </option>
                  <option value="SOL" className="bg-zinc-900 text-white">
                    SOL
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Rate
            </span>
            <span className="text-[10px] font-mono text-zinc-400 italic">
              Fetching price...
            </span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Slippage
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Auto (0.5%)
            </span>
          </div>

          <CyberButton onClick={handleSwap} disabled={!fromAmount} fullWidth>
            EXECUTE SWAP
          </CyberButton>
        </div>

        {/* Info Banner */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-zinc-600">
            Powered by Jupiter Aggregator
          </p>
          <p className="text-[9px] text-zinc-700 mt-1">
            Best price routing across all Solana DEXs
          </p>
        </div>
      </div>
    </div>
  );
};
