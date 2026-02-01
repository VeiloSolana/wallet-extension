import { useState, useEffect, useCallback } from "react";
import { Keypair } from "@solana/web3.js";
import { Wallet } from "../utils/wallet";
import { Buffer } from "buffer";


import { NoteManager } from "../lib/noteManager";
import { syncNotesFromRelayer } from "../lib/noteSync";
import { loadWallet } from "../utils/storage";
import { decrypt } from "../utils/encryption";
import { TOKEN_MINTS, SOL_MINT } from "../lib/transactions/shared";
import type { Transaction, NoteDetail } from "../types/transaction";

// Re-export so existing consumers that import from useNotes still work
export type { Transaction } from "../types/transaction";

export interface TokenBalances {
  sol: number;
  usdc: number;
  usdt: number;
  veilo: number;
}

interface UseNotesParams {
  noteManager: NoteManager | null;
  wallet: Wallet | null;
  password: string;
  isAuthenticated: boolean;
}

interface UseNotesReturn {
  balance: number;
  tokenBalances: TokenBalances;
  transactions: Transaction[];
  isSyncing: boolean;
  isLoadingNotes: boolean;
  loadNotes: () => Promise<void>;
  syncNotes: () => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
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
    mint === "11111111111111111111111111111111" // PublicKey.default
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

export function useNotes({
  noteManager,
  wallet,
  password,
  isAuthenticated,
}: UseNotesParams): UseNotesReturn {
  const [balance, setBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>({
    sol: 0,
    usdc: 0,
    usdt: 0,
    veilo: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // -------------------------------------------------------------------------
  // Load Notes
  // -------------------------------------------------------------------------
  const loadNotes = useCallback(async () => {
    if (!noteManager) {
      console.log("NoteManager not initialized");
      return;
    }

    setIsLoadingNotes(true);
    try {
      const notes = await noteManager.getAllNotes();

      // Calculate SOL balance
      const balanceBigInt = await noteManager.getBalance();
      setBalance(Number(balanceBigInt) / 1e9);

      // Calculate per-token balances
      const balances: TokenBalances = {
        sol: 0,
        usdc: 0,
        usdt: 0,
        veilo: 0,
      };

      notes.forEach((n) => {
        if (!n.spent) {
          const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
          const amount = Number(n.amount) / Math.pow(10, tokenInfo.decimals);
          if (tokenInfo.symbol === "SOL") {
            balances.sol += amount;
          } else if (tokenInfo.symbol === "USDC") {
            balances.usdc += amount;
          } else if (tokenInfo.symbol === "USDT") {
            balances.usdt += amount;
          } else if (tokenInfo.symbol === "VEILO") {
            balances.veilo += amount;
          }
        }
      });

      setTokenBalances(balances);
      console.log("📊 Token balances calculated:", balances);

      // Persist balances to chrome.storage for dApp access
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ tokenBalances: balances });
      }

      // Build NoteDetail for each note
      const noteDetails: (NoteDetail & { onchainId?: string; spent: boolean })[] = notes.map((n) => {
        const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
        return {
          id: n.id || n.commitment.slice(0, 8),
          amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
          rawAmount: n.amount,
          commitment: n.commitment,
          spent: n.spent,
          timestamp: n.timestamp,
          txSignature: n.txSignature,
          mintAddress: n.mintAddress || SOL_MINT.toString(),
          token: tokenInfo.symbol,
          onchainId: n.onchainId,
        };
      });

      // Partition: notes with onchainId (grouped) vs without (legacy/ungrouped)
      const grouped = new Map<string, typeof noteDetails>();
      const ungrouped: typeof noteDetails = [];

      for (const nd of noteDetails) {
        if (nd.onchainId) {
          const key = `${nd.onchainId}_${nd.mintAddress}`;
          const arr = grouped.get(key);
          if (arr) {
            arr.push(nd);
          } else {
            grouped.set(key, [nd]);
          }
        } else {
          ungrouped.push(nd);
        }
      }

      const noteTxs: Transaction[] = [];

      // Process grouped notes: compute net change
      for (const [, group] of grouped) {
        const received = group.filter((n) => !n.spent).reduce((sum, n) => sum + n.amount, 0);
        const spent = group.filter((n) => n.spent).reduce((sum, n) => sum + n.amount, 0);
        const netChange = received - spent;
        const type = netChange < 0 ? "send" : "receive";
        const amount = Math.abs(netChange);
        const latest = group.reduce((a, b) => (b.timestamp > a.timestamp ? b : a));
        const first = group[0];

        noteTxs.push({
          id: first.onchainId!,
          txSignature: latest.txSignature,
          type: type as "send" | "receive",
          amount,
          timestamp: latest.timestamp,
          status: "confirmed",
          address: "Shielded Pool",
          token: first.token,
          mintAddress: first.mintAddress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          notes: group.map(({ onchainId: _onchainId, ...rest }) => rest),
          noteCount: group.length,
        });
      }

      // Process ungrouped notes: each becomes its own transaction
      for (const nd of ungrouped) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onchainId: _onchainId, ...detail } = nd;
        noteTxs.push({
          id: nd.id,
          txSignature: nd.txSignature,
          type: nd.spent ? "send" : "receive",
          amount: nd.amount,
          timestamp: nd.timestamp,
          status: "confirmed",
          address: "Shielded Pool",
          token: nd.token,
          mintAddress: nd.mintAddress,
          notes: [detail],
          noteCount: 1,
        });
      }

      // Sort by timestamp descending (newest first)
      setTransactions((prev) =>
        [...prev.filter((t) => t.address !== "Shielded Pool"), ...noteTxs].sort(
          (a, b) => b.timestamp - a.timestamp
        )
      );
    } catch (e) {
      console.error("Failed to load notes", e);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [noteManager]);

  // -------------------------------------------------------------------------
  // Sync Notes from Relayer
  // -------------------------------------------------------------------------
  const syncNotes = useCallback(async () => {
    if (isSyncing) return;
    if (!noteManager) {
      console.error("NoteManager not initialized");
      return;
    }

    setIsSyncing(true);
    try {
      if (wallet && "payer" in wallet) {
        const storedWallet = await loadWallet();
        if (!storedWallet) {
          console.error("No wallet found");
          return;
        }

        console.log("Syncing notes from relayer...");
        const notes = await noteManager.getAllNotes();
        console.log(`Currently have ${notes.length} notes stored locally`);

        // Decrypt the wallet private key
        const secretKeyStr = await decrypt(
          storedWallet.encryptedSecretKey,
          password
        );
        const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
        const keypair = Keypair.fromSecretKey(secretKey);
        const walletInstance = new Wallet(keypair);

        const privKeyHex = Buffer.from(walletInstance.payer.secretKey).toString(
          "hex"
        );

        const veiloPrivateKeyStr = await decrypt(
          storedWallet.encryptedVeiloPrivateKey,
          password
        );
        const veiloPublicKeyStr = await decrypt(
          storedWallet.encryptedVeiloPublicKey,
          password
        );

        const count = await syncNotesFromRelayer(
          noteManager,
          walletInstance.payer.publicKey.toString(),
          privKeyHex,
          veiloPrivateKeyStr,
          veiloPublicKeyStr
        );
        console.log(`Synced ${count} new notes`);
        await loadNotes();
      } else {
        console.log("Cannot sync: Wallet not unlocked or key unavailable");
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  }, [noteManager, wallet, password, loadNotes, isSyncing]);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Load notes on authentication
  useEffect(() => {
    if (isAuthenticated && noteManager) {
      console.log("🔄 Loading notes on authentication...");
      loadNotes();
    }
  }, [isAuthenticated, noteManager, loadNotes]);

  // Auto-refresh notes every 15 seconds
  useEffect(() => {
    if (!isAuthenticated || !noteManager || !wallet) return;

    const intervalId = setInterval(async () => {
      console.log("🔄 Auto-refreshing notes...");
      await syncNotes();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, noteManager, wallet, syncNotes]);

  return {
    balance,
    tokenBalances,
    transactions,
    isSyncing,
    isLoadingNotes,
    loadNotes,
    syncNotes,
    setTransactions,
  };
}
