import { useState, useEffect, useCallback } from "react";

interface TokenPriceData {
  price: number;
  priceChange24h: number;
}

interface PricesData {
  sol: TokenPriceData;
  usdc: TokenPriceData;
  usdt: TokenPriceData;
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
      veilo: { price: 0.003, priceChange24h: 0 },
      lastUpdated: now,
    };
  }
};

// --- Portfolio Value Storage for 24h Change ---
const PORTFOLIO_STORAGE_KEY = "veilo_portfolio_history";

interface PortfolioSnapshot {
  timestamp: number;
  valueUsd: number;
}

const isExtension = () => {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
};

const savePortfolioSnapshot = async (valueUsd: number): Promise<void> => {
  const snapshot: PortfolioSnapshot = {
    timestamp: Date.now(),
    valueUsd,
  };

  if (isExtension()) {
    await chrome.storage.local.set({ [PORTFOLIO_STORAGE_KEY]: snapshot });
  } else {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot));
  }
};

const loadPortfolioSnapshot = async (): Promise<PortfolioSnapshot | null> => {
  try {
    if (isExtension()) {
      const result = await chrome.storage.local.get([PORTFOLIO_STORAGE_KEY]);
      const snapshot = result[PORTFOLIO_STORAGE_KEY] as
        | PortfolioSnapshot
        | undefined;
      if (snapshot && snapshot.timestamp && snapshot.valueUsd !== undefined) {
        return snapshot;
      }
      return null;
    } else {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PortfolioSnapshot) : null;
    }
  } catch {
    return null;
  }
};

// Calculate portfolio-based 24h change
export const calculatePortfolio24hChange = async (
  currentValueUsd: number
): Promise<number> => {
  const snapshot = await loadPortfolioSnapshot();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // If we have a snapshot from ~24h ago, calculate change
  if (snapshot && now - snapshot.timestamp >= oneDayMs - 60 * 60 * 1000) {
    // Snapshot is between 23-25 hours old, use it for comparison
    if (snapshot.valueUsd > 0) {
      const change =
        ((currentValueUsd - snapshot.valueUsd) / snapshot.valueUsd) * 100;
      return change;
    }
  }

  // Save current value as new snapshot if we don't have one or it's stale
  if (!snapshot || now - snapshot.timestamp >= oneDayMs) {
    await savePortfolioSnapshot(currentValueUsd);
  }

  return 0; // No change data available yet
};

export const useCryptoPrices = (refreshInterval = 60000) => {
  const [pricesData, setPricesData] = useState<PricesData>({
    sol: defaultPriceData,
    usdc: { price: 1, priceChange24h: 0 },
    usdt: { price: 1, priceChange24h: 0 },
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
