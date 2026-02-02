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

// DexScreener API - Get SOL price from SOL/USDC pair on Raydium
// SOL token address on Solana
const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";
const DEXSCREENER_API_URL = `https://api.dexscreener.com/latest/dex/tokens/${SOL_TOKEN_ADDRESS}`;

// Cache price data for 60 seconds to avoid rate limiting
const CACHE_DURATION_MS = 60 * 1000;

let cachedData: PricesData | null = null;
let lastFetchTime = 0;

const defaultPriceData: TokenPriceData = { price: 0, priceChange24h: 0 };

const fetchPrices = async (): Promise<PricesData> => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedData;
  }

  try {
    const response = await fetch(DEXSCREENER_API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch prices from DexScreener");
    }

    const data = await response.json();

    // Find the best SOL/USDC pair (highest liquidity)
    const pairs = data.pairs || [];
    const solUsdcPair = pairs
      .filter(
        (p: any) =>
          p.quoteToken?.symbol === "USDC" ||
          p.quoteToken?.symbol === "USDT" ||
          p.baseToken?.symbol === "USDC" ||
          p.baseToken?.symbol === "USDT"
      )
      .sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

    const solPrice = solUsdcPair ? parseFloat(solUsdcPair.priceUsd) : 0;
    const solPriceChange = solUsdcPair?.priceChange?.h24 || 0;

    cachedData = {
      sol: {
        price: solPrice,
        priceChange24h: solPriceChange,
      },
      // Stablecoins are always ~$1
      usdc: {
        price: 1,
        priceChange24h: 0,
      },
      usdt: {
        price: 1,
        priceChange24h: 0,
      },
      usd1: {
        price: 1,
        priceChange24h: 0,
      },
      // VEILO fixed price
      veilo: {
        price: 0.003,
        priceChange24h: 0,
      },
      lastUpdated: now,
    };
    lastFetchTime = now;

    return cachedData;
  } catch (error) {
    console.error("Error fetching prices from DexScreener:", error);
    // Return fallback data if fetch fails
    if (cachedData) {
      return cachedData;
    }
    // Ultimate fallback
    return {
      sol: defaultPriceData,
      usdc: { price: 1, priceChange24h: 0 },
      usdt: { price: 1, priceChange24h: 0 },
      usd1: { price: 1, priceChange24h: 0 },
      veilo: { price: 0.003, priceChange24h: 0 },
      lastUpdated: now,
    };
  }
};

const HISTORY_STORAGE_KEY = "veilo_portfolio_history_v2";
const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const HISTORY_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

interface PortfolioSnapshot {
  timestamp: number;
  valueUsd: number;
}

const isExtension = () => {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
};

const getHistory = async (): Promise<PortfolioSnapshot[]> => {
  try {
    if (isExtension()) {
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
  if (isExtension()) {
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
  if (
    !lastSnapshot ||
    now - lastSnapshot.timestamp >= SNAPSHOT_INTERVAL_MS
  ) {
    const newSnapshot: PortfolioSnapshot = {
      timestamp: now,
      valueUsd,
    };

    // Add new snapshot and filter out old ones
    const updatedHistory = [...history, newSnapshot].filter(
      (s) => now - s.timestamp <= HISTORY_RETENTION_MS
    );

    await saveHistory(updatedHistory);
  }
};

// Calculate portfolio-based 24h change
export const calculatePortfolio24hChange = async (
  currentValueUsd: number
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
      ((currentValueUsd - closestSnapshot.valueUsd) / closestSnapshot.valueUsd) * 100;
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
