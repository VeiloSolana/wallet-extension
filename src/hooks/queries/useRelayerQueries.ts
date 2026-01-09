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
} from "../../lib/relayerApi";

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
export const useMerkleRoot = (enabled = true) => {
  return useQuery({
    queryKey: ["merkle-root"],
    queryFn: getMerkleRoot,
    enabled,
  });
};

// Get merkle tree
export const useMerkleTree = (enabled = true) => {
  return useQuery({
    queryKey: ["merkle-tree"],
    queryFn: getMerkleTree,
    enabled,
  });
};

// Submit withdrawal mutation
export const useWithdraw = () => {
  return useMutation({
    mutationFn: (data: WithdrawRequest) => submitWithdraw(data),
  });
};
