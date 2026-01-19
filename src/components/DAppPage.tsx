import { useState, useEffect } from "react";
import { CreateDappWalletModal } from "./CreateDappWalletModal";
import { DappWalletCard } from "./DappWalletCard";
import type { DappWallet } from "../utils/dappWalletStorage";
import {
  getDappWallets,
  saveDappWallet,
  deleteDappWallet,
  generateDappWalletKeypair,
} from "../utils/dappWalletStorage";
import { encrypt } from "../utils/encryption";

interface DAppPageProps {
  availableBalance?: number;
  password?: string;
  onTransferToWallet?: (toAddress: string, amount: number) => Promise<void>;
}

export const DAppPage = ({
  availableBalance = 0,
  password = "",
  onTransferToWallet,
}: DAppPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState<DappWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const loadedWallets = await getDappWallets();
      setWallets(loadedWallets);
    } catch (error) {
      console.error("Failed to load dapp wallets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDappWallet = async (name: string, fundAmount: string) => {
    try {
      // Generate new keypair
      const keypair = generateDappWalletKeypair();
      const publicKey = keypair.publicKey.toString();

      // Encrypt the private key
      const privateKeyArray = Array.from(keypair.secretKey);
      const privateKeyString = JSON.stringify(privateKeyArray);
      const encryptedPrivateKey = await encrypt(privateKeyString, password);

      // Create wallet object
      const newWallet: DappWallet = {
        id: Date.now().toString(),
        name,
        publicKey,
        encryptedPrivateKey,
        balance: 0,
        createdAt: Date.now(),
      };

      // Save wallet
      await saveDappWallet(newWallet);

      // If funding amount is provided, transfer from main wallet
      if (fundAmount && parseFloat(fundAmount) > 0 && onTransferToWallet) {
        await onTransferToWallet(publicKey, parseFloat(fundAmount));
        newWallet.balance = parseFloat(fundAmount);
      }

      // Reload wallets
      await loadWallets();
    } catch (error) {
      console.error("Failed to create dapp wallet:", error);
      alert("Failed to create dapp wallet. Please try again.");
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (confirm("Are you sure you want to delete this dapp wallet?")) {
      try {
        await deleteDappWallet(id);
        await loadWallets();
      } catch (error) {
        console.error("Failed to delete dapp wallet:", error);
        alert("Failed to delete dapp wallet. Please try again.");
      }
    }
  };

  const handleSelectWallet = (wallet: DappWallet) => {
    // TODO: Navigate to wallet details or show actions
    console.log("Selected wallet:", wallet);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-400">Loading wallets...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {wallets.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white/60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          </div>

          <h2 className="text-base font-mono text-white mb-2">
            No dapp wallets
          </h2>

          <p className="text-xs font-mono text-zinc-400 text-center mb-6 max-w-xs leading-relaxed">
            Create unique wallets for each dApp while keeping main funds
            private.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-white text-black font-mono text-xs uppercase tracking-wider hover:bg-white/90 transition-colors"
          >
            Create Dapp Wallet
          </button>
        </div>
      ) : (
        /* Wallet List */
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-mono text-white uppercase tracking-wider">
                Dapp Wallets
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            {wallets.map((wallet) => (
              <DappWalletCard
                key={wallet.id}
                name={wallet.name}
                publicKey={wallet.publicKey}
                balance={wallet.balance}
                onSelect={() => handleSelectWallet(wallet)}
                onDelete={() => handleDeleteWallet(wallet.id)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateDappWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateDappWallet}
        availableBalance={availableBalance}
      />
    </div>
  );
};
