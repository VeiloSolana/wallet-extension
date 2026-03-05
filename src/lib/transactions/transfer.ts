import type { StoredNote } from "../noteManager";
import { selectNotesForWithdrawal } from "./note-selector";
import { PublicKey } from "@solana/web3.js";
import { submitPrivateTransfer } from "../api/relayerApi";

export const handleTransfer = async (
  notes: StoredNote[],
  recipientUsername: string,
  amount: number,
  userPublicKey: string,
  mintAddress: PublicKey,
  decimals: number,
) => {
  // Filter unspent notes
  const unspentNotes = notes.filter((n) => !n.spent);

  if (unspentNotes.length === 0) {
    throw new Error("No unspent notes available");
  }

  // Convert amount to smallest unit (using token's decimals)
  const transferAmountSmallestUnit = BigInt(
    Math.floor(amount * Math.pow(10, decimals)),
  );

  // Select the optimal notes for this transfer
  const selectionResult = selectNotesForWithdrawal(
    unspentNotes,
    transferAmountSmallestUnit,
  );

  if (!selectionResult.success) {
    throw new Error(selectionResult.message);
  }

  // Prepare notes for API - remove merklePath as it contains BigInt values
  // The relayer will rebuild the merkle tree anyway
  // CRITICAL: Ensure treeId is set (defaults to 0 for legacy notes without treeId)
  const notesForApi = selectionResult.selectedNotes.map((note) => {
    const { merklePath, ...noteWithoutPath } = note;
    return {
      ...noteWithoutPath,
      treeId: noteWithoutPath.treeId ?? 0, // Default to tree 0 for legacy notes
    };
  });

  // Send private transfer request to relayer
  const result = await submitPrivateTransfer({
    notes: notesForApi,
    recipientUsername,
    amount: amount.toString(), // CRITICAL: Server expects string, not number
    userPublicKey,
    mintAddress: mintAddress.toBase58(),
  });

  if (!result.success || !result.data) {
    throw new Error(result.message || "Private transfer failed");
  }

  return {
    success: true,
    transferAmount: result.data.transferAmount,
    changeAmount: result.data.senderChangeAmount,
    recipient: result.data.recipient,
    spentNoteIds: selectionResult.selectedNotes.map((n) => n.id),
    txSignature: result.data.txSignature,
    changeNote: result.data.senderChangeNote,
    recipientNote: result.data.recipientNote,
  };
};
