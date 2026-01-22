import { useMutation, useQuery } from "@tanstack/react-query";
import {
  queryEncryptedNotes,
  saveEncryptedNote,
  getMerkleRoot,
  getMerkleTree,
  submitWithdraw,
  type QueryNotesRequest,
  type SaveEncryptedNoteRequest,
  type WithdrawRequest,
} from "../../lib/api/relayerApi";

// Query encrypted notes
export const useQueryNotes = (params?: QueryNotesRequest, enabled = true) => {
  return useQuery({
    queryKey: ["encrypted-notes", params],
    queryFn: () => queryEncryptedNotes(params),
    enabled,
  });
};

// Save encrypted note mutation
export const useSaveNote = () => {
  return useMutation({
    mutationFn: (data: SaveEncryptedNoteRequest) => saveEncryptedNote(data),
  });
};

// Get merkle root
export const useMerkleRoot = (mintAddress?: string, enabled = true) => {
  return useQuery({
    queryKey: ["merkle-root", mintAddress],
    queryFn: () => getMerkleRoot(mintAddress),
    enabled,
  });
};

// Get merkle tree
export const useMerkleTree = (mintAddress?: string, enabled = true) => {
  return useQuery({
    queryKey: ["merkle-tree", mintAddress],
    queryFn: () => getMerkleTree(mintAddress),
    enabled,
  });
};

// Submit withdrawal mutation
export const useWithdraw = () => {
  return useMutation({
    mutationFn: (data: WithdrawRequest) => submitWithdraw(data),
  });
};
