import { useState, useEffect, useCallback } from "react";

interface TokenPriceData {
  price: number;
  priceChange24h: number;
}

interface PricesData {
  sol: TokenPriceData;
  usdc: TokenPriceData;
  usdt: TokenPriceData;
  usd1: TokenPriceData;
  veilo: TokenPriceData;
  lastUpdated: number;
}

// CoinGecko API — matches mobile app
const COINGECKO_IDS = "solana,usd-coin,tether,usd1-wlfi";
const COINGECKO_API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true`;

// Cache price data for 2 minutes to avoid rate limiting
const CACHE_DURATION_MS = 2 * 60 * 1000;
const PRICES_STORAGE_KEY = "veilo_cached_prices_v1";

let cachedData: PricesData | null = null;
let lastFetchTime = 0;

const defaultPriceData: TokenPriceData = { price: 0, priceChange24h: 0 };

const ULTIMATE_FALLBACK: PricesData = {
  sol: defaultPriceData,
  usdc: { price: 1, priceChange24h: 0 },
  usdt: { price: 1, priceChange24h: 0 },
  usd1: { price: 1, priceChange24h: 0 },
  veilo: { price: 0.003, priceChange24h: 0 },
  lastUpdated: 0,
};

const isExtensionStorage = () =>
  typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

// Persist prices so they survive page/popup reloads
const persistPrices = async (data: PricesData) => {
  try {
    if (isExtensionStorage()) {
      await chrome.storage.local.set({ [PRICES_STORAGE_KEY]: data });
    } else {
      localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // silent
  }
};

// Load last-known prices from storage
const loadPersistedPrices = async (): Promise<PricesData | null> => {
  try {
    if (isExtensionStorage()) {
      const result = await chrome.storage.local.get([PRICES_STORAGE_KEY]);
      return (result[PRICES_STORAGE_KEY] as PricesData) || null;
    } else {
      const stored = localStorage.getItem(PRICES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PricesData) : null;
    }
  } catch {
    return null;
  }
};

const fetchPrices = async (): Promise<PricesData> => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedData;
  }

  // On first call, hydrate from storage so we never start with zeros
  if (!cachedData) {
    const persisted = await loadPersistedPrices();
    if (persisted) {
      cachedData = persisted;
      if (now - persisted.lastUpdated < CACHE_DURATION_MS) {
        lastFetchTime = persisted.lastUpdated;
        return cachedData;
      }
    }
  }

  try {
    const response = await fetch(COINGECKO_API_URL);
    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const data = await response.json();

    // Guard against 429 / error payloads that return JSON but no price keys
    if (!data["solana"] && !data["usd-coin"]) {
      throw new Error("CoinGecko returned empty price data");
    }

    const solData = data["solana"] || {};
    const usdcData = data["usd-coin"] || {};
    const usdtData = data["tether"] || {};
    const usd1Data = data["usd1-wlfi"] || {};

    cachedData = {
      sol: {
        price: solData.usd ?? 0,
        priceChange24h: solData.usd_24h_change ?? 0,
      },
      usdc: {
        price: usdcData.usd ?? 1,
        priceChange24h: usdcData.usd_24h_change ?? 0,
      },
      usdt: {
        price: usdtData.usd ?? 1,
        priceChange24h: usdtData.usd_24h_change ?? 0,
      },
      usd1: {
        price: usd1Data.usd ?? 1,
        priceChange24h: usd1Data.usd_24h_change ?? 0,
      },
      // VEILO — no CoinGecko listing yet
      veilo: {
        price: 0.003,
        priceChange24h: 0,
      },
      lastUpdated: now,
    };
    lastFetchTime = now;

    // Persist good data for next popup open
    persistPrices(cachedData);

    return cachedData;
  } catch (error) {
    console.error("Error fetching prices from CoinGecko:", error);
    // Return stale in-memory or persisted cache — never zeros
    if (cachedData) {
      return cachedData;
    }
    const persisted = await loadPersistedPrices();
    if (persisted) {
      cachedData = persisted;
      return persisted;
    }
    return ULTIMATE_FALLBACK;
  }
};

// Formatting utilities — matches mobile app
export const formatCurrency = (amount: number, decimals = 2): string => {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatTokenAmount = (amount: number, decimals = 4): string => {
  if (amount === 0) return "0";
  if (amount > 0 && amount < 0.0001) return "<0.0001";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// Weighted-average portfolio 24h change — matches mobile app
export const calculateWeightedPortfolioChange = (
  tokenBalances: {
    sol: number;
    usdc: number;
    usdt: number;
    usd1: number;
    veilo: number;
  },
  prices: {
    sol: TokenPriceData;
    usdc: TokenPriceData;
    usdt: TokenPriceData;
    usd1: TokenPriceData;
    veilo: TokenPriceData;
  },
): number => {
  const values = {
    sol: tokenBalances.sol * (prices.sol?.price || 0),
    usdc: tokenBalances.usdc * (prices.usdc?.price || 0),
    usdt: tokenBalances.usdt * (prices.usdt?.price || 0),
    usd1: tokenBalances.usd1 * (prices.usd1?.price || 0),
    veilo: tokenBalances.veilo * (prices.veilo?.price || 0),
  };
  const totalValue = Object.values(values).reduce((s, v) => s + v, 0);
  if (totalValue === 0) return 0;

  const weightedChange =
    (values.sol * (prices.sol?.priceChange24h || 0) +
      values.usdc * (prices.usdc?.priceChange24h || 0) +
      values.usdt * (prices.usdt?.priceChange24h || 0) +
      values.usd1 * (prices.usd1?.priceChange24h || 0) +
      values.veilo * (prices.veilo?.priceChange24h || 0)) /
    totalValue;

  return weightedChange;
};

const HISTORY_STORAGE_KEY = "veilo_portfolio_history_v2";
const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const HISTORY_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

interface PortfolioSnapshot {
  timestamp: number;
  valueUsd: number;
}

const getHistory = async (): Promise<PortfolioSnapshot[]> => {
  try {
    if (isExtensionStorage()) {
      const result = await chrome.storage.local.get([HISTORY_STORAGE_KEY]);
      return (result[HISTORY_STORAGE_KEY] as PortfolioSnapshot[]) || [];
    } else {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PortfolioSnapshot[]) : [];
    }
  } catch {
    return [];
  }
};

const saveHistory = async (history: PortfolioSnapshot[]) => {
  if (isExtensionStorage()) {
    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history });
  } else {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }
};

const savePortfolioSnapshot = async (valueUsd: number): Promise<void> => {
  const now = Date.now();
  const history = await getHistory();
  const lastSnapshot = history[history.length - 1];

  // Only save if enough time has passed or history is empty
  if (!lastSnapshot || now - lastSnapshot.timestamp >= SNAPSHOT_INTERVAL_MS) {
    const newSnapshot: PortfolioSnapshot = {
      timestamp: now,
      valueUsd,
    };

    // Add new snapshot and filter out old ones
    const updatedHistory = [...history, newSnapshot].filter(
      (s) => now - s.timestamp <= HISTORY_RETENTION_MS,
    );

    await saveHistory(updatedHistory);
  }
};

// Calculate portfolio-based 24h change
export const calculatePortfolio24hChange = async (
  currentValueUsd: number,
): Promise<number> => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Save current state first
  if (currentValueUsd > 0) {
    await savePortfolioSnapshot(currentValueUsd);
  }

  const history = await getHistory();
  if (history.length === 0) return 0;

  // Find snapshot closest to 24h ago
  // We want something between 23h and 25h ago preferably,
  // but logically we just want the point that is closest to (now - 24h)
  const targetTime = now - oneDayMs;

  // If oldest data is less than 6 hours old, show 0 change or handle differently?
  // For now, if we don't have data older than 1 hour, we return 0. (avoid noise)
  if (now - history[0].timestamp < 60 * 60 * 1000) {
    return 0;
  }

  // Find the snapshot with timestamp closest to targetTime
  let closestSnapshot = history[0];
  let minDiff = Math.abs(targetTime - closestSnapshot.timestamp);

  for (let i = 1; i < history.length; i++) {
    const diff = Math.abs(targetTime - history[i].timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestSnapshot = history[i];
    }
  }

  // Calculate change
  if (closestSnapshot.valueUsd > 0) {
    // If the closest snapshot is actually quite recent (e.g. user just started 2h ago),
    // calculating "24h change" is misleading.
    // Ideally we extrapolate or just show change "since start".
    // Let's rely on the closest point we have.
    const change =
      ((currentValueUsd - closestSnapshot.valueUsd) /
        closestSnapshot.valueUsd) *
      100;
    return change;
  }

  return 0;
};

export const useCryptoPrices = (refreshInterval = 60000) => {
  const [pricesData, setPricesData] = useState<PricesData>({
    sol: defaultPriceData,
    usdc: { price: 1, priceChange24h: 0 },
    usdt: { price: 1, priceChange24h: 0 },
    usd1: { price: 1, priceChange24h: 0 },
    veilo: { price: 0.003, priceChange24h: 0 },
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPrices();
      setPricesData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Set up interval for auto-refresh
    const intervalId = setInterval(refresh, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refresh, refreshInterval]);

  return {
    sol: pricesData.sol,
    usdc: pricesData.usdc,
    usdt: pricesData.usdt,
    usd1: pricesData.usd1,
    veilo: pricesData.veilo,
    lastUpdated: pricesData.lastUpdated,
    isLoading,
    error,
    refresh,
  };
};

// Hook for portfolio-based 24h change
export const usePortfolio24hChange = (currentValueUsd: number) => {
  const [change24h, setChange24h] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculate = async () => {
      const change = await calculatePortfolio24hChange(currentValueUsd);
      setChange24h(change);
      setIsLoading(false);
    };

    if (currentValueUsd > 0) {
      calculate();
    } else {
      setChange24h(0);
      setIsLoading(false);
    }
  }, [currentValueUsd]);

  return { change24h, isLoading };
};

// Backward compatible hook for SOL only
export const useSolPrice = (refreshInterval = 60000) => {
  const { sol, lastUpdated, isLoading, error, refresh } =
    useCryptoPrices(refreshInterval);

  return {
    price: sol.price,
    priceChange24h: sol.priceChange24h,
    lastUpdated,
    isLoading,
    error,
    refresh,
  };
};
