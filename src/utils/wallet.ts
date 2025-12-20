/**
 * Simple Wallet implementation for Anchor
 * Implements the Wallet interface required by Anchor Provider
 */

import type {
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

export class Wallet {
  readonly payer: Keypair;

  constructor(payer: Keypair) {
    this.payer = payer;
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    if ("version" in tx) {
      tx.sign([this.payer]);
    } else {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs.map((tx) => {
      if ("version" in tx) {
        tx.sign([this.payer]);
      } else {
        tx.partialSign(this.payer);
      }
      return tx;
    });
  }
}
