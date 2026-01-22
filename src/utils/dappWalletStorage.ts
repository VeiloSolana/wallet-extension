import { Keypair } from "@solana/web3.js";
import type { EncryptedData } from "./encryption";

export interface DappWallet {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: EncryptedData;
  balance: number;
  createdAt: number;
}

const DAPP_WALLETS_KEY = "veilo_dapp_wallets";

// Helper to check if chrome.storage is available
const isChromeStorageAvailable = () => {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
};

// Fallback to localStorage for development
const getStorage = async (key: string): Promise<any> => {
  if (isChromeStorageAvailable()) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  } else {
    // Fallback to localStorage
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};

const setStorage = async (key: string, value: any): Promise<void> => {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [key]: value });
  } else {
    // Fallback to localStorage
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const saveDappWallet = async (wallet: DappWallet): Promise<void> => {
  const wallets = await getDappWallets();
  wallets.push(wallet);
  await setStorage(DAPP_WALLETS_KEY, wallets);
};

export const getDappWallets = async (): Promise<DappWallet[]> => {
  const wallets = await getStorage(DAPP_WALLETS_KEY);
  return wallets || [];
};

export const deleteDappWallet = async (id: string): Promise<void> => {
  const wallets = await getDappWallets();
  const filtered = wallets.filter((w) => w.id !== id);
  await setStorage(DAPP_WALLETS_KEY, filtered);
};

export const updateDappWalletBalance = async (
  id: string,
  balance: number,
): Promise<void> => {
  const wallets = await getDappWallets();
  const wallet = wallets.find((w) => w.id === id);
  if (wallet) {
    wallet.balance = balance;
    await setStorage(DAPP_WALLETS_KEY, wallets);
  }
};

export const generateDappWalletKeypair = (): Keypair => {
  return Keypair.generate();
};
