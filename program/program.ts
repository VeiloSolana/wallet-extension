import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import type { PrivacyPool } from "./types/privacy_pool";
import idl from "./idl/privacy_pool.json";

export type PrivacyPoolProgram = Program<PrivacyPool>;

export interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(
    tx: T,
  ) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(
    txs: T[],
  ) => Promise<T[]>;
  payer: Keypair;
}

export function getProgram(
  connection: Connection,
  wallet: WalletAdapter | Wallet,
): PrivacyPoolProgram {
  const provider = new AnchorProvider(connection, wallet as Wallet, {
    commitment: "confirmed",
  });

  return new Program(idl as PrivacyPool, provider);
}
