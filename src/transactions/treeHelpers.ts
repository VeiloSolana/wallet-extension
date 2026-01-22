import {
  getProgram,
  type PrivacyPoolProgram,
  type WalletAdapter,
} from "../../program/program";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface TreeInfo {
  treeId: number;
  leafCount: number;
  capacity: number;
  utilizationPercent: number;
  remainingCapacity: number;
  isFull: boolean;
  treePDA: PublicKey;
}

const TREE_HEIGHT = 22;
const TREE_CAPACITY = Math.pow(2, TREE_HEIGHT);
const MIN_CAPACITY_THRESHOLD = Math.floor(TREE_CAPACITY * 0.0001);

export function getTreePDA(
  programId: PublicKey,
  mintAddress: PublicKey,
  treeId: number,
): PublicKey {
  const treeIdBuffer = Buffer.alloc(2);
  treeIdBuffer.writeUInt16LE(treeId, 0);

  const [treePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_note_tree_v3"), mintAddress.toBuffer(), treeIdBuffer],
    programId,
  );

  return treePDA;
}

/**
 * Get the config PDA for a mint
 */
export function getConfigPDA(
  programId: PublicKey,
  mintAddress: PublicKey,
): PublicKey {
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("privacy_config_v3"), mintAddress.toBuffer()],
    programId,
  );

  return configPDA;
}

export async function getTreeInfo(
  program: PrivacyPoolProgram,
  mintAddress: PublicKey,
  treeId: number,
): Promise<TreeInfo | null> {
  try {
    const treePDA = getTreePDA(program.programId, mintAddress, treeId);
    const tree = await program.account.merkleTreeAccount.fetch(treePDA);

    const leafCount = tree.nextIndex;
    const utilizationPercent = (leafCount / TREE_CAPACITY) * 100;
    const remainingCapacity = TREE_CAPACITY - leafCount;

    return {
      treeId,
      leafCount,
      capacity: TREE_CAPACITY,
      utilizationPercent,
      remainingCapacity,
      isFull: leafCount >= TREE_CAPACITY,
      treePDA,
    };
  } catch {
    return null;
  }
}

export async function getAllTreeInfo(
  program: PrivacyPoolProgram,
  mintAddress: PublicKey,
): Promise<TreeInfo[]> {
  try {
    const configPDA = getConfigPDA(program.programId, mintAddress);
    const config = await program.account.privacyConfig.fetch(configPDA);
    const numTrees = config.numTrees;

    const allTreeInfo: TreeInfo[] = [];

    for (let treeId = 0; treeId < numTrees; treeId++) {
      const info = await getTreeInfo(program, mintAddress, treeId);
      if (info) {
        allTreeInfo.push(info);
      }
    }

    return allTreeInfo;
  } catch {
    return [];
  }
}

/**
 * Find the best tree for new deposits
 *
 * Strategy:
 * 1. Filter out full trees
 * 2. Prefer the LOWEST tree ID that has sufficient remaining capacity (>0.01% ≈ 419 leaves)
 * 3. This ensures sequential tree filling (0 → 1 → 2 → etc.)
 * 4. Only move to a higher tree when lower ones are nearly full
 * 5. Fallback to tree with most capacity if all are below threshold
 *
 * @param mintAddress - The mint address for the token
 * @param minCapacity - Minimum remaining capacity to prefer a tree (default: ~419, which is 0.01% of capacity)
 * @returns Tree info for the best tree, or null if all trees are full
 */
export async function getBestTreeForDeposit(
  mintAddress: PublicKey,
  minCapacity: number = MIN_CAPACITY_THRESHOLD,
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet | WalletAdapter,
): Promise<TreeInfo | null> {
  const program = getProgram(connection, wallet);
  const allTrees = await getAllTreeInfo(program, mintAddress);

  if (allTrees.length === 0) {
    return null;
  }

  const availableTrees = allTrees.filter((tree) => !tree.isFull);

  if (availableTrees.length === 0) {
    return null;
  }

  const sortedTrees = [...availableTrees].sort((a, b) => a.treeId - b.treeId);
  const treeWithSufficientCapacity = sortedTrees.find(
    (tree) => tree.remainingCapacity >= minCapacity,
  );

  if (treeWithSufficientCapacity) {
    return treeWithSufficientCapacity;
  }

  // Fallback: return tree with most remaining capacity
  return sortedTrees.reduce((best, current) => {
    return current.remainingCapacity > best.remainingCapacity ? current : best;
  });
}

export async function hasTreeCapacity(
  mintAddress: PublicKey,
  treeId: number,
  requiredSlots: number = 1,
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet | WalletAdapter,
): Promise<boolean> {
  const program = getProgram(connection, wallet);
  const treeInfo = await getTreeInfo(program, mintAddress, treeId);

  if (!treeInfo) {
    return false;
  }

  return treeInfo.remainingCapacity >= requiredSlots;
}

export async function getNumTrees(
  mintAddress: PublicKey,
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet | WalletAdapter,
): Promise<number> {
  try {
    const program = getProgram(connection, wallet);
    const configPDA = getConfigPDA(program.programId, mintAddress);
    const config = await program.account.privacyConfig.fetch(configPDA);
    return config.numTrees;
  } catch {
    return 0;
  }
}

export async function getTreesSummary(
  mintAddress: PublicKey,
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet | WalletAdapter,
): Promise<{
  totalTrees: number;
  totalCapacity: number;
  totalUsed: number;
  totalAvailable: number;
  averageUtilization: number;
  fullTrees: number;
  availableTrees: number;
}> {
  const program = getProgram(connection, wallet);
  const allTrees = await getAllTreeInfo(program, mintAddress);

  const totalTrees = allTrees.length;
  const totalCapacity = totalTrees * TREE_CAPACITY;
  const totalUsed = allTrees.reduce((sum, tree) => sum + tree.leafCount, 0);
  const totalAvailable = allTrees.reduce(
    (sum, tree) => sum + tree.remainingCapacity,
    0,
  );
  const averageUtilization =
    totalTrees > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  const fullTrees = allTrees.filter((tree) => tree.isFull).length;
  const availableTrees = allTrees.filter((tree) => !tree.isFull).length;

  return {
    totalTrees,
    totalCapacity,
    totalUsed,
    totalAvailable,
    averageUtilization,
    fullTrees,
    availableTrees,
  };
}
