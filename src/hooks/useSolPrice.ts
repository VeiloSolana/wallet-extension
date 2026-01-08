import { useState, useEffect, useCallback } from "react";

interface SolPriceData {
  price: number;
  priceChange24h: number;
  lastUpdated: number;
}

const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true";

// Cache price data for 60 seconds to avoid rate limiting
const CACHE_DURATION_MS = 60 * 1000;

let cachedData: SolPriceData | null = null;
let lastFetchTime = 0;

const fetchSolPrice = async (): Promise<SolPriceData> => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedData;
  }

  try {
    const response = await fetch(COINGECKO_API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch SOL price");
    }

    const data = await response.json();
    const solData = data.solana;

    cachedData = {
      price: solData.usd,
      priceChange24h: solData.usd_24h_change,
      lastUpdated: now,
    };
    lastFetchTime = now;

    return cachedData;
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    // Return fallback data if fetch fails
    if (cachedData) {
      return cachedData;
    }
    // Ultimate fallback
    return {
      price: 0,
      priceChange24h: 0,
      lastUpdated: now,
    };
  }
};

export const useSolPrice = (refreshInterval = 60000) => {
  const [priceData, setPriceData] = useState<SolPriceData>({
    price: 0,
    priceChange24h: 0,
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSolPrice();
      setPriceData(data);
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
    price: priceData.price,
    priceChange24h: priceData.priceChange24h,
    lastUpdated: priceData.lastUpdated,
    isLoading,
    error,
    refresh,
  };
};
