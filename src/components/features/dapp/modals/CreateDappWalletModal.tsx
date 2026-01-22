import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateDappWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    fundAmount: string,
    shouldDeposit: boolean,
    publicKey?: string,
  ) => Promise<{ privateKey: string; publicKey: string }>; // Returns private key and public key
  availableBalance: number;
}

export const CreateDappWalletModal = ({
  isOpen,
  onClose,
  onCreate,
  availableBalance,
}: CreateDappWalletModalProps) => {
  const [dappName, setDappName] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [step, setStep] = useState<"form" | "privateKey" | "depositing">(
    "form",
  );
  const [privateKey, setPrivateKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [walletData, setWalletData] = useState<{
    publicKey: string;
    fundAmount: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dappName.trim()) {
      setIsCreating(true);
      try {
        const { privateKey: pk, publicKey } = await onCreate(
          dappName.trim(),
          fundAmount,
          false,
        ); // false = don't deposit yet
        setPrivateKey(pk);
        setWalletData({ publicKey, fundAmount });
        setStep("privateKey");
      } catch (error) {
        console.error("Failed to create wallet:", error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleProceedWithDeposit = async () => {
    if (
      walletData &&
      walletData.fundAmount &&
      parseFloat(walletData.fundAmount) > 0
    ) {
      setStep("depositing");
      try {
        await onCreate("", walletData.fundAmount, true, walletData.publicKey); // true = deposit now
        handleClose();
      } catch (error) {
        console.error("Failed to deposit:", error);
        alert("Wallet created but deposit failed. You can fund it later.");
        handleClose();
      }
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setDappName("");
    setFundAmount("");
    setStep("form");
    setPrivateKey("");
    setIsCreating(false);
    setWalletData(null);
    onClose();
  };

  const handleCopyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey);
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
            onClick={handleClose}
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
              {/* Header */}
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neon-green">
                  {step === "form"
                    ? "CREATE DAPP WALLET"
                    : step === "privateKey"
                      ? "WALLET CREATED"
                      : "DEPOSITING..."}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-white transition-colors"
                  disabled={isCreating || step === "depositing"}
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

              {step === "form" ? (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Dapp Name */}
                  <div>
                    <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-2">
                      DAPP NAME
                    </p>
                    <input
                      type="text"
                      value={dappName}
                      onChange={(e) => setDappName(e.target.value)}
                      placeholder="e.g. Uniswap, Jupiter"
                      className="w-full bg-zinc-900/60 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/40 transition-colors"
                      required
                    />
                  </div>

                  {/* Fund Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-zinc-400 font-mono tracking-widest">
                        FUND AMOUNT (OPTIONAL)
                      </p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Available: {availableBalance.toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={fundAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setFundAmount(value);
                          }
                        }}
                        placeholder="0.0"
                        className="w-full bg-zinc-900/60 border border-white/10 px-3 py-2 pr-14 text-sm font-mono text-white placeholder:text-zinc-600 outline-none focus:border-white/40 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-400">
                        SOL
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                      Leave empty to create unfunded wallet
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isCreating}
                      className="flex-1 px-3 py-1.5 bg-zinc-900/60 border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800/60 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!dappName.trim() || isCreating}
                      className="flex-1 px-3 py-1.5 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                </form>
              ) : step === "privateKey" ? (
                /* Private Key Display */
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="text-[10px] font-mono text-yellow-200">
                        SAVE THIS PRIVATE KEY - It will only be shown once!
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-zinc-400 font-mono tracking-widest mb-2">
                      PRIVATE KEY
                    </p>
                    <div className="relative">
                      <div className="w-full bg-zinc-900/60 border border-white/10 px-3 py-2.5 text-xs font-mono text-white break-all">
                        {privateKey}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPrivateKey}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                      Keep this safe and never share it with anyone
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedWithDeposit}
                    className="w-full px-3 py-1.5 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all"
                  >
                    {walletData?.fundAmount &&
                    parseFloat(walletData.fundAmount) > 0
                      ? "Continue & Fund Wallet"
                      : "Done"}
                  </button>
                </div>
              ) : (
                /* Depositing step */
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <svg
                    className="animate-spin h-12 w-12 text-neon-green"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-sm font-mono text-zinc-400">
                    Funding wallet with {walletData?.fundAmount} SOL...
                  </p>
                  <p className="text-xs font-mono text-zinc-500">
                    Please wait, do not close this window
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
