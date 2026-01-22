import { PublicKey } from "@solana/web3.js";

export type NetworkType = "mainnet" | "devnet";

export interface NetworkConfig {
  rpcEndpoint: string;
  explorerUrl: string;
  tokens: {
    SOL_MINT: PublicKey;
    USDC_MINT: PublicKey;
    USDT_MINT: PublicKey;
    VEILO_MINT: PublicKey;
  };
  jupiter: {
    apiEndpoint: string;
  };
}

const MAINNET_CONFIG: NetworkConfig = {
  rpcEndpoint: import.meta.env.VITE_MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
  explorerUrl: "https://explorer.solana.com",
  tokens: {
    SOL_MINT: PublicKey.default,
    USDC_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    USDT_MINT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    VEILO_MINT: new PublicKey("A4jyQhHNRW5kFAdGN8ZnXB8HHW5kXJU4snGddS5UpdSq"),
  },
  jupiter: {
    apiEndpoint: "https://lite-api.jup.ag/swap/v1",
  },
};

const DEVNET_CONFIG: NetworkConfig = {
  rpcEndpoint: import.meta.env.VITE_DEVNET_RPC_URL || "https://api.devnet.solana.com",
  explorerUrl: "https://explorer.solana.com",
  tokens: {
    SOL_MINT: PublicKey.default,
    // Devnet USDC (from SPL token faucet)
    USDC_MINT: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    // Devnet USDT (placeholder - use faucet token)
    USDT_MINT: new PublicKey("EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"),
    // Devnet VEILO (placeholder - deploy your own for testing)
    VEILO_MINT: new PublicKey("A4jyQhHNRW5kFAdGN8ZnXB8HHW5kXJU4snGddS5UpdSq"),
  },
  jupiter: {
    // Jupiter doesn't support devnet - swaps won't work on devnet
    apiEndpoint: "https://lite-api.jup.ag/swap/v1",
  },
};

const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  mainnet: MAINNET_CONFIG,
  devnet: DEVNET_CONFIG,
};

const STORAGE_KEY = "veilo_network";

export function getSelectedNetwork(): NetworkType {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "mainnet" || stored === "devnet") {
    return stored;
  }
  return "devnet"; // Default to devnet for safety
}

export function setSelectedNetwork(network: NetworkType): void {
  localStorage.setItem(STORAGE_KEY, network);
  // Dispatch event so components can react to network change
  window.dispatchEvent(new CustomEvent("networkChanged", { detail: network }));
}

export function getNetworkConfig(): NetworkConfig {
  return NETWORK_CONFIGS[getSelectedNetwork()];
}

export function getRpcEndpoint(): string {
  return getNetworkConfig().rpcEndpoint;
}

export function getExplorerUrl(type: "tx" | "address", value: string): string {
  const config = getNetworkConfig();
  const network = getSelectedNetwork();
  const clusterParam = network === "devnet" ? "?cluster=devnet" : "";
  return `${config.explorerUrl}/${type}/${value}${clusterParam}`;
}

export function getTokenMints() {
  return getNetworkConfig().tokens;
}

export function getJupiterEndpoint(): string {
  return getNetworkConfig().jupiter.apiEndpoint;
}
