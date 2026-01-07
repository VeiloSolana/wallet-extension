
const RELAYER_API_URL = 'http://localhost:8080'; // TODO: Load from config/storage

export interface EncryptedNote {
  noteId: string;
  commitment: string;
  ephemeralPublicKey: string;
  encryptedBlob: string;
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to query encrypted notes');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error querying encrypted notes:', error);
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
