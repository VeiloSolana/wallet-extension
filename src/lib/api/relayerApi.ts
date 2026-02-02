import axios from "axios";
import nacl from "tweetnacl";
import crypto from "crypto";
import util from "tweetnacl-util";

// Create Axios instance with default config
export const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  baseURL:
    import.meta.env.VITE_API_URL || "https://relayer-server.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Export as relayerApiClient for compatibility
export const relayerApiClient = api;

// Request interceptor (optional: add token if we were storing it in a variable,
// but we'll likely handle auth via headers automatically or explicit injection)
// For now, let's keep it simple.

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error format
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

const RELAYER_API_URL =
  import.meta.env.VITE_API_URL || "https://relayer-server.onrender.com";
// const RELAYER_API_URL = "http://localhost:8080"; // TODO: Load from config/storage
const RELAYER_PUBLIC_KEY = "utVxnA7zax09qJCZ7UJsa8PAOoWLRcCwOkdxg/ZGmD4=";

function encryptForRelayer(data: unknown): string {
  const relayerPublicKey = util.decodeBase64(RELAYER_PUBLIC_KEY);
  const ephemeralKeyPair = nacl.box.keyPair();

  const jsonString = JSON.stringify(data);
  const messageUint8 = util.decodeUTF8(jsonString);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encryptedBox = nacl.box(
    messageUint8,
    nonce,
    relayerPublicKey,
    ephemeralKeyPair.secretKey,
  );

  const fullPayload = new Uint8Array(
    ephemeralKeyPair.publicKey.length + nonce.length + encryptedBox.length,
  );

  fullPayload.set(ephemeralKeyPair.publicKey, 0);
  fullPayload.set(nonce, ephemeralKeyPair.publicKey.length);
  fullPayload.set(
    encryptedBox,
    ephemeralKeyPair.publicKey.length + nonce.length,
  );

  return util.encodeBase64(fullPayload);
}

export interface EncryptedNote {
  noteId: string;
  commitment: string;
  ephemeralPublicKey: string;
  encryptedBlob: string;
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
  spent?: boolean; // Whether this note has been spent
  onchainId?: string; // Groups notes belonging to the same on-chain transaction
}

export interface QueryNotesRequest {
  lastCheckedTimestamp?: number;
  limit?: number;
  offset?: number;
  walletPublicKey?: string; // Filter notes by recipient wallet
}

export interface QueryNotesResponse {
  success: boolean;
  notes: EncryptedNote[];
  total: number;
  limit: number;
  offset: number;
}

export interface SaveEncryptedNoteRequest {
  commitment: string;
  ephemeralPublicKey: string;
  encryptedBlob: string;
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
  recipientWalletPublicKey?: string;
}

export interface SaveEncryptedNoteResponse {
  success: boolean;
  noteId?: string;
  message?: string;
  error?: string;
  details?: string;
}

export async function queryEncryptedNotes(
  params: QueryNotesRequest = {},
): Promise<QueryNotesResponse> {
  try {
    const response = await fetch(`${RELAYER_API_URL}/api/notes/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error("Failed to query encrypted notes");
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error querying encrypted notes:", error);
    throw error;
  }
}

export async function saveEncryptedNote(
  data: SaveEncryptedNoteRequest,
): Promise<SaveEncryptedNoteResponse> {
  try {
    const response = await fetch(`${RELAYER_API_URL}/api/notes/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save encrypted note");
    }

    return result;
  } catch (error: unknown) {
    console.error("Error saving encrypted note:", error);
    throw error;
  }
}

export async function saveEncryptedNoteWithRetry(
  payload: SaveEncryptedNoteRequest,
  maxRetries = 3,
): Promise<SaveEncryptedNoteResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await saveEncryptedNote(payload);
    } catch (error) {
      if (
        (error as Error).message?.includes("DUPLICATE_COMMITMENT") ||
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error === "DUPLICATE_COMMITMENT"
      ) {
        return { success: true, message: "Note already saved" };
      }

      if (i === maxRetries - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      console.log(
        `Retrying save encrypted note (attempt ${i + 2}/${maxRetries})...`,
      );
    }
  }

  throw new Error("Failed to save encrypted note after retries");
}

export interface MerkleRootResponse {
  success: boolean;
  data: {
    root: string;
    nextIndex: number;
    treeId: number; // Legacy field for backward compatibility
    onChainTreeId: number; // New multi-tree field
    mintAddress: string;
  };
}

export interface MerkleTreeResponse {
  success: boolean;
  data: {
    treeId: number; // Legacy field for backward compatibility
    onChainTreeId: number; // New multi-tree field
    mintAddress: string;
    height: number;
    nextIndex: number;
    root: string;
    totalCommitments: number;
    leaves: Array<{
      commitment: string;
      index: number;
      txSignature: string;
      slot: number;
      timestamp: string;
    }>;
    reconstructionInfo: {
      instructions: string;
      treeHeight: number;
      hashFunction?: string;
    };
  };
}

export async function getMerkleRoot(
  mintAddress?: string,
  treeId?: number,
): Promise<MerkleRootResponse> {
  try {
    const params = new URLSearchParams();
    if (mintAddress) params.append("mintAddress", mintAddress);
    if (treeId !== undefined) params.append("treeId", treeId.toString());

    const url = params.toString()
      ? `${RELAYER_API_URL}/api/merkle/root?${params.toString()}`
      : `${RELAYER_API_URL}/api/merkle/root`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch merkle root");
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error fetching merkle root:", error);
    throw error;
  }
}

export async function getMerkleTree(
  mintAddress?: string,
  treeId?: number,
): Promise<MerkleTreeResponse> {
  try {
    const params = new URLSearchParams();
    if (mintAddress) params.append("mintAddress", mintAddress);
    if (treeId !== undefined) params.append("treeId", treeId.toString());

    const url = params.toString()
      ? `${RELAYER_API_URL}/api/merkle/tree?${params.toString()}`
      : `${RELAYER_API_URL}/api/merkle/tree`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch merkle tree");
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Error fetching merkle tree:", error);
    throw error;
  }
}

export interface Note {
  commitment: string;
  privateKey: string;
  publicKey: string;
  blinding: string;
  amount: string;
  nullifier: string;
  leafIndex?: number;
  noteId?: string;
}

export interface WithdrawRequest {
  notes: Note[];
  recipient: string;
  amount: string;
  userPublicKey: string;
  mintAddress: string;
}

export interface WithdrawResponse {
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
    spentNoteIds?: string[];
    txSignature?: string;
  };
}

export async function submitWithdraw(
  data: WithdrawRequest,
): Promise<WithdrawResponse> {
  try {
    // Encrypt the payload before sending
    const minifiedData = {
      ...data,
      timestamp: Date.now(), // Add timestamp to prevent replay attacks if not present
      nonce: crypto.randomBytes(32).toString("hex"), // Add this
    };
    const encryptedPayload = encryptForRelayer(minifiedData);

    const response = await fetch(`${RELAYER_API_URL}/api/transact/withdra`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Backend expects: { encryptedPayload: "base64..." }
      body: JSON.stringify({ encryptedPayload }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Extract error message from API response
      const errorMessage =
        result.error || result.message || "Withdrawal request failed";
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: unknown) {
    console.error("Error submitting withdrawal:", error);
    throw error;
  }
}

export interface PrivateTransferRequest {
  notes: Note[];
  amount: string; // Server expects string, not number
  recipientUsername: string;
  userPublicKey?: string;
  mintAddress?: string;
}

export interface PrivateTransferResponse {
  success: boolean;
  message: string;
  data?: {
    recipient: string;
    transferAmount: number;
    senderChangeAmount: number;
    txSignature: string;
    recipientNote: {
      commitment: string;
      amount: string;
      leafIndex: number;
      savedNoteId: string;
    };
    senderChangeNote: {
      commitment: string;
      privateKey: string;
      publicKey: string;
      blinding: string;
      amount: string;
      leafIndex: number;
      savedNoteId: string;
    } | null;
  };
}

export async function submitPrivateTransfer(
  data: PrivateTransferRequest,
): Promise<PrivateTransferResponse> {
  try {
    // Encrypt the payload before sending
    const minifiedData = {
      ...data,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(32).toString("hex"), // Add this
    };
    const encryptedPayload = encryptForRelayer(minifiedData);

    const response = await fetch(
      `${RELAYER_API_URL}/api/transact/private-transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Backend expects: { encryptedPayload: "base64..." }
        body: JSON.stringify({ encryptedPayload }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Extract error message from API response
      const errorMessage =
        result.error || result.message || "Private transfer request failed";
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: unknown) {
    console.error("Error submitting private transfer:", error);
    throw error;
  }
}

export interface VeiloPublicKeyResponse {
  success: boolean;
  username: string;
  pubK: string;
  veiloPublicKey: string;
}

export async function getVeiloPublicKey(
  username: string,
): Promise<VeiloPublicKeyResponse> {
  try {
    const response = await fetch(
      `${RELAYER_API_URL}/api/auth/veiloPublicKey?username=${encodeURIComponent(
        username,
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to get Veilo public key");
    }

    return result;
  } catch (error: unknown) {
    console.error("Error fetching Veilo public key:", error);
    throw error;
  }
}
