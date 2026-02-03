import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CyberButton } from "../../../common/ui/CyberButton";
import solLogo from "/images/sol-logo.svg";
import usdcLogo from "/images/usdc-logo.svg";
import usd1Logo from "/images/usd1-logo.png";
import usdtLogo from "/images/usdt-logo.svg";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (
    recipient: string,
    amount: number,
    token: string,
  ) => Promise<{
    success: boolean;
    withdrawAmount: number;
    changeAmount: number;
    recipient: string;
    spentNoteIds: string[];
    txSignature: string | undefined;
  }>;
  tokenBalances?: {
    sol: number;
    usdc: number;
    usdt: number;
    usd1: number;
    veilo: number;
  };
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  onWithdraw,
  tokenBalances,
}: WithdrawModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleWithdraw = async () => {
    if (!recipient || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    const selectedBalance =
      selectedToken === "SOL"
        ? tokenBalances?.sol || 0
        : selectedToken === "USDC"
          ? tokenBalances?.usdc || 0
          : selectedToken === "USDT"
            ? tokenBalances?.usdt || 0
            : selectedToken === "USD1"
              ? tokenBalances?.usd1 || 0
              : tokenBalances?.veilo || 0;

    if (parseFloat(amount) > selectedBalance) {
      setError("Insufficient private balance");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Generating Zero-Knowledge Proof...");

      await onWithdraw(recipient, parseFloat(amount), selectedToken);

      setStatus("Withdrawn successfully!");

      // Reset form after delay
      setTimeout(() => {
        setRecipient("");
        setAmount("");
        setStatus("");
        setError("");
        setIsProcessing(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-black border border-white/10 shadow-lg shadow-neon-green/5 z-50 max-w-md mx-auto"
          >
            {/* Corner brackets */}
            <svg
              className="absolute -top-px -left-px w-3 h-3 text-neon-green"
              viewBox="0 0 12 12"
            >
              <path
                d="M0 0 L0 8 M0 0 L8 0"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -top-px -right-px w-3 h-3 text-neon-green"
              viewBox="0 0 12 12"
            >
              <path
                d="M12 0 L12 8 M12 0 L4 0"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -bottom-px -left-px w-3 h-3 text-neon-green"
              viewBox="0 0 12 12"
            >
              <path
                d="M0 12 L0 4 M0 12 L8 12"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -bottom-px -right-px w-3 h-3 text-neon-green"
              viewBox="0 0 12 12"
            >
              <path
                d="M12 12 L12 4 M12 12 L4 12"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neon-green">
                  WITHDRAW FUNDS
                </h2>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Status indicator */}
                {status && (
                  <div
                    className={`p-2 border ${
                      isProcessing
                        ? "border-neon-green/30 bg-neon-green/10"
                        : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <p className="text-xs font-mono text-center">{status}</p>
                  </div>
                )}

                {/* Error indicator */}
                {error && (
                  <div className="p-2 border border-red-500/30 bg-red-500/10">
                    <p className="text-xs font-mono text-center text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-zinc-900/60 border border-white/10">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-0.5">
                    AVAILABLE BALANCE
                  </p>
                  <p className="text-sm font-mono text-neon-green">
                    {(selectedToken === "SOL"
                      ? tokenBalances?.sol || 0
                      : selectedToken === "USDC"
                        ? tokenBalances?.usdc || 0
                        : selectedToken === "USDT"
                          ? tokenBalances?.usdt || 0
                          : selectedToken === "USD1"
                            ? tokenBalances?.usd1 || 0
                            : tokenBalances?.veilo || 0
                    ).toFixed(4)}{" "}
                    {selectedToken}
                  </p>
                </div>

                {/* Token Selector */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    SELECT TOKEN
                  </label>
                  <div className="relative">
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 pl-10 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="SOL">SOL - Solana</option>
                      <option value="USDC">USDC - USD Coin</option>
                      <option value="USDT">USDT - Tether</option>
                      <option value="USD1">USD1 - USD One</option>
                      <option value="VEILO">VEILO - Veilo Token</option>
                    </select>
                    {/* Token Icon */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {selectedToken === "SOL" && (
                        <img src={solLogo} alt="SOL" className="w-4 h-4" />
                      )}
                      {selectedToken === "USDC" && (
                        <img src={usdcLogo} alt="USDC" className="w-4 h-4" />
                      )}
                      {selectedToken === "USDT" && (
                        <img src={usdtLogo} alt="USDT" className="w-4 h-4" />
                      )}
                      {selectedToken === "USD1" && (
                        <img src={usd1Logo} alt="USD1" className="w-4 h-4" />
                      )}
                      {selectedToken === "VEILO" && (
                        <div className="w-4 h-4 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-neon-green">
                            V
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    RECIPIENT ADDRESS
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest mb-1.5">
                    AMOUNT (SOL)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-white/10 focus:border-neon-green/50 outline-none text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <CyberButton
                    onClick={onClose}
                    variant="secondary"
                    fullWidth
                    disabled={isProcessing}
                  >
                    CANCEL
                  </CyberButton>
                  <CyberButton
                    onClick={handleWithdraw}
                    variant="primary"
                    fullWidth
                    disabled={!recipient || !amount || isProcessing}
                  >
                    {isProcessing ? "PROCESSING..." : "WITHDRAW"}
                  </CyberButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
