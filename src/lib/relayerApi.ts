const RELAYER_API_URL = "http://localhost:8080"; // TODO: Load from config/storage

export interface EncryptedNote {
  noteId: string;
  commitment: string;
  ephemeralPublicKey: string;
  encryptedBlob: string;
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
  spent?: boolean; // Whether this note has been spent
}

export interface QueryNotesRequest {
  lastCheckedTimestamp?: number;
  limit?: number;
  offset?: number;
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
}

export interface SaveEncryptedNoteResponse {
  success: boolean;
  noteId?: string;
  message?: string;
  error?: string;
}

export async function queryEncryptedNotes(
  params: QueryNotesRequest = {}
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
  } catch (error: any) {
    console.error("Error querying encrypted notes:", error);
    throw error;
  }
}

export async function saveEncryptedNote(
  data: SaveEncryptedNoteRequest
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
  } catch (error: any) {
    console.error("Error saving encrypted note:", error);
    throw error;
  }
}

export interface MerkleRootResponse {
  success: boolean;
  data: {
    root: string;
    nextIndex: number;
    treeId: number;
  };
}

export interface MerkleTreeResponse {
  success: boolean;
  data: {
    treeId: number;
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
      hashFunction: string;
    };
  };
}

export async function getMerkleRoot(
  mintAddress?: string
): Promise<MerkleRootResponse> {
  try {
    const url = mintAddress
      ? `${RELAYER_API_URL}/api/merkle/root?mintAddress=${encodeURIComponent(
          mintAddress
        )}`
      : `${RELAYER_API_URL}/api/merkle/root`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch merkle root");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching merkle root:", error);
    throw error;
  }
}

export async function getMerkleTree(
  mintAddress?: string
): Promise<MerkleTreeResponse> {
  try {
    const url = mintAddress
      ? `${RELAYER_API_URL}/api/merkle/tree?mintAddress=${encodeURIComponent(
          mintAddress
        )}`
      : `${RELAYER_API_URL}/api/merkle/tree`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch merkle tree");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching merkle tree:", error);
    throw error;
  }
}

export interface WithdrawRequest {
  notes: any[];
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
  data: WithdrawRequest
): Promise<WithdrawResponse> {
  try {
    const response = await fetch(`${RELAYER_API_URL}/api/transact/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Extract error message from API response
      const errorMessage =
        result.error || result.message || "Withdrawal request failed";
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: any) {
    console.error("Error submitting withdrawal:", error);
    throw error;
  }
}

export interface PrivateTransferRequest {
  notes: any[];
  amount: number;
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
  data: PrivateTransferRequest
): Promise<PrivateTransferResponse> {
  try {
    const response = await fetch(
      `${RELAYER_API_URL}/api/transact/private-transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Extract error message from API response
      const errorMessage =
        result.error || result.message || "Private transfer request failed";
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: any) {
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
  username: string
): Promise<VeiloPublicKeyResponse> {
  try {
    const response = await fetch(
      `${RELAYER_API_URL}/api/auth/veiloPublicKey?username=${encodeURIComponent(
        username
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to get Veilo public key");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching Veilo public key:", error);
    throw error;
  }
}
