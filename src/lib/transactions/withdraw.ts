import type { StoredNote } from "../noteManager";
import { selectNotesForWithdrawal } from "./note-selector";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const RELAYER_API_URL = "http://localhost:8080";

interface WithdrawResponse {
  success: boolean;
  message: string;
  data?: {
    withdrawRecipient: string;
    withdrawAmount: number;
    changeAmount: number;
    changeNote: {
      commitment: string;
      privateKey: string;
      publicKey: string;
      blinding: string;
      amount: string;
      nullifier: string;
    };
    spentNoteIds?: string[]; // IDs of notes that were spent
    txSignature?: string; // Transaction signature
  };
}

export const handleWithdraw = async (
  notes: StoredNote[],
  recipient: string,
  amount: number,
  userPublicKey: string
) => {
  console.log(
    `Withdrawing ${amount} SOL to ${recipient} from ${notes.length} notes`
  );

  // Filter unspent notes
  const unspentNotes = notes.filter((n) => !n.spent);

  if (unspentNotes.length === 0) {
    throw new Error("No unspent notes available");
  }

  console.log(
    "Withdrawal initiated with",
    unspentNotes.length,
    "unspent notes"
  );

  // Convert amount to lamports
  const withdrawAmountLamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));

  // Select the optimal notes for this withdrawal
  const selectionResult = selectNotesForWithdrawal(
    unspentNotes,
    withdrawAmountLamports
  );

  if (!selectionResult.success) {
    throw new Error(selectionResult.message);
  }

  console.log(`✓ ${selectionResult.message}`);
  console.log(
    `Selected ${selectionResult.selectedNotes.length} note(s) for withdrawal`
  );
  console.log(
    `Change: ${Number(selectionResult.changeAmount) / LAMPORTS_PER_SOL} SOL`
  );

  // Prepare notes for API - remove merklePath as it contains BigInt values
  // The relayer will rebuild the merkle tree anyway
  const notesForApi = selectionResult.selectedNotes.map((note) => {
    const { merklePath, ...noteWithoutPath } = note;
    return noteWithoutPath;
  });

  // Send withdrawal request to relayer
  console.log("Sending withdrawal request to relayer...");
  const response = await fetch(`${RELAYER_API_URL}/api/transact/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notes: notesForApi,
      recipient,
      amount: amount.toString(),
      userPublicKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Withdrawal request failed");
  }

  const result: WithdrawResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.message || "Withdrawal failed");
  }

  console.log("✅ Withdrawal successful!");
  console.log(
    `Withdrew ${result.data.withdrawAmount} SOL to ${result.data.withdrawRecipient}`
  );
  console.log(`Change: ${result.data.changeAmount} SOL`);

  // Note: The change note is already saved on the relayer
  // It will be synced in the next syncNotesFromRelayer call

  return {
    success: true,
    withdrawAmount: result.data.withdrawAmount,
    changeAmount: result.data.changeAmount,
    recipient: result.data.withdrawRecipient,
    spentNoteIds: selectionResult.selectedNotes.map((n) => n.id),
    txSignature: result.data.txSignature,
  };
};
