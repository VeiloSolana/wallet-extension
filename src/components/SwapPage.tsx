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
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="space-y-4">
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <h2 className="text-sm font-mono text-[#00FF00] mb-6 uppercase tracking-widest">
            Token Swap
          </h2>

          {/* From Token */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              From
            </label>
            <div className="bg-black/80 p-4">
              <div className="flex justify-between items-center mb-3">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm border-none outline-none cursor-pointer"
                  style={{ color: "white" }}
                >
                  <option value="SOL" style={{ background: "black" }}>
                    SOL
                  </option>
                  <option value="USDC" style={{ background: "black" }}>
                    USDC
                  </option>
                  <option value="USDT" style={{ background: "black" }}>
                    USDT
                  </option>
                </select>
                <span className="text-xs text-zinc-400 font-mono">
                  Balance: 0.00
                </span>
              </div>
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-mono outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-3">
            <button
              onClick={() => {
                const temp = fromToken;
                setFromToken(toToken);
                setToToken(temp);
                const tempAmount = fromAmount;
                setFromAmount(toAmount);
                setToAmount(tempAmount);
              }}
              className="bg-black/80 p-2 transition-colors"
              aria-label="Swap tokens"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2 mt-6">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              To
            </label>
            <div className="bg-black/80 p-4">
              <div className="flex justify-between items-center mb-3">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-transparent text-white font-mono text-sm border-none outline-none cursor-pointer"
                  style={{ color: "white" }}
                >
                  <option value="USDC" style={{ background: "black" }}>
                    USDC
                  </option>
                  <option value="USDT" style={{ background: "black" }}>
                    USDT
                  </option>
                  <option value="SOL" style={{ background: "black" }}>
                    SOL
                  </option>
                </select>
                <span className="text-xs text-zinc-400 font-mono">
                  Balance: 0.00
                </span>
              </div>
              <input
                type="text"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-mono outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="mt-6 p-4 bg-black/80">
            <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
              <span className="uppercase tracking-wider">Exchange Rate</span>
              <span className="text-white">1 SOL = 0.00 USDC</span>
            </div>
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span className="uppercase tracking-wider">Network Fee</span>
              <span className="text-white">~0.000005 SOL</span>
            </div>
          </div>

          {/* Swap Button */}
          <div className="mt-6">
            <CyberButton onClick={handleSwap} disabled={!fromAmount}>
              Execute Swap
            </CyberButton>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-black/40 backdrop-blur-md p-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#00FF00] animate-pulse" />
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Swap functionality in development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
