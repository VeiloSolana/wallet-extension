/**
 * Veilo Wallet Provider - Injected Script
 * This script runs in the page context and provides the window.veilo object
 * Compatible with Solana wallet adapter standard
 */

(function () {
  "use strict";

  // Prevent multiple injections
  if (window.veilo) {
    return;
  }

  class VeiloProvider {
    constructor() {
      this._isVeilo = true;
      this._isConnected = false;
      this._publicKey = null;
      this._listeners = new Map();
      this._pendingRequests = new Map();

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

    get isVeilo() {
      return this._isVeilo;
    }

    get isConnected() {
      return this._isConnected;
    }

    get publicKey() {
      return this._publicKey;
    }

    async connect(options = {}) {
      try {
        const response = await this._request("connect", options);
        this._isConnected = true;
        this._publicKey = response.publicKey;
        this._emit("connect", this._publicKey);
        return { publicKey: this._publicKey };
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    async disconnect() {
      try {
        await this._request("disconnect");
        this._isConnected = false;
        this._publicKey = null;
        this._emit("disconnect");
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    async signTransaction(transaction) {
      if (!this._isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const response = await this._request("signTransaction", {
          transaction: this._serializeTransaction(transaction),
        });
        return response.signedTransaction;
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    async signAllTransactions(transactions) {
      if (!this._isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const response = await this._request("signAllTransactions", {
          transactions: transactions.map((tx) =>
            this._serializeTransaction(tx)
          ),
        });
        return response.signedTransactions;
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    async signAndSendTransaction(transaction, options = {}) {
      if (!this._isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const response = await this._request("signAndSendTransaction", {
          transaction: this._serializeTransaction(transaction),
          options,
        });
        return response.signature;
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    async signMessage(message) {
      if (!this._isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        const response = await this._request("signMessage", {
          message: Array.from(message),
        });
        return response.signature;
      } catch (error) {
        this._emit("error", error);
        throw error;
      }
    }

    on(event, handler) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event).push(handler);
      return this;
    }

    off(event, handler) {
      if (!this._listeners.has(event)) return this;

      const handlers = this._listeners.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      return this;
    }

    _emit(event, ...args) {
      if (!this._listeners.has(event)) return;

      const handlers = this._listeners.get(event);
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }

    _request(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = `veilo-${Date.now()}-${Math.random()}`;

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

        // Timeout after 60 seconds
        setTimeout(() => {
          if (this._pendingRequests.has(id)) {
            this._pendingRequests.delete(id);
            reject(new Error("Request timeout"));
          }
        }, 60000);
      });
    }

    _serializeTransaction(transaction) {
      // Convert transaction to a format that can be sent via postMessage
      if (transaction.serialize) {
        return Array.from(
          transaction.serialize({ requireAllSignatures: false })
        );
      }
      return transaction;
    }
  }

  // Create and expose the Veilo provider
  const veilo = new VeiloProvider();

  Object.defineProperty(window, "veilo", {
    value: veilo,
    writable: false,
    configurable: false,
  });

  // Also expose as 'solana' for compatibility with some dApps
  // that check for window.solana
  if (!window.solana) {
    Object.defineProperty(window, "solana", {
      value: veilo,
      writable: false,
      configurable: false,
    });
  }

  // Announce the wallet is ready
  window.dispatchEvent(new Event("veilo#initialized"));

  console.log("Veilo Wallet provider initialized");
})();
