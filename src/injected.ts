/**
 * Veilo Wallet - Injected Provider Script
 * Implements Wallet Standard for universal dApp compatibility
 */

import {
  SolanaSignAndSendTransaction,
  SolanaSignMessage,
  SolanaSignTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignAndSendTransactionMethod,
  type SolanaSignMessageFeature,
  type SolanaSignMessageMethod,
  type SolanaSignTransactionFeature,
  type SolanaSignTransactionMethod,
} from "@solana/wallet-standard-features";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  type StandardConnectFeature,
  type StandardConnectMethod,
  type StandardDisconnectFeature,
  type StandardDisconnectMethod,
  type StandardEventsFeature,
  type StandardEventsOnMethod,
} from "@wallet-standard/features";
import { registerWallet } from "@wallet-standard/wallet";

// Veilo logo as base64 data URL (will be embedded at build time)
const VEILO_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAQAElEQVR4AeydBZAdRRPHe4K7Q/AEdwoP7u5QQPALGjy4Q/DCg8Xl4u7uScWl4q6XpOLunnz3G27y7S737kne7Zt9OxSbfbs7O7PT/e+e7p6euVIistMd0aUBAMjnv/s/qhRwAIgq5wv67QBQQIionhwAosr5gn47ABQQIqonB4Cocr6g3w4ABYSI2sn01wHAUCKiZweAiDLedNsBwFAiomcHgIgy3nTbAcBQIqJnB4CIMt502wHAUCKiZweAiDHe310HAD9FInbtABAxhvu76wDgp0jErh0AIsZwf3cdAPwUidi1A0DEGO7vrgOAnyIRu3YAiAjDY3XTASAWZSJy3wEgIoyO1U0HgFiUich9B4CIMDpWNx0AYlEmIvcdACLC6FjddACIRZmI3HcAyHJGx+te5AFw2GGHSdmyZeWQQw4RpVQ8emXd88gCYJ999pEnnnhCcnNzpVWrVlK7dm259dZbs47B8ToUOQAcc8wxcvvtt0vz5s3lt99+kyuvvFJOPPFEuf7666VRo0bSvXt3uf/++/W9vfbaKx79Qv+8VOh7kGAH9ttvP3n99dc1k2vWrClXXXWVzJ07Vzp37lyohosuukj+/PNPadasmXz33Xdy7rnnFnqebRdZD4DSpUvLnXfeKR07dpQvvvhCzjrrLJkxY4b8+OOPcvPNN2uJ9zMVsJx++umSk5MjXbp00e+VK1dODj/8cH/R0F9nLQBg4htvvLFL4i+44AIZP368vPzyy/Lkk09q9b927dq4DKQeNEf9+vUFe4E6uRf3xZAUyCoAKKWktEfiP//8cznzzDNl6tSp8s0338g999yjJXrRokWycyeboyXOJbwFtAB1du3aVZ599llAS4QdDFkDgAMPPFAqVaokjRs3FsZ4JH7cuHHy0ksvyVNPPSV//fWXbNy4MXGOF1PynHPOke+//17bCdgLZ599djGlM/Mo0VZDDYA999xTTjrpJHn44YcFqfz444+1VBqJv/fee/V9JD5RgiRaDg8B7wGPoX///lKvXj257rrr5KijjpJSpcJD1vB8qY8zEBqjrkmTJvLHH39oxg8bNkyP8emWeF/TRV7eddddUqdOHeF70Dp77713keVsuxkqACB1p5xyilbrvXv3looVK8rRRx8tI0aMkDfffHOXJigJiY/HOKWUjiZeeOGF8vXXX8vIkSM1GG33HEIDAAI4lStX1hL25ZdfyhFHHKFduwoVKghHixYtZMuWLfH4FNhzjFG+8+KLLw6szVQashoAe+yxh5x22mla0nv16iUvvvii9sVR9Ug/x6BBg2TVqlVJ951xGu1x6qmnJv1urBe2bt0qs2bN0kbojh07BBsFrRWrvA33rQbAGWecoSWesR4NMGrUKC3tSDyBHQieKhEZp4n2AapU6/C+t3jxYkFDMb/w1VdfybJly7yPrf1tNQCw8MuUKaMlCb8ddfrcc8/p2btk/W8j8VjtgwcP1uM00k84GK9h/fr1QhvJcAoAGom/5ZZbpFatWloDcD+RIFMybZVUWasBANNMxxlPp02bJnfffbeO7v38889y/PHHm8dxz0bi8dsZVqZPn64Nx0cffVQeeeQRPcx06NAhbj2mgF/iuTbPMnlOtm2rAeDtTPXq1eWaa67R0TwmcJDeBg0aSE5+vL5MvpbwluU34GGM90v8zJkzdWz/6quvlvbt2wseAwezgAwHtNGmTZtdkkxd5kCyY0m8KWPOyWoo817Q59AAwBAG94qAD/H8d955R5YvXy744K+99pp4iU7MnzHeSPykSZOEOH758uW1kWbq85/RMpXyI4r49Bs2bNj1GAn3jvFc73pYxA8ik0Xctu5W6AAABbGwV6xYIWPHjtWuYNWqVXVCB4biAw88IIzxGGLnnXeedg2Z1r3hhhsEFb9kyRLhferxHkopOfTQQ+Xaa6/VdfEOgEJjoH1uuukmPcYvWLBA";

type WalletEventType = "change";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

class VeiloWalletAccount implements WalletAccount {
  readonly address: string;
  readonly publicKey: Uint8Array;
  readonly chains = ["solana:mainnet", "solana:devnet", "solana:testnet"] as const;
  readonly features = [
    SolanaSignAndSendTransaction,
    SolanaSignTransaction,
    SolanaSignMessage,
  ] as const;

  constructor(publicKey: Uint8Array) {
    this.publicKey = publicKey;
    this.address = this.encodeBase58(publicKey);
  }

  private encodeBase58(bytes: Uint8Array): string {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    let num = BigInt(0);
    for (const byte of bytes) {
      num = num * BigInt(256) + BigInt(byte);
    }
    while (num > 0) {
      result = ALPHABET[Number(num % BigInt(58))] + result;
      num = num / BigInt(58);
    }
    for (const byte of bytes) {
      if (byte === 0) {
        result = "1" + result;
      } else {
        break;
      }
    }
    return result || "1";
  }
}

class VeiloWallet implements Wallet {
  readonly version = "1.0.0" as const;
  readonly name = "Veilo";
  readonly icon = VEILO_ICON as `data:image/png;base64,${string}`;
  readonly chains = ["solana:mainnet", "solana:devnet", "solana:testnet"] as const;
  
  private _accounts: VeiloWalletAccount[] = [];
  private _listeners: Map<WalletEventType, Set<(properties: { accounts: readonly WalletAccount[] }) => void>> = new Map();
  private _pendingRequests: Map<string, PendingRequest> = new Map();

  constructor() {
    // Listen for responses from content script
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data?.source === "veilo-content") {
        const { id, result, error } = event.data;
        const pending = this._pendingRequests.get(id);

        if (pending) {
          this._pendingRequests.delete(id);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        }
      }
    });
  }

  get accounts(): readonly WalletAccount[] {
    return this._accounts;
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignAndSendTransactionFeature {
    return {
      [StandardConnect]: {
        version: "1.0.0" as const,
        connect: this._connect.bind(this),
      },
      [StandardDisconnect]: {
        version: "1.0.0" as const,
        disconnect: this._disconnect.bind(this),
      },
      [StandardEvents]: {
        version: "1.0.0" as const,
        on: this._on.bind(this),
      },
      [SolanaSignTransaction]: {
        version: "1.0.0" as const,
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: this._signTransaction.bind(this),
      },
      [SolanaSignMessage]: {
        version: "1.0.0" as const,
        signMessage: this._signMessage.bind(this),
      },
      [SolanaSignAndSendTransaction]: {
        version: "1.0.0" as const,
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: this._signAndSendTransaction.bind(this),
      },
    };
  }

  private _connect: StandardConnectMethod = async (input) => {
    try {
      const response = await this._request("connect", input ? { ...input } : {}) as {
        publicKey: number[];
      };
      
      const publicKeyBytes = new Uint8Array(response.publicKey);
      const account = new VeiloWalletAccount(publicKeyBytes);
      this._accounts = [account];
      
      this._emitChange();
      
      return { accounts: this._accounts };
    } catch (error) {
      throw error;
    }
  };

  private _disconnect: StandardDisconnectMethod = async () => {
    try {
      await this._request("disconnect", {});
      this._accounts = [];
      this._emitChange();
    } catch (error) {
      throw error;
    }
  };

  private _on: StandardEventsOnMethod = (event, listener) => {
    const eventType = event as WalletEventType;
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    // Cast listener to match our internal type
    this._listeners.get(eventType)!.add(listener as (properties: { accounts: readonly WalletAccount[] }) => void);

    return () => {
      this._listeners.get(eventType)?.delete(listener as (properties: { accounts: readonly WalletAccount[] }) => void);
    };
  };

  private _signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
    const results = [];
    
    for (const input of inputs) {
      const { transaction, account, chain } = input;
      
      if (!this._accounts.find((acc) => acc.address === account.address)) {
        throw new Error("Account not found");
      }
      
      const response = await this._request("signTransaction", {
        transaction: Array.from(transaction),
        chain,
      }) as { signedTransaction: number[] };
      
      results.push({
        signedTransaction: new Uint8Array(response.signedTransaction),
      });
    }
    
    return results;
  };

  private _signMessage: SolanaSignMessageMethod = async (...inputs) => {
    const results = [];
    
    for (const input of inputs) {
      const { message, account } = input;
      
      if (!this._accounts.find((acc) => acc.address === account.address)) {
        throw new Error("Account not found");
      }
      
      const response = await this._request("signMessage", {
        message: Array.from(message),
      }) as { signature: number[] };
      
      results.push({
        signedMessage: message,
        signature: new Uint8Array(response.signature),
      });
    }
    
    return results;
  };

  private _signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (
    ...inputs
  ) => {
    const results = [];
    
    for (const input of inputs) {
      const { transaction, account, chain, options } = input;
      
      if (!this._accounts.find((acc) => acc.address === account.address)) {
        throw new Error("Account not found");
      }
      
      const response = await this._request("signAndSendTransaction", {
        transaction: Array.from(transaction),
        chain,
        options,
      }) as { signature: string };
      
      // Convert base58 signature to bytes
      const signatureBytes = this._decodeBase58(response.signature);
      
      results.push({
        signature: signatureBytes,
      });
    }
    
    return results;
  };

  private _emitChange() {
    const handlers = this._listeners.get("change");
    if (!handlers) return;

    const eventData = { accounts: this._accounts as readonly WalletAccount[] };

    handlers.forEach((handler) => {
      try {
        handler(eventData);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    });
  }

  /**
   * Get the shielded balance from the Veilo wallet.  
   * @param mintAddress - Optional mint address for SPL tokens. Omit for SOL.
   * @returns Promise with balance info { balance: string, decimals: number, symbol: string }
   */
  async getShieldedBalance(mintAddress?: string): Promise<{
    balance: string;
    balanceFormatted: number;
    decimals: number;
    symbol: string;
  }> {
    try {
      const response = await this._request("getShieldedBalance", { mintAddress }) as {
        balance: string;
        decimals: number;
        symbol: string;
      };
      
      return {
        balance: response.balance,
        balanceFormatted: Number(response.balance) / Math.pow(10, response.decimals),
        decimals: response.decimals,
        symbol: response.symbol,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all shielded token balances from the Veilo wallet.
   * @returns Promise with all token balances
   */
  async getAllShieldedBalances(): Promise<{
    sol: { balance: string; balanceFormatted: number };
    usdc: { balance: string; balanceFormatted: number };
    usdt: { balance: string; balanceFormatted: number };
    veilo: { balance: string; balanceFormatted: number };
  }> {
    try {
      const response = await this._request("getAllShieldedBalances", {}) as {
        sol: number;
        usdc: number;
        usdt: number;
        veilo: number;
      };
      
      return {
        sol: { balance: (response.sol * 1e9).toString(), balanceFormatted: response.sol },
        usdc: { balance: (response.usdc * 1e6).toString(), balanceFormatted: response.usdc },
        usdt: { balance: (response.usdt * 1e6).toString(), balanceFormatted: response.usdt },
        veilo: { balance: (response.veilo * 1e6).toString(), balanceFormatted: response.veilo },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send shielded funds to another Veilo user.
   * @param params - { username: string, amount: string, mintAddress?: string }
   * @returns Promise with transaction signature
   */
  async sendShieldedTransaction(params: {
    username: string;
    amount: string;
    mintAddress?: string;
  }): Promise<{ signature: string }> {
    try {
      return await this._request("sendShieldedTransaction", params) as { signature: string };
    } catch (error) {
      throw error;
    }
  }

  private _request(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = `veilo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      this._pendingRequests.set(id, { resolve, reject });

      window.postMessage(
        {
          source: "veilo-injected",
          method,
          params,
          id,
        },
        "*"
      );

      // Timeout after 5 minutes for transaction approvals
      setTimeout(() => {
        if (this._pendingRequests.has(id)) {
          this._pendingRequests.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 300000);
    });
  }

  private _decodeBase58(str: string): Uint8Array {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt(0);
    for (const char of str) {
      const index = ALPHABET.indexOf(char);
      if (index === -1) throw new Error("Invalid base58 character");
      num = num * BigInt(58) + BigInt(index);
    }
    
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    
    // Handle leading zeros
    for (const char of str) {
      if (char === "1") {
        bytes.unshift(0);
      } else {
        break;
      }
    }
    
    return new Uint8Array(bytes);
  }
}

// Initialize and register the wallet
(function () {
  "use strict";

  // Prevent multiple injections
  if ((window as unknown as { veilo?: VeiloWallet }).veilo) {
    return;
  }

  const veilo = new VeiloWallet();

  // Register with Wallet Standard
  registerWallet(veilo);

  // Also expose on window for backwards compatibility
  Object.defineProperty(window, "veilo", {
    value: veilo,
    writable: false,
    configurable: false,
  });

  console.log("Veilo Wallet provider initialized with Wallet Standard");
})();
