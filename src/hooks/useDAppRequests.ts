import { useState, useEffect, useCallback } from "react";
import { PublicKey, Transaction as SolanaTransaction, VersionedTransaction } from "@solana/web3.js";


import { NoteManager } from "../lib/noteManager";
import { handleTransfer as handlePrivateTransfer } from "../lib/transactions/transfer";
import { TOKEN_MINTS, SOL_MINT } from "../lib/transactions/shared";
import { loadWallet } from "../utils/storage";
import { Wallet } from "../utils/wallet";

// ============================================================================
// Types
// ============================================================================

export interface PendingDAppRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  origin: string;
}

interface UseDAppRequestsParams {
  noteManager: NoteManager | null;
  wallet: Wallet | null;
}

interface UseDAppRequestsReturn {
  pendingDAppRequest: PendingDAppRequest | null;
  isApprovalProcessing: boolean;
  handleDAppApproval: () => Promise<void>;
  handleDAppRejection: () => Promise<void>;
}

// ============================================================================
// Helper
// ============================================================================

const getTokenInfo = (
  mintAddress: string
): { symbol: string; decimals: number } => {
  const mint = mintAddress.toLowerCase();

  if (
    mint === SOL_MINT.toString().toLowerCase() ||
    mint === PublicKey.default.toString().toLowerCase()
  ) {
    return { symbol: "SOL", decimals: 9 };
  }

  for (const [symbol, address] of Object.entries(TOKEN_MINTS)) {
    if (address.toString().toLowerCase() === mint) {
      const decimals = symbol === "SOL" ? 9 : 6;
      return { symbol, decimals };
    }
  }

  return { symbol: "UNKNOWN", decimals: 9 };
};

// ============================================================================
// Hook
// ============================================================================

export function useDAppRequests({
  noteManager,
  wallet,
}: UseDAppRequestsParams): UseDAppRequestsReturn {
  const [pendingDAppRequest, setPendingDAppRequest] = useState<PendingDAppRequest | null>(null);
  const [isApprovalProcessing, setIsApprovalProcessing] = useState(false);

  // ---------------------------------------------------------------------------
  // Check for pending dApp requests on mount and listen for changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Skip if not in extension context
    if (typeof chrome === "undefined" || !chrome.storage) {
      console.log("Not in Chrome extension context, skipping dApp request check");
      return;
    }

    const checkPendingRequest = () => {
      chrome.storage.local.get(["pendingRequest"], (result) => {
        if (result.pendingRequest) {
          console.log("📱 Found pending dApp request:", result.pendingRequest);
          setPendingDAppRequest(result.pendingRequest as PendingDAppRequest);
        } else {
          setPendingDAppRequest(null);
        }
      });
    };

    // Check immediately
    checkPendingRequest();

    // Listen for storage changes (in case popup opens after request is made)
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.pendingRequest) {
        if (changes.pendingRequest.newValue) {
          console.log("📱 Storage changed - new pending request:", changes.pendingRequest.newValue);
          setPendingDAppRequest(changes.pendingRequest.newValue as PendingDAppRequest);
        } else {
          setPendingDAppRequest(null);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Handle dApp connection approval
  // ---------------------------------------------------------------------------
  const handleDAppApproval = useCallback(async () => {
    if (!pendingDAppRequest) return;

    setIsApprovalProcessing(true);
    try {
      // Get stored wallet info
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("No wallet found");
      }

      if (pendingDAppRequest.method === "connect") {
        // Get public key as array of bytes
        const publicKeyBytes = Array.from(
          new PublicKey(storedWallet.publicKey).toBytes()
        );

        // Add this site to connected sites
        const result = await chrome.storage.local.get(["connectedSites"]);
        const connectedSites: string[] = (result.connectedSites as string[] | undefined) || [];
        if (!connectedSites.includes(pendingDAppRequest.origin)) {
          connectedSites.push(pendingDAppRequest.origin);
        }

        // Store the wallet public key and connected sites
        await chrome.storage.local.set({
          connectedSites,
          walletPublicKey: publicKeyBytes,
        });

        // Send approval response to background script
        await chrome.runtime.sendMessage({
          type: "POPUP_RESPONSE",
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { publicKey: publicKeyBytes },
        });
      } else if (pendingDAppRequest.method === "signTransaction") {
        // Sign transaction
        if (!wallet) {
          throw new Error("Wallet not unlocked");
        }
        const keypair = wallet.payer;

        const txData = pendingDAppRequest.params.transaction as number[];
        const txBuffer = new Uint8Array(txData);

        let signedTxBytes: number[];

        try {
          // Try to deserialize as Versioned Transaction first
          const tx = VersionedTransaction.deserialize(txBuffer);
          tx.sign([keypair]);
          signedTxBytes = Array.from(tx.serialize());
        } catch (e) {
          console.log("Versioned transaction deserialization failed, trying legacy:", e);
          // Fallback to legacy
          const tx = SolanaTransaction.from(txBuffer);
          tx.sign(keypair);
          signedTxBytes = Array.from(tx.serialize() as Uint8Array);
        }

        await chrome.runtime.sendMessage({
          type: "POPUP_RESPONSE",
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { signedTransaction: signedTxBytes },
        });
      } else if (pendingDAppRequest.method === "sendShieldedTransaction") {
        if (!noteManager || !wallet) {
          throw new Error("Wallet not unlocked");
        }

        const { username, amount, mintAddress } = pendingDAppRequest.params as {
          username: string;
          amount: string;
          mintAddress?: string;
        };

        const mint = mintAddress || "So11111111111111111111111111111111111111112";
        const tokenInfo = getTokenInfo(mint);

        const notes = await noteManager.getAllNotes();

        const result = await handlePrivateTransfer(
          notes,
          username,
          parseFloat(amount),
          wallet.publicKey.toString(),
          new PublicKey(mint),
          tokenInfo.decimals
        );

        if (!result.success) throw new Error("Transfer failed");

        await chrome.runtime.sendMessage({
          type: "POPUP_RESPONSE",
          requestId: pendingDAppRequest.id,
          approved: true,
          response: { signature: result.txSignature },
        });
      } else if (pendingDAppRequest.method === "signAndSendTransaction") {
        // For signAndSend, we just sign and return signature for now (simpler flow)
        // Or strictly follow standard: sign, send, return signature.
        throw new Error("signAndSendTransaction not fully implemented yet");
      } else if (pendingDAppRequest.method === "signMessage") {
        // Handle signMessage
        throw new Error("signMessage not implemented yet");
      }

      // Clear pending request
      await chrome.storage.local.remove("pendingRequest");
      setPendingDAppRequest(null);

      console.log("✅ dApp request approved");
    } catch (error) {
      console.error("Failed to approve dApp request:", error);
      // Still send error response
      await chrome.runtime.sendMessage({
        type: "POPUP_RESPONSE",
        requestId: pendingDAppRequest.id,
        approved: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      await chrome.storage.local.remove("pendingRequest");
      setPendingDAppRequest(null);
    } finally {
      setIsApprovalProcessing(false);
    }
  }, [pendingDAppRequest, noteManager, wallet]);

  // ---------------------------------------------------------------------------
  // Handle dApp connection rejection
  // ---------------------------------------------------------------------------
  const handleDAppRejection = useCallback(async () => {
    if (!pendingDAppRequest) return;

    try {
      // Send rejection response to background script
      await chrome.runtime.sendMessage({
        type: "POPUP_RESPONSE",
        requestId: pendingDAppRequest.id,
        approved: false,
        error: "User rejected the request",
      });

      // Clear pending request
      await chrome.storage.local.remove("pendingRequest");
      setPendingDAppRequest(null);

      console.log("❌ dApp connection rejected");
    } catch (error) {
      console.error("Failed to reject dApp request:", error);
    }
  }, [pendingDAppRequest]);

  return {
    pendingDAppRequest,
    isApprovalProcessing,
    handleDAppApproval,
    handleDAppRejection,
  };
}
