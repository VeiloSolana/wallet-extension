import { useState, useEffect, useCallback } from "react";

interface TokenPriceData {
  price: number;
  priceChange24h: number;
}

interface PricesData {
  sol: TokenPriceData;
  usdc: TokenPriceData;
  usdt: TokenPriceData;
  lastUpdated: number;
}

// Fetch SOL, USDC, and USDT prices from CoinGecko
const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin,tether&vs_currencies=usd&include_24hr_change=true";

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
    const response = await fetch(COINGECKO_API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();

    cachedData = {
      sol: {
        price: data.solana?.usd || 0,
        priceChange24h: data.solana?.usd_24h_change || 0,
      },
      usdc: {
        price: data["usd-coin"]?.usd || 1,
        priceChange24h: data["usd-coin"]?.usd_24h_change || 0,
      },
      usdt: {
        price: data.tether?.usd || 1,
        priceChange24h: data.tether?.usd_24h_change || 0,
      },
      lastUpdated: now,
    };
    lastFetchTime = now;

    return cachedData;
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Return fallback data if fetch fails
    if (cachedData) {
      return cachedData;
    }
    // Ultimate fallback (stablecoins default to $1)
    return {
      sol: defaultPriceData,
      usdc: { price: 1, priceChange24h: 0 },
      usdt: { price: 1, priceChange24h: 0 },
      lastUpdated: now,
    };
  }
};

export const useCryptoPrices = (refreshInterval = 60000) => {
  const [pricesData, setPricesData] = useState<PricesData>({
    sol: defaultPriceData,
    usdc: { price: 1, priceChange24h: 0 },
    usdt: { price: 1, priceChange24h: 0 },
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
    lastUpdated: pricesData.lastUpdated,
    isLoading,
    error,
    refresh,
  };
};

// Backward compatible hook for SOL only
export const useSolPrice = (refreshInterval = 60000) => {
  const { sol, lastUpdated, isLoading, error, refresh } = useCryptoPrices(refreshInterval);
  
  return {
    price: sol.price,
    priceChange24h: sol.priceChange24h,
    lastUpdated,
    isLoading,
    error,
    refresh,
  };
};
