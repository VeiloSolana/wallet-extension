import { type MerkleTreeResponse } from "../../lib/api/relayerApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PoseidonHash = any;

function bytesToBigIntBE(bytes: Uint8Array): bigint {
  return BigInt("0x" + Buffer.from(bytes).toString("hex"));
}

export class OffchainMerkleTree {
  private leaves: Map<number, Uint8Array> = new Map();
  private levels: number;
  private poseidon: PoseidonHash;
  private zeros: Uint8Array[] = [];

  constructor(levels: number, poseidon: PoseidonHash) {
    this.levels = levels;
    this.poseidon = poseidon;

    let currentZero = new Uint8Array(32).fill(0);
    this.zeros.push(currentZero);

    for (let i = 0; i < levels; i++) {
      const zeroField = poseidon.F.e(bytesToBigIntBE(currentZero));
      const hash = poseidon([zeroField, zeroField]);
      const hashBytes = poseidon.F.toString(hash, 16).padStart(64, "0");
      currentZero = Uint8Array.from(Buffer.from(hashBytes, "hex"));
      this.zeros.push(currentZero);
    }
  }

  getZeros(): Uint8Array[] {
    return this.zeros;
  }

  get nextIndex(): number {
    return this.leaves.size;
  }

  insert(commitment: Uint8Array): number {
    const index = this.leaves.size;
    this.leaves.set(index, commitment);
    return index;
  }

  getNode(level: number, index: number): Uint8Array {
    if (level === 0) {
      return this.leaves.get(index) || this.zeros[0];
    }

    const left = this.getNode(level - 1, 2 * index);
    const right = this.getNode(level - 1, 2 * index + 1);

    const rangeStart = index * Math.pow(2, level);
    if (rangeStart >= this.leaves.size) {
      return this.zeros[level];
    }

    const leftField = this.poseidon.F.e(bytesToBigIntBE(left));
    const rightField = this.poseidon.F.e(bytesToBigIntBE(right));
    const hash = this.poseidon([leftField, rightField]);

    const hashBytes = this.poseidon.F.toString(hash, 16).padStart(64, "0");
    return Uint8Array.from(Buffer.from(hashBytes, "hex"));
  }

  getMerkleProof(leafIndex: number): {
    pathElements: bigint[];
    pathIndices: number[];
  } {
    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

      const sibling = this.getNode(level, siblingIndex);
      pathElements.push(bytesToBigIntBE(sibling));
      pathIndices.push(isLeft ? 0 : 1);

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }

  getRoot(): Uint8Array {
    return this.getNode(this.levels, 0);
  }
}

export function buildMerkleTree(
  treeData: MerkleTreeResponse["data"],
  poseidon: PoseidonHash,
): OffchainMerkleTree {
  const tree = new OffchainMerkleTree(treeData.height, poseidon);

  const sortedLeaves = [...treeData.leaves].sort((a, b) => a.index - b.index);

  for (const leaf of sortedLeaves) {
    const commitment = Buffer.from(leaf.commitment, "hex");
    tree.insert(new Uint8Array(commitment));
  }

  return tree;
}
