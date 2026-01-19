import { Keypair } from "@solana/web3.js";

export interface DappWallet {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: string;
  balance: number;
  createdAt: number;
}

const DAPP_WALLETS_KEY = "veilo_dapp_wallets";

export const saveDappWallet = async (wallet: DappWallet): Promise<void> => {
  const wallets = await getDappWallets();
  wallets.push(wallet);
  await chrome.storage.local.set({ [DAPP_WALLETS_KEY]: wallets });
};

export const getDappWallets = async (): Promise<DappWallet[]> => {
  const result = await chrome.storage.local.get(DAPP_WALLETS_KEY);
  return result[DAPP_WALLETS_KEY] || [];
};

export const deleteDappWallet = async (id: string): Promise<void> => {
  const wallets = await getDappWallets();
  const filtered = wallets.filter((w) => w.id !== id);
  await chrome.storage.local.set({ [DAPP_WALLETS_KEY]: filtered });
};

export const updateDappWalletBalance = async (
  id: string,
  balance: number,
): Promise<void> => {
  const wallets = await getDappWallets();
  const wallet = wallets.find((w) => w.id === id);
  if (wallet) {
    wallet.balance = balance;
    await chrome.storage.local.set({ [DAPP_WALLETS_KEY]: wallets });
  }
};

export const generateDappWalletKeypair = (): Keypair => {
  return Keypair.generate();
};
