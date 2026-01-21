import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const relayerApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_RELAYER_API_URL || "http://localhost:8080",
  // "https://relayer-server.onrender.com",
  // "https://relayer-server.onrender.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const relayerApiClient = relayerApi;

export interface MerkleRootResponse {
  success: boolean;
  data: {
    root: string;
    nextIndex: number;
    treeId: number; // Legacy field
    onChainTreeId?: number; // New multi-tree field
    mintAddress?: string;
  };
}

export interface MerkleTreeResponse {
  success: boolean;
  data: {
    treeId: number; // Legacy field
    onChainTreeId?: number; // New multi-tree field
    mintAddress?: string;
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
    };
  };
}

export function useMerkleRoot(mintAddress?: string, treeId?: number) {
  return useQuery<MerkleRootResponse>({
    queryKey: ["merkle", "root", mintAddress, treeId],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (mintAddress) params.mintAddress = mintAddress;
      if (treeId !== undefined) params.treeId = treeId;
      const { data } = await relayerApi.get("/api/merkle/root", { params });
      return data;
    },
    staleTime: 30000,
  });
}

export function useMerkleTree(mintAddress?: string, treeId?: number) {
  return useQuery<MerkleTreeResponse>({
    queryKey: ["merkle", "tree", mintAddress, treeId],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (mintAddress) params.mintAddress = mintAddress;
      if (treeId !== undefined) params.treeId = treeId;
      const { data } = await relayerApi.get("/api/merkle/tree", { params });
      return data;
    },
    staleTime: 30000,
  });
}

export async function getMerkleRoot(
  mintAddress?: string,
  treeId?: number,
): Promise<MerkleRootResponse> {
  const params: Record<string, string | number> = {};
  if (mintAddress) params.mintAddress = mintAddress;
  if (treeId !== undefined) params.treeId = treeId;
  const { data } = await relayerApi.get("/api/merkle/root", { params });
  return data;
}

export async function getMerkleTree(
  mintAddress?: string,
  treeId?: number,
): Promise<MerkleTreeResponse> {
  const params: Record<string, string | number> = {};
  if (mintAddress) params.mintAddress = mintAddress;
  if (treeId !== undefined) params.treeId = treeId;
  const { data } = await relayerApi.get("/api/merkle/tree", { params });
  return data;
}

export interface VeiloPublicKeyResponse {
  success: boolean;
  username: string;
  veiloPublicKey: string;
  pubK: string;
}

export async function getVeiloPublicKey(
  username: string,
): Promise<VeiloPublicKeyResponse> {
  const { data } = await relayerApi.get(
    `/api/auth/veiloPublicKey?username=${encodeURIComponent(username)}`,
  );
  return data;
}

export interface EncryptedNotePayload {
  commitment: string;
  ephemeralPublicKey: string;
  encryptedBlob: string;
  timestamp: number;
  blockHeight?: number;
  txSignature?: string;
  recipientWalletPublicKey?: string;
}

export interface EncryptedNoteResponse {
  success: boolean;
  noteId?: string;
  message?: string;
  error?: string;
  details?: string;
}

export async function saveEncryptedNote(
  payload: EncryptedNotePayload,
): Promise<EncryptedNoteResponse> {
  try {
    const { data } = await relayerApi.post<EncryptedNoteResponse>(
      "/api/notes/save",
      payload,
    );
    return data;
  } catch (error) {
    console.error("Failed to save encrypted note:", error);
    throw error;
  }
}

export async function saveEncryptedNoteWithRetry(
  payload: EncryptedNotePayload,
  maxRetries = 3,
): Promise<EncryptedNoteResponse> {
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
