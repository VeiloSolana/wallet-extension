import type { StoredNote } from "../noteManager";
import { selectNotesForWithdrawal } from "./note-selector";
import { PublicKey } from "@solana/web3.js";
import { submitPrivateTransfer } from "../relayerApi";

export const handleTransfer = async (
  notes: StoredNote[],
  recipientUsername: string,
  amount: number,
  userPublicKey: string,
  mintAddress: PublicKey,
  decimals: number
) => {
  console.log(
    `Transferring ${amount} SOL privately to ${recipientUsername} from ${notes.length} notes`
  );

  // Filter unspent notes
  const unspentNotes = notes.filter((n) => !n.spent);

  if (unspentNotes.length === 0) {
    throw new Error("No unspent notes available");
  }

  console.log(
    "Private transfer initiated with",
    unspentNotes.length,
    "unspent notes"
  );

  // Convert amount to smallest unit (using token's decimals)
  const transferAmountSmallestUnit = BigInt(
    Math.floor(amount * Math.pow(10, decimals))
  );

  // Select the optimal notes for this transfer
  const selectionResult = selectNotesForWithdrawal(
    unspentNotes,
    transferAmountSmallestUnit
  );

  if (!selectionResult.success) {
    throw new Error(selectionResult.message);
  }

  console.log(`✓ ${selectionResult.message}`);
  console.log(
    `Selected ${selectionResult.selectedNotes.length} note(s) for transfer`
  );
  console.log(
    `Change: ${
      Number(selectionResult.changeAmount) / Math.pow(10, decimals)
    } tokens`
  );

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
  console.log(
    `Sending private transfer request to relayer for ${recipientUsername}...`
  );
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

  console.log("✅ Private transfer successful!");
  console.log(
    `Transferred ${result.data.transferAmount} SOL to ${result.data.recipient}`
  );
  console.log(`Change: ${result.data.senderChangeAmount} SOL`);
  console.log(`Transaction: ${result.data.txSignature}`);

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
