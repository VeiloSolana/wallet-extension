// Note selection utilities for withdrawals
// Handles the 2-in-2-out circuit constraint

import type { StoredNote } from "../noteManager";

// Working note type with bigint amount for calculations
interface NoteWithBigInt extends Omit<StoredNote, "amount"> {
  amount: bigint;
}

export interface NoteSelectionResult {
  success: boolean;
  selectedNotes: StoredNote[];
  totalAmount: bigint;
  changeAmount: bigint;
  message: string;
}

/**
 * Select optimal notes for withdrawal
 * Selects the minimum number of notes needed to cover the amount
 * The relayer will handle combining if more than 2 notes are selected
 */
export function selectNotesForWithdrawal(
  notes: StoredNote[],
  withdrawAmountLamports: bigint
): NoteSelectionResult {
  if (notes.length === 0) {
    return {
      success: false,
      selectedNotes: [],
      totalAmount: 0n,
      changeAmount: 0n,
      message: "No notes available",
    };
  }

  // Convert string amounts to bigint for calculations
  const notesWithBigInt: NoteWithBigInt[] = notes.map((n) => ({
    ...n,
    amount: BigInt(n.amount),
  }));

  // Calculate total balance
  const totalBalance = notesWithBigInt.reduce((sum, n) => sum + n.amount, 0n);

  if (totalBalance < withdrawAmountLamports) {
    return {
      success: false,
      selectedNotes: [],
      totalAmount: totalBalance,
      changeAmount: 0n,
      message: `Insufficient balance. Have ${formatSol(
        totalBalance
      )}, need ${formatSol(withdrawAmountLamports)}`,
    };
  }

  // Sort by amount (largest first)
  const sorted = [...notesWithBigInt].sort((a, b) =>
    Number(b.amount - a.amount)
  );

  // Strategy 1: Try to find a single note that covers the amount
  for (const note of sorted) {
    if (note.amount >= withdrawAmountLamports) {
      const change = note.amount - withdrawAmountLamports;
      return {
        success: true,
        selectedNotes: [notes.find((n) => n.id === note.id)!],
        totalAmount: note.amount,
        changeAmount: change,
        message: `Using 1 note: ${formatSol(note.amount)}. Change: ${formatSol(
          change
        )}`,
      };
    }
  }

  // Strategy 2: Try to find 2 notes that cover the amount
  let bestPair: { note1: NoteWithBigInt; note2: NoteWithBigInt } | null = null;
  let lowestChange = BigInt(Number.MAX_SAFE_INTEGER);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const combined = sorted[i].amount + sorted[j].amount;
      if (combined >= withdrawAmountLamports) {
        const change = combined - withdrawAmountLamports;
        if (change < lowestChange) {
          lowestChange = change;
          bestPair = { note1: sorted[i], note2: sorted[j] };
        }
      }
    }
  }

  if (bestPair) {
    const totalAmount = bestPair.note1.amount + bestPair.note2.amount;
    return {
      success: true,
      selectedNotes: [
        notes.find((n) => n.id === bestPair.note1.id)!,
        notes.find((n) => n.id === bestPair.note2.id)!,
      ],
      totalAmount,
      changeAmount: lowestChange,
      message: `Using 2 notes: ${formatSol(
        bestPair.note1.amount
      )} + ${formatSol(bestPair.note2.amount)} = ${formatSol(
        totalAmount
      )}. Change: ${formatSol(lowestChange)}`,
    };
  }

  // Strategy 3: Use multiple notes (relayer will combine them)
  // Greedy algorithm: take largest notes until we have enough
  const selectedNotes: NoteWithBigInt[] = [];
  let currentTotal = 0n;

  for (const note of sorted) {
    selectedNotes.push(note);
    currentTotal += note.amount;
    if (currentTotal >= withdrawAmountLamports) {
      break;
    }
  }

  const change = currentTotal - withdrawAmountLamports;
  return {
    success: true,
    selectedNotes: selectedNotes.map(
      (n) => notes.find((note) => note.id === n.id)!
    ),
    totalAmount: currentTotal,
    changeAmount: change,
    message: `Using ${selectedNotes.length} notes totaling ${formatSol(
      currentTotal
    )}. Relayer will combine before withdrawal. Change: ${formatSol(change)}`,
  };
}

/**
 * Format lamports as SOL string
 */
function formatSol(lamports: bigint): string {
  const sol = Number(lamports) / 1_000_000_000;
  return `${sol.toFixed(4)} SOL`;
}
