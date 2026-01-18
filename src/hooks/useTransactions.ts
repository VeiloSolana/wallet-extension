import { useCallback } from "react";
import { PublicKey } from "@solana/web3.js";

import { NoteManager } from "../lib/noteManager";
import { syncNotesFromRelayer } from "../lib/noteSync";
import { handleWithdraw } from "../lib/transactions/withdraw";
import { handleTransfer as handlePrivateTransfer } from "../lib/transactions/transfer";
import { TOKEN_MINTS, SOL_MINT } from "../lib/transactions/shared";
import { loadWallet } from "../utils/storage";
import { decrypt } from "../utils/encryption";
import { Wallet } from "../utils/wallet";

// ============================================================================
// Types
// ============================================================================

interface UseTransactionsParams {
  noteManager: NoteManager | null;
  wallet: Wallet | null;
  password: string;
  loadNotes: () => Promise<void>;
}

interface UseTransactionsReturn {
  handleSend: (recipient: string, amount: number, token: string) => Promise<void>;
  handleTransfer: (username: string, amount: number, token: string) => Promise<any>;
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

export function useTransactions({
  noteManager,
  wallet,
  password,
  loadNotes,
}: UseTransactionsParams): UseTransactionsReturn {

  // ---------------------------------------------------------------------------
  // Withdraw (internal - to external address)
  // ---------------------------------------------------------------------------
  const withdraw = useCallback(async (
    recipient: string,
    amount: number,
    token: string
  ) => {
    if (!noteManager || !wallet) {
      throw new Error("NoteManager or wallet not initialized");
    }

    try {
      // Get all notes from storage
      const allNotes = await noteManager.getAllNotes();

      // Get mint address for the selected token
      const mintAddress = TOKEN_MINTS[token];
      if (!mintAddress) {
        throw new Error(`Invalid token: ${token}`);
      }

      // Filter notes by selected token mint
      const notes = allNotes.filter((note) => {
        const noteMintStr = note.mintAddress?.toString() || "";
        const targetMintStr = mintAddress.toString();
        // Handle legacy SOL notes with empty mint address
        if (token === "SOL" && noteMintStr === "") {
          return true;
        }
        return noteMintStr === targetMintStr;
      });

      // Get veilo public key for the withdraw request
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("Wallet not found");
      }
      const veiloPublicKeyStr = await decrypt(
        storedWallet.encryptedVeiloPublicKey,
        password
      );

      // Get token info for decimals
      const tokenInfo = getTokenInfo(mintAddress.toString());
      console.log("🎯 Token info:", tokenInfo);

      // Call handleWithdraw with the veilo public key and mint address
      const result = await handleWithdraw(
        notes,
        recipient,
        amount,
        storedWallet.publicKey,
        mintAddress,
        tokenInfo.decimals
      );

      console.log("✅ Withdrawal complete:", result);

      // Sync notes from relayer to get the change note and updated spent status
      console.log("Syncing notes from relayer after withdrawal...");
      if (storedWallet) {
        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const privateKeyHex = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );

        await syncNotesFromRelayer(
          noteManager,
          wallet.payer.publicKey.toString(),
          privateKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
      }

      // Reload notes and update UI after sync
      await loadNotes();

      return result;
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    }
  }, [noteManager, wallet, password, loadNotes]);

  // ---------------------------------------------------------------------------
  // Send (public - wrapper around withdraw for UI)
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async (
    recipient: string,
    amount: number,
    token: string
  ) => {
    try {
      console.log(
        `Starting send operation: ${amount} ${token} to ${recipient}`
      );

      await withdraw(recipient, amount, token);

      console.log(`✅ Successfully sent ${amount} ${token} to ${recipient}`);
    } catch (error) {
      console.error("❌ Send failed:", error);
      throw error;
    }
  }, [withdraw]);

  // ---------------------------------------------------------------------------
  // Transfer (private transfer to username)
  // ---------------------------------------------------------------------------
  const handleTransfer = useCallback(async (
    username: string,
    amount: number,
    token: string
  ) => {
    if (!noteManager || !wallet) {
      throw new Error("NoteManager or wallet not initialized");
    }

    try {
      console.log(
        `Starting private transfer: ${amount} ${token} to @${username}`
      );

      // Get all notes from storage
      const allNotes = await noteManager.getAllNotes();
      console.log("📝 All notes:", allNotes.length, "notes found");
      console.log(
        "📝 Notes detail:",
        allNotes.map((n) => ({
          id: n.id?.slice(0, 8),
          mintAddress: n.mintAddress,
          spent: n.spent,
          amount: n.amount,
        }))
      );

      // Get mint address for the selected token
      const mintAddress = TOKEN_MINTS[token];
      if (!mintAddress) {
        throw new Error(`Invalid token: ${token}`);
      }
      console.log("🎯 Looking for notes with mintAddress:", mintAddress);

      // Filter notes by selected token mint
      const notes = allNotes.filter((note) => {
        const noteMintStr = note.mintAddress?.toString() || "";
        const targetMintStr = mintAddress.toString();
        // Handle legacy SOL notes with empty mint address
        if (token === "SOL" && noteMintStr === "") {
          return true;
        }
        return noteMintStr === targetMintStr;
      });
      console.log(
        "🎯 Filtered notes:",
        notes.length,
        "notes match mintAddress"
      );
      console.log(
        "🎯 Unspent filtered notes:",
        notes.filter((n) => !n.spent).length
      );

      // Get veilo public key for the transfer request
      const storedWallet = await loadWallet();
      if (!storedWallet) {
        throw new Error("Wallet not found");
      }

      // Get token info for decimals
      const tokenInfo = getTokenInfo(mintAddress.toString());
      console.log("🎯 Token info:", tokenInfo);

      // Call handlePrivateTransfer with the required parameters
      const result = await handlePrivateTransfer(
        notes,
        username,
        amount,
        storedWallet.publicKey,
        mintAddress,
        tokenInfo.decimals
      );

      console.log("✅ Private transfer complete:", result);

      // Sync notes from relayer to get the change note and updated spent status
      console.log("Syncing notes from relayer after transfer...");
      if (storedWallet) {
        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const privateKeyHex = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );
        const veiloPublicKeyStr = await decrypt(
          storedWallet.encryptedVeiloPublicKey,
          password
        );

        await syncNotesFromRelayer(
          noteManager,
          wallet.payer.publicKey.toString(),
          privateKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
      }

      // Reload notes and update UI after sync
      await loadNotes();

      return result;
    } catch (error) {
      console.error("❌ Transfer failed:", error);
      throw error;
    }
  }, [noteManager, wallet, password, loadNotes]);

  return {
    handleSend,
    handleTransfer,
  };
}
