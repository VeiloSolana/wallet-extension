import { useState, useEffect, useCallback } from "react";
import { Keypair } from "@solana/web3.js";
import { Wallet } from "../utils/wallet";
import { Buffer } from "buffer";


import { NoteManager } from "../lib/noteManager";
import { syncNotesFromRelayer } from "../lib/noteSync";
import { loadWallet } from "../utils/storage";
import { decrypt } from "../utils/encryption";
import { TOKEN_MINTS, SOL_MINT } from "../lib/transactions/shared";

// ============================================================================
// Types
// ============================================================================

export interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending";
  address: string;
  txSignature?: string;
  token: string;
  mintAddress: string;
}

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

      // Map notes to transactions for history
      const noteTxs: Transaction[] = notes.map((n) => {
        const tokenInfo = getTokenInfo(n.mintAddress || SOL_MINT.toString());
        return {
          id: n.id || n.commitment.slice(0, 8),
          txSignature: n.txSignature,
          type: n.spent ? "send" : "receive",
          amount: Number(n.amount) / Math.pow(10, tokenInfo.decimals),
          timestamp: n.timestamp,
          status: "confirmed",
          address: "Shielded Pool",
          token: tokenInfo.symbol,
          mintAddress: n.mintAddress || SOL_MINT.toString(),
        };
      });

      // Merge and sort: unspent notes first, then by timestamp
      setTransactions((prev) =>
        [...prev.filter((t) => t.address !== "Shielded Pool"), ...noteTxs].sort(
          (a, b) => {
            if (a.type !== b.type) {
              return a.type === "receive" ? -1 : 1;
            }
            return b.timestamp - a.timestamp;
          }
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
