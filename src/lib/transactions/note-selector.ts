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
 * Select optimal notes for withdrawal from a single tree
 * All selected notes must have the same treeId
 */
function selectNotesFromTree(
  notesWithBigInt: NoteWithBigInt[],
  notes: StoredNote[],
  withdrawAmountLamports: bigint,
  treeId: number
): NoteSelectionResult | null {
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
        message: `Using 1 note from tree ${treeId}: ${formatSol(
          note.amount
        )}. Change: ${formatSol(change)}`,
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
      message: `Using 2 notes from tree ${treeId}: ${formatSol(
        bestPair.note1.amount
      )} + ${formatSol(bestPair.note2.amount)} = ${formatSol(
        totalAmount
      )}. Change: ${formatSol(lowestChange)}`,
    };
  }

  // Strategy 3: Use multiple notes from the same tree (relayer will combine them)
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

  // Check if we have enough from this tree
  if (currentTotal < withdrawAmountLamports) {
    return null; // This tree doesn't have enough
  }

  const change = currentTotal - withdrawAmountLamports;
  return {
    success: true,
    selectedNotes: selectedNotes.map(
      (n) => notes.find((note) => note.id === n.id)!
    ),
    totalAmount: currentTotal,
    changeAmount: change,
    message: `Using ${
      selectedNotes.length
    } notes from tree ${treeId} totaling ${formatSol(
      currentTotal
    )}. Relayer will combine before withdrawal. Change: ${formatSol(change)}`,
  };
}

/**
 * Select optimal notes for withdrawal
 * Selects the minimum number of notes needed to cover the amount
 * All selected notes must have the same treeId (required by the circuit)
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

  // Calculate total balance across all trees
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

  // Group notes by treeId
  const notesByTree = new Map<number, NoteWithBigInt[]>();
  for (const note of notesWithBigInt) {
    const treeNotes = notesByTree.get(note.treeId) || [];
    treeNotes.push(note);
    notesByTree.set(note.treeId, treeNotes);
  }

  // Try to find the best selection from each tree
  // Prefer: 1 note > 2 notes > multiple notes, then lowest change
  let bestResult: NoteSelectionResult | null = null;

  for (const [treeId, treeNotes] of notesByTree) {
    const result = selectNotesFromTree(
      treeNotes,
      notes,
      withdrawAmountLamports,
      treeId
    );

    if (result) {
      // Compare with current best
      if (!bestResult) {
        bestResult = result;
      } else {
        // Prefer fewer notes, then lower change
        const currentNoteCount = bestResult.selectedNotes.length;
        const newNoteCount = result.selectedNotes.length;

        if (
          newNoteCount < currentNoteCount ||
          (newNoteCount === currentNoteCount &&
            result.changeAmount < bestResult.changeAmount)
        ) {
          bestResult = result;
        }
      }
    }
  }

  if (bestResult) {
    return bestResult;
  }

  // No single tree has enough funds
  // Calculate balance per tree for error message
  const treeBalances: string[] = [];
  for (const [treeId, treeNotes] of notesByTree) {
    const treeTotal = treeNotes.reduce((sum, n) => sum + n.amount, 0n);
    treeBalances.push(`Tree ${treeId}: ${formatSol(treeTotal)}`);
  }

  return {
    success: false,
    selectedNotes: [],
    totalAmount: totalBalance,
    changeAmount: 0n,
    message: `Insufficient balance in any single tree. Need ${formatSol(
      withdrawAmountLamports
    )} from one tree. Balances: ${treeBalances.join(
      ", "
    )}. Total across trees: ${formatSol(totalBalance)}`,
  };
}

/**
 * Format lamports as SOL string
 */
function formatSol(lamports: bigint): string {
  const sol = Number(lamports) / 1_000_000_000;
  return `${sol.toFixed(4)} SOL`;
}
