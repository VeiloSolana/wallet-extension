import type { StoredNote } from "../noteManager";
import { selectNotesForWithdrawal } from "./note-selector";
import { PublicKey } from "@solana/web3.js";
import { submitWithdraw } from "../relayerApi";

export const handleWithdraw = async (
  notes: StoredNote[],
  recipient: string,
  amount: number,
  userPublicKey: string,
  mintAddress: PublicKey,
  decimals: number
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

  // Convert amount to smallest unit (using token's decimals)
  const withdrawAmountSmallestUnit = BigInt(
    Math.floor(amount * Math.pow(10, decimals))
  );

  // Select the optimal notes for this withdrawal
  const selectionResult = selectNotesForWithdrawal(
    unspentNotes,
    withdrawAmountSmallestUnit
  );

  if (!selectionResult.success) {
    throw new Error(selectionResult.message);
  }

  console.log(`✓ ${selectionResult.message}`);
  console.log(
    `Selected ${selectionResult.selectedNotes.length} note(s) for withdrawal`
  );
  console.log(
    `Change: ${
      Number(selectionResult.changeAmount) / Math.pow(10, decimals)
    } tokens`
  );

  // Prepare notes for API - remove merklePath as it contains BigInt values
  // The relayer will rebuild the merkle tree anyway
  const notesForApi = selectionResult.selectedNotes.map((note) => {
    const { merklePath, ...noteWithoutPath } = note;
    return noteWithoutPath;
  });

  // Send withdrawal request to relayer
  console.log("Sending withdrawal request to relayer...");
  const result = await submitWithdraw({
    notes: notesForApi,
    recipient,
    amount: amount.toString(),
    userPublicKey,
    mintAddress: mintAddress.toBase58(),
  });

  if (!result.success || !result.data) {
    throw new Error(result.message || "Withdrawal failed");
  }

  console.log("✅ Withdrawal successful!");
  console.log(
    `Withdrew ${result.data.withdrawAmount} SOL to ${result.data.withdrawRecipient}`
  );
  console.log(`Change: ${result.data.changeAmount} SOL`);

  return {
    success: true,
    withdrawAmount: result.data.withdrawAmount,
    changeAmount: result.data.changeAmount,
    recipient: result.data.withdrawRecipient,
    spentNoteIds: selectionResult.selectedNotes.map((n) => n.id),
    txSignature: result.data.txSignature,
  };
};
