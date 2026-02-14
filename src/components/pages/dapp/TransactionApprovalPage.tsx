import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Connection,
  PublicKey,
  Transaction as SolanaTransaction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getDappWallets } from "../../../utils/dappWalletStorage";
import { loadWallet } from "../../../utils/storage";
import { CyberButton } from "../../common/ui/CyberButton";

// ============================================================================
// Types
// ============================================================================

interface PendingDAppRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  origin: string;
}

interface TransactionApprovalPageProps {
  request: PendingDAppRequest;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

interface SimulationResult {
  success: boolean;
  error?: string;
  logs?: string[];
  unitsConsumed?: number;
  fee?: number;
}

interface ParsedInstruction {
  programId: string;
  programName: string;
  data: string;
}

// ============================================================================
// Known Program IDs
// ============================================================================

const KNOWN_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "Token Program",
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: "Token-2022",
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: "Associated Token",
  ComputeBudget111111111111111111111111111111: "Compute Budget",
  MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr: "Memo Program",
  metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s: "Metaplex Metadata",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Orca Whirlpool",
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter v6",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum DEX v3",
};

import { getRpcEndpoint, getExplorerUrl } from "../../../lib/network";

// ============================================================================
// Component
// ============================================================================

export const TransactionApprovalPage = ({
  request,
  onApprove,
  onReject,
  isProcessing = false,
}: TransactionApprovalPageProps) => {
  const [connectingWallet, setConnectingWallet] = useState<{
    name: string;
    publicKey: string;
  } | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parsedInstructions, setParsedInstructions] = useState<
    ParsedInstruction[]
  >([]);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  // Fetch favicon from the requesting site
  useEffect(() => {
    // Use Google's favicon service (most reliable)
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${request.origin}&sz=64`;
    setFaviconUrl(googleFavicon);
  }, [request.origin]);

  // Parse transaction instructions
  const parseTransactionInstructions = (
    txBuffer: Uint8Array,
  ): ParsedInstruction[] => {
    const instructions: ParsedInstruction[] = [];

    try {
      // Try versioned transaction first
      const versionedTx = VersionedTransaction.deserialize(txBuffer);
      const message = versionedTx.message;
      const accountKeys = message.staticAccountKeys.map((k) => k.toString());

      for (const ix of message.compiledInstructions) {
        const programId = accountKeys[ix.programIdIndex];
        const programName = KNOWN_PROGRAMS[programId] || "Unknown";
        const dataStr = Buffer.from(ix.data).toString("base64").slice(0, 12);

        instructions.push({ programId, programName, data: dataStr });
      }
    } catch {
      try {
        const legacyTx = SolanaTransaction.from(txBuffer);

        for (const ix of legacyTx.instructions) {
          const programId = ix.programId.toString();
          const programName = KNOWN_PROGRAMS[programId] || "Unknown";
          const dataStr = Buffer.from(ix.data).toString("base64").slice(0, 12);

          instructions.push({ programId, programName, data: dataStr });
        }
      } catch (e) {
        console.error("Failed to parse transaction:", e);
      }
    }

    return instructions;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const storedWallet = await loadWallet();
        if (!storedWallet) return;

        const dappWallets = await getDappWallets();
        let name = "Main Account";
        let publicKey = storedWallet.publicKey;

        if (dappWallets.length > 0) {
          name = dappWallets[0].name;
          publicKey = dappWallets[0].publicKey;
        }

        setConnectingWallet({ name, publicKey });

        if (
          request.method === "signTransaction" ||
          request.method === "signAndSendTransaction"
        ) {
          const txData = request.params.transaction as number[];
          const txBuffer = new Uint8Array(txData);

          const instructions = parseTransactionInstructions(txBuffer);
          setParsedInstructions(instructions);

          await simulateTransaction(publicKey, txBuffer);
        } else {
          setIsSimulating(false);
        }
      } catch (error) {
        console.error("Failed to initialize", error);
        setIsSimulating(false);
      }
    };

    init();
  }, [request]);

  const simulateTransaction = async (
    userPublicKey: string,
    txBuffer: Uint8Array,
  ) => {
    try {
      const connection = new Connection(getRpcEndpoint(), "confirmed");
      let transaction: VersionedTransaction | SolanaTransaction;
      let isVersioned = false;

      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
        isVersioned = true;
      } catch {
        transaction = SolanaTransaction.from(txBuffer);
      }

      const userPubkey = new PublicKey(userPublicKey);

      let simulationResponse;
      if (isVersioned) {
        simulationResponse = await connection.simulateTransaction(
          transaction as VersionedTransaction,
          { sigVerify: false, replaceRecentBlockhash: true },
        );
      } else {
        const latestBlockhash = await connection.getLatestBlockhash();
        (transaction as SolanaTransaction).recentBlockhash =
          latestBlockhash.blockhash;
        (transaction as SolanaTransaction).feePayer = userPubkey;
        simulationResponse = await connection.simulateTransaction(
          transaction as SolanaTransaction,
        );
      }

      const { value } = simulationResponse;

      if (value.err) {
        setSimulation({
          success: false,
          error:
            typeof value.err === "string"
              ? value.err
              : JSON.stringify(value.err),
          logs: value.logs || [],
          unitsConsumed: value.unitsConsumed,
        });
      } else {
        setSimulation({
          success: true,
          logs: value.logs || [],
          unitsConsumed: value.unitsConsumed,
          fee: 5000,
        });
      }
    } catch (error) {
      console.error("Simulation failed:", error);
      setSimulation({
        success: false,
        error: error instanceof Error ? error.message : "Simulation failed",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const displayOrigin = request.origin
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const getTitle = () => {
    switch (request.method) {
      case "signTransaction":
        return "Sign Transaction";
      case "signAndSendTransaction":
        return "Sign & Send";
      default:
        return "Confirm Transaction";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen bg-black flex flex-col font-sans relative"
    >
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <h1 className="text-base font-medium text-white text-center tracking-tight">
          {getTitle()}
        </h1>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col px-5 py-5 overflow-y-auto">
        {/* Site Info */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-zinc-900/40 border border-white/10">
          <div className="w-10 h-10 bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
            {faviconUrl && !faviconError ? (
              <img
                src={faviconUrl}
                alt={`${displayOrigin} icon`}
                className="w-6 h-6 object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <svg
                className="w-5 h-5 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">
              {displayOrigin}
            </div>
            <div className="text-zinc-500 text-xs font-light">
              Requesting transaction signature
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="mb-4 p-3 bg-zinc-900/40 border border-white/10">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">
            Signing Wallet
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00FF00]/20 border border-[#00FF00]/30 flex items-center justify-center shadow-[0_0_8px_rgba(0,255,0,0.2)]">
              <span className="text-[10px] text-[#00FF00] font-bold">◆</span>
            </div>
            <span className="text-white text-sm font-light">
              {connectingWallet?.name || "Loading..."}
            </span>
            <span className="text-zinc-400 text-xs font-mono ml-auto">
              {connectingWallet
                ? formatAddress(connectingWallet.publicKey)
                : "..."}
            </span>
          </div>
        </div>

        {/* Simulation Status */}
        {isSimulating ? (
          <div className="mb-4 p-3 bg-zinc-900/40 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#00FF00] border-t-transparent animate-spin" />
              <span className="text-sm text-zinc-400 font-light">
                Simulating transaction...
              </span>
            </div>
          </div>
        ) : simulation && !simulation.success ? (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <div className="text-red-400 text-sm font-medium">
                  Simulation failed
                </div>
                <div className="text-red-400/70 text-xs mt-0.5 font-mono">
                  {simulation.error?.slice(0, 60)}...
                </div>
              </div>
            </div>
          </div>
        ) : simulation?.success ? (
          <div className="mb-4 p-3 bg-[#00FF00]/5 border border-[#00FF00]/20 shadow-[0_0_10px_rgba(0,255,0,0.05)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse" />
              <span className="text-[#00FF00] text-sm font-mono uppercase tracking-widest text-[10px]">
                Simulation OK
              </span>
            </div>
          </div>
        ) : null}

        {/* Network Fee */}
        <div className="mb-4 p-3 bg-zinc-900/40 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm font-light">
              Network Fee
            </span>
            <span className="text-white text-sm font-mono">
              {simulation?.fee
                ? `~${(simulation.fee / LAMPORTS_PER_SOL).toFixed(6)} SOL`
                : "< 0.00001 SOL"}
            </span>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-zinc-500 hover:text-[#00FF00] transition-colors w-full group"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span className="text-[10px] uppercase tracking-widest font-mono">
              Advanced ({parsedInstructions.length} instruction
              {parsedInstructions.length !== 1 ? "s" : ""})
            </span>
          </button>

          {showAdvanced && parsedInstructions.length > 0 && (
            <div className="mt-3 space-y-2">
              {parsedInstructions.map((ix, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-900/40 border border-white/10"
                >
                  <div className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono mb-2">
                    {ix.programName}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-xs font-light">
                        Program Id
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-xs font-mono">
                          {formatAddress(ix.programId)}
                        </span>
                        <a
                          href={getExplorerUrl("address", ix.programId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-[#00FF00] transition-colors"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-xs font-light">
                        Data
                      </span>
                      <span className="text-white text-xs font-mono">
                        {ix.data || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Warning */}
        <p className="text-center text-zinc-500 text-xs font-light mb-4">
          Only confirm if you trust this website.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <CyberButton
            onClick={onReject}
            disabled={isProcessing}
            variant="secondary"
            fullWidth
          >
            Cancel
          </CyberButton>
          <CyberButton
            onClick={onApprove}
            disabled={isProcessing || isSimulating}
            variant="primary"
            fullWidth
          >
            {isProcessing
              ? "Signing..."
              : simulation && !simulation.success
                ? "Sign Anyway"
                : "Confirm"}
          </CyberButton>
        </div>
      </div>
    </motion.div>
  );
};
