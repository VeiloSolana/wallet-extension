/**
 * Private Swap Handler (Relayer-based)
 *
 * Delegates swap execution to the relayer server which handles:
 * - ZK proof generation
 * - Jupiter quote + swap instruction
 * - Transaction build, sign, and submit
 *
 * The extension only selects notes, builds the request, and marks notes spent.
 */

import { PublicKey, Connection } from "@solana/web3.js";
import type { WalletAdapter } from "../../../program/program";
import type { NoteManager } from "../noteManager";
import { selectNotesForWithdrawal } from "../transactions/note-selector";
import { getTokenMints } from "../network";
import { getTokenDecimals, fromRawAmount } from "./config";
import type { SwapQuote, SwapResult } from "./types";
import { submitPrivateSwap } from "../api/relayerApi";

// Wrapped SOL mint (on-chain programs use this, not PublicKey.default)
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

/**
 * Map a token symbol to its on-chain mint address for the pool.
 */
function symbolToOnChainMint(symbol: string): PublicKey {
  const mints = getTokenMints();
  switch (symbol.toUpperCase()) {
    case "SOL":
      return WSOL_MINT;
    case "USDC":
      return mints.USDC_MINT;
    case "USDT":
      return mints.USDT_MINT;
    default:
      throw new Error(`Unsupported token for private swap: ${symbol}`);
  }
}

// ============================================================================
// Main Private Swap Executor
// ============================================================================

export interface PrivateSwapParams {
  connection: Connection;
  wallet: WalletAdapter;
  noteManager: NoteManager;
  /** The note owner's derived ZK public key (used as dest note owner) */
  publicKey: bigint;
  /** Source token symbol (e.g. "SOL") */
  inputSymbol: string;
  /** Destination token symbol (e.g. "USDC") */
  outputSymbol: string;
  /** Amount to swap in raw units (lamports / smallest unit) */
  swapAmountRaw: bigint;
  /** Jupiter quote (must have rawQuote) */
  quote: SwapQuote;
  /** Slippage in basis points */
  slippageBps: number;
}

/**
 * Execute a private swap by delegating to the relayer server.
 */
export async function executePrivateSwap(
  params: PrivateSwapParams,
): Promise<SwapResult> {
  const {
    wallet,
    noteManager,
    publicKey,
    inputSymbol,
    outputSymbol,
    swapAmountRaw,
    quote,
    slippageBps,
  } = params;

  try {
    // 1. Resolve mints
    const sourceMint = symbolToOnChainMint(inputSymbol);
    const destMint = symbolToOnChainMint(outputSymbol);

    // The note manager stores SOL notes under PublicKey.default
    const sourceNoteMint =
      inputSymbol === "SOL"
        ? PublicKey.default.toBase58()
        : sourceMint.toBase58();

    // 2. Select notes from source pool
    const unspentNotes =
      await noteManager.getUnspentNotesByMint(sourceNoteMint);
    const selection = selectNotesForWithdrawal(unspentNotes, swapAmountRaw);
    if (!selection.success) {
      return {
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: `Insufficient private balance: ${selection.message}`,
      };
    }

    // 3. Build request for relayer
    // Map notes to the format the relayer expects (with hex strings)
    const notesForRelayer = selection.selectedNotes.map((note) => ({
      id: note.id,
      amount: note.amount,
      commitment: note.commitment,
      nullifier: note.nullifier,
      blinding: note.blinding,
      privateKey: note.privateKey,
      publicKey: note.publicKey,
      leafIndex: note.leafIndex,
      timestamp: note.timestamp,
      spent: note.spent,
      treeId: note.treeId,
    }));

    const minAmountOut = quote.minimumReceived;

    // 4. Submit to relayer
    const result = await submitPrivateSwap({
      notes: notesForRelayer,
      sourceMintAddress: sourceMint.toBase58(),
      destMintAddress: destMint.toBase58(),
      swapAmountRaw: swapAmountRaw.toString(),
      minAmountOut,
      slippageBps,
      userPublicKey: wallet.publicKey.toBase58(),
      veiloPublicKey: publicKey.toString(),
    });

    if (!result.success) {
      return {
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: result.message || "Swap failed on relayer",
      };
    }

    // 5. Mark spent notes locally
    for (const note of selection.selectedNotes) {
      await noteManager.markAsSpent(note.id, result.data?.txSignature || "");
    }

    // 6. Return result
    const inputDecimals = getTokenDecimals(
      inputSymbol === "SOL"
        ? PublicKey.default.toBase58()
        : sourceMint.toBase58(),
    );
    const outputDecimals = getTokenDecimals(destMint.toBase58());

    return {
      success: true,
      txSignature: result.data?.txSignature,
      inputSpent: fromRawAmount(swapAmountRaw.toString(), inputDecimals),
      outputReceived: fromRawAmount(
        result.data?.outputAmount || minAmountOut,
        outputDecimals,
      ),
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Private swap failed:", error);
    return {
      success: false,
      inputSpent: "0",
      outputReceived: "0",
      error: errorMsg || "Private swap failed",
    };
  }
}
