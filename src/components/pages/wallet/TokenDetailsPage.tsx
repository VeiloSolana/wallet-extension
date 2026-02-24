import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TokenDetailsPageProps {
  tokenSymbol: string;
  onBack: () => void;
}

type TimeFrame = "5m" | "1h" | "6h" | "24h" | "7d";

interface TokenInfo {
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  priceChanges: Record<string, number>;
  websites: { url: string; label: string }[];
  socials: { url: string; type: string }[];
  imageUrl?: string;
}

interface ChartDataPoint {
  value: number;
  timestamp: number;
}

// Token addresses for Solana
const TOKEN_ADDRESSES: Record<string, string> = {
  sol: "So11111111111111111111111111111111111111112",
  usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  usd1: "CXLBjMMcwkc17GfJtBos6rQCo1ypeH6eDbB82Kby4MRm",
  veilo: "A4jyQhHNRW5kFAdGN8ZnXB8HHW5kXJU4snGddS5UpdSq",
};

const TOKEN_DISPLAY_NAMES: Record<string, string> = {
  sol: "Solana",
  usdc: "USD Coin",
  usdt: "Tether",
  usd1: "USD One",
  veilo: "Veilo",
};

const COINGECKO_IDS: Record<string, string> = {
  sol: "solana",
  usdc: "usd-coin",
  usdt: "tether",
  usd1: "usd1-wlfi",
  veilo: "veilo",
};

const isStablecoin = (symbol: string) =>
  ["usdc", "usdt", "usd1"].includes(symbol.toLowerCase());

function getOhlcvParams(timeFrame: TimeFrame) {
  switch (timeFrame) {
    case "5m":
      return { timeframe: "minute", aggregate: 1, limit: 15 };
    case "1h":
      return { timeframe: "minute", aggregate: 1, limit: 60 };
    case "6h":
      return { timeframe: "minute", aggregate: 5, limit: 72 };
    case "24h":
      return { timeframe: "hour", aggregate: 1, limit: 24 };
    case "7d":
      return { timeframe: "hour", aggregate: 4, limit: 42 };
  }
}

function getPriceChangeKey(timeFrame: TimeFrame): string {
  switch (timeFrame) {
    case "5m":
      return "m5";
    case "1h":
      return "h1";
    case "6h":
      return "h6";
    case "24h":
      return "h24";
    case "7d":
      return "d7";
  }
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatPrice(price: number): string {
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

// Simple in-memory cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithRetry(
  url: string,
  retries = 2,
  delay = 2000,
): Promise<Response> {
  const response = await fetch(url);
  if (response.status === 429 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 1.5);
  }
  return response;
}

export const TokenDetailsPage = ({
  tokenSymbol,
  onBack,
}: TokenDetailsPageProps) => {
  const symbol = tokenSymbol.toLowerCase();
  const tokenAddress = TOKEN_ADDRESSES[symbol] || TOKEN_ADDRESSES.sol;

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("24h");
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [dexScreenerPairAddress, setDexScreenerPairAddress] = useState("");

  // Find best pool on GeckoTerminal
  const findPool = useCallback(async (): Promise<string | null> => {
    const cacheKey = `pool_${tokenAddress}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithRetry(
        `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}/pools?page=1`,
      );
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const pools = data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stablePools = pools.filter((p: any) => {
          const name = p.attributes?.name || "";
          return name.includes("USDC") || name.includes("USDT");
        });
        const bestPool = stablePools.length > 0 ? stablePools[0] : pools[0];
        const address = bestPool.attributes?.address;
        if (address) {
          setCache(cacheKey, address);
          return address;
        }
      }
    } catch (error) {
      console.error("Failed to find pool:", error);
    }
    return null;
  }, [tokenAddress]);

  // Fetch OHLCV chart data
  const fetchChartData = useCallback(
    async (pool: string, timeFrame: TimeFrame) => {
      const cacheKey = `chart_${tokenAddress}_${timeFrame}`;
      const cached = getCached<ChartDataPoint[]>(cacheKey);
      if (cached) {
        setChartData(cached);
        return;
      }

      setIsChartLoading(true);
      try {
        const { timeframe, aggregate, limit } = getOhlcvParams(timeFrame);
        const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`;
        const response = await fetchWithRetry(url);
        const data = await response.json();
        const ohlcvList = data?.data?.attributes?.ohlcv_list;

        if (ohlcvList && ohlcvList.length > 0) {
          const sorted = [...ohlcvList].sort(
            (a: number[], b: number[]) => a[0] - b[0],
          );
          const points: ChartDataPoint[] = sorted.map((candle: number[]) => ({
            value: candle[4],
            timestamp: candle[0],
          }));
          setChartData(points);
          setCache(cacheKey, points);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setIsChartLoading(false);
      }
    },
    [tokenAddress],
  );

  // Fetch token info — CoinGecko for price/market data, DexScreener for pair link
  const fetchTokenInfo = useCallback(async () => {
    const cacheKey = `info_${tokenAddress}`;
    const cached = getCached<TokenInfo>(cacheKey);
    if (cached) {
      setTokenInfo(cached);
      return;
    }

    // Fetch from CoinGecko (accurate market data) + DexScreener (pair link & liquidity) in parallel
    const geckoId = COINGECKO_IDS[symbol];

    const [geckoResult, dexResult] = await Promise.allSettled([
      geckoId
        ? fetchWithRetry(
            `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
          ).then((r) => r.json())
        : Promise.resolve(null),
      fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      ).then((r) => r.json()),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geckoData: any =
      geckoResult.status === "fulfilled" ? geckoResult.value : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dexData: any =
      dexResult.status === "fulfilled" ? dexResult.value : null;

    // Extract DexScreener pair for linking and liquidity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dexPair: any = null;
    if (dexData?.pairs && dexData.pairs.length > 0) {
      const solanaPairs = dexData.pairs.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) =>
          p.chainId === "solana" &&
          p.baseToken.address === tokenAddress &&
          (p.quoteToken.symbol === "USDC" || p.quoteToken.symbol === "USDT"),
      );
      solanaPairs.sort(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any, b: any) =>
          parseFloat(b.liquidity?.usd || "0") -
          parseFloat(a.liquidity?.usd || "0"),
      );
      dexPair = solanaPairs.length > 0 ? solanaPairs[0] : dexData.pairs[0];
      setDexScreenerPairAddress(dexPair.pairAddress);
    }

    // Build info from CoinGecko (primary) with DexScreener fallback
    if (geckoData?.market_data) {
      const md = geckoData.market_data;
      const price = md.current_price?.usd || 0;
      const change1h = md.price_change_percentage_1h_in_currency?.usd || 0;
      const change24h = md.price_change_percentage_24h || 0;
      const change7d = md.price_change_percentage_7d || 0;

      // DexScreener has m5 and h6 that CoinGecko doesn't — use them if available
      const dexChanges = dexPair?.priceChange || {};

      const priceChanges: Record<string, number> = {
        m5: parseFloat(dexChanges.m5 || "0") || change1h / 12,
        h1: parseFloat(dexChanges.h1 || "0") || change1h,
        h6: parseFloat(dexChanges.h6 || "0") || change24h / 4,
        h24: change24h,
        d7: change7d,
      };

      const info: TokenInfo = {
        name:
          TOKEN_DISPLAY_NAMES[symbol] || geckoData.name || symbol.toUpperCase(),
        symbol: (geckoData.symbol || symbol).toUpperCase(),
        price,
        priceChange: priceChanges[getPriceChangeKey(selectedTimeFrame)] || 0,
        volume24h: md.total_volume?.usd || 0,
        marketCap: md.market_cap?.usd || 0,
        liquidity:
          parseFloat(dexPair?.liquidity?.usd || "0") ||
          md.total_volume?.usd ||
          0,
        priceChanges,
        websites:
          geckoData.links?.homepage
            ?.filter(Boolean)
            ?.map((url: string) => ({ url, label: "Website" })) || [],
        socials: geckoData.links?.twitter_screen_name
          ? [
              {
                url: `https://twitter.com/${geckoData.links.twitter_screen_name}`,
                type: "twitter",
              },
            ]
          : [],
        imageUrl: geckoData.image?.small,
      };

      setTokenInfo(info);
      setCache(cacheKey, info);
    } else if (dexPair) {
      // CoinGecko unavailable — fall back to DexScreener pair data
      const dexChanges = dexPair.priceChange || {};
      const priceChanges: Record<string, number> = {
        m5: parseFloat(dexChanges.m5 || "0"),
        h1: parseFloat(dexChanges.h1 || "0"),
        h6: parseFloat(dexChanges.h6 || "0"),
        h24: parseFloat(dexChanges.h24 || "0"),
        d7: parseFloat(dexChanges.h24 || "0"), // no 7d from DexScreener
      };

      const displayName =
        dexPair.baseToken.name === "Wrapped SOL"
          ? "Solana"
          : TOKEN_DISPLAY_NAMES[symbol] || dexPair.baseToken.name;

      const info: TokenInfo = {
        name: displayName,
        symbol: dexPair.baseToken.symbol,
        price: parseFloat(dexPair.priceUsd || "0"),
        priceChange: priceChanges[getPriceChangeKey(selectedTimeFrame)] || 0,
        volume24h: parseFloat(dexPair.volume?.h24 || "0"),
        marketCap:
          parseFloat(dexPair.marketCap || "0") ||
          parseFloat(dexPair.fdv || "0"),
        liquidity: parseFloat(dexPair.liquidity?.usd || "0"),
        priceChanges,
        websites: dexPair.info?.websites || [],
        socials: dexPair.info?.socials || [],
        imageUrl: dexPair.info?.imageUrl,
      };

      setTokenInfo(info);
      setCache(cacheKey, info);
    } else {
      // Neither source returned data — show fallback
      const fallback: TokenInfo = {
        name: TOKEN_DISPLAY_NAMES[symbol] || symbol.toUpperCase(),
        symbol: symbol.toUpperCase(),
        price: 0,
        priceChange: 0,
        volume24h: 0,
        marketCap: 0,
        liquidity: 0,
        priceChanges: { m5: 0, h1: 0, h6: 0, h24: 0, d7: 0 },
        websites: [],
        socials: [],
      };
      setTokenInfo(fallback);
    }
  }, [tokenAddress, symbol, selectedTimeFrame]);

  // Fetch stablecoin info from CoinGecko
  const fetchStablecoinInfo = useCallback(async () => {
    const cacheKey = `info_${tokenAddress}`;
    const cached = getCached<TokenInfo>(cacheKey);
    if (cached) {
      setTokenInfo(cached);
      return;
    }

    const geckoId = COINGECKO_IDS[symbol];
    if (!geckoId) return;

    try {
      const response = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      );
      const data = await response.json();

      const price = data.market_data?.current_price?.usd || 1.0;
      const change24h = data.market_data?.price_change_percentage_24h || 0;
      const change1h =
        data.market_data?.price_change_percentage_1h_in_currency?.usd || 0;

      const change7d = data.market_data?.price_change_percentage_7d || 0;

      const priceChanges: Record<string, number> = {
        m5: change1h / 12,
        h1: change1h,
        h6: change24h / 4,
        h24: change24h,
        d7: change7d,
      };

      const info: TokenInfo = {
        name: TOKEN_DISPLAY_NAMES[symbol] || data.name || symbol.toUpperCase(),
        symbol: (data.symbol || symbol).toUpperCase(),
        price,
        priceChange: priceChanges[getPriceChangeKey(selectedTimeFrame)] || 0,
        volume24h: data.market_data?.total_volume?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
        liquidity: data.market_data?.total_volume?.usd || 0,
        priceChanges,
        websites:
          data.links?.homepage
            ?.filter(Boolean)
            ?.map((url: string) => ({ url, label: "Website" })) || [],
        socials: data.links?.twitter_screen_name
          ? [
              {
                url: `https://twitter.com/${data.links.twitter_screen_name}`,
                type: "twitter",
              },
            ]
          : [],
        imageUrl: data.image?.small,
      };

      setTokenInfo(info);
      setCache(cacheKey, info);
    } catch (error) {
      console.error("Failed to fetch stablecoin info:", error);

      if (!tokenInfo) {
        setTokenInfo({
          name: TOKEN_DISPLAY_NAMES[symbol] || symbol.toUpperCase(),
          symbol: symbol.toUpperCase(),
          price: 1.0,
          priceChange: 0,
          volume24h: 0,
          marketCap: 0,
          liquidity: 0,
          priceChanges: { m5: 0, h1: 0, h6: 0, h24: 0, d7: 0 },
          websites: [],
          socials: [],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress, symbol, selectedTimeFrame]);

  const generateStablecoinChart = useCallback(
    (timeFrame: TimeFrame): ChartDataPoint[] => {
      const { limit } = getOhlcvParams(timeFrame);
      const points: ChartDataPoint[] = [];
      const now = Date.now();
      for (let i = 0; i < limit; i++) {
        const noise = (Math.random() - 0.5) * 0.004;
        points.push({
          value: 1.0 + noise,
          timestamp: now - (limit - i) * 60000,
        });
      }
      return points;
    },
    [],
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);

      if (isStablecoin(symbol)) {
        await fetchStablecoinInfo();
        if (!cancelled) {
          setChartData(generateStablecoinChart(selectedTimeFrame));
        }
      } else {
        const [, pool] = await Promise.all([fetchTokenInfo(), findPool()]);
        if (cancelled) return;
        if (pool) {
          setPoolAddress(pool);
          await fetchChartData(pool, selectedTimeFrame);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  const handleTimeFrameChange = async (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);

    if (tokenInfo) {
      const changeKey = getPriceChangeKey(timeFrame);
      setTokenInfo({
        ...tokenInfo,
        priceChange: tokenInfo.priceChanges[changeKey] || 0,
      });
    }

    if (isStablecoin(symbol)) {
      setChartData(generateStablecoinChart(timeFrame));
    } else if (poolAddress) {
      await fetchChartData(poolAddress, timeFrame);
    }
  };

  const openDexScreener = () => {
    if (dexScreenerPairAddress) {
      window.open(
        `https://dexscreener.com/solana/${dexScreenerPairAddress}`,
        "_blank",
      );
    }
  };

  const timeFrames: TimeFrame[] = ["5m", "1h", "6h", "24h", "7d"];

  // Chart SVG rendering
  const renderChart = () => {
    if (chartData.length === 0) return null;

    const width = 360;
    const height = 160;
    const padding = { top: 10, right: 0, bottom: 10, left: 0 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 0.01;

    const points = chartData
      .map((d, i) => {
        const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
        const y =
          padding.top + chartHeight - ((d.value - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    const isPositive = tokenInfo ? tokenInfo.priceChange >= 0 : true;
    const color = isPositive ? "#00FF00" : "#ef4444";

    // Create gradient area
    const areaPoints =
      `${padding.left},${padding.top + chartHeight} ` +
      points +
      ` ${width - padding.right},${padding.top + chartHeight}`;

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="mt-2">
        <defs>
          <linearGradient
            id={`chartGradient-${symbol}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#chartGradient-${symbol})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  if (isLoading && !tokenInfo) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 bg-black/95 z-30 flex flex-col backdrop-blur-sm"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!tokenInfo) return null;

  const isPositive = tokenInfo.priceChange >= 0;
  const priceChangeAbs = Math.abs(
    tokenInfo.price * (tokenInfo.priceChange / 100),
  );
  const formatChangeAmount = (amount: number): string => {
    if (amount >= 1) return amount.toFixed(2);
    if (amount >= 0.01) return amount.toFixed(4);
    return amount.toFixed(6);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-black/95 z-30 flex flex-col backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/90 shrink-0">
        <button
          onClick={onBack}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-sm font-bold tracking-tight flex-1">
          {tokenInfo.name.toUpperCase()}
        </h2>
        <button
          onClick={openDexScreener}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
          title="View on DexScreener"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
        {/* Price Section */}
        <div className="flex flex-col items-center py-4 mb-4">
          <p className="text-xl font-light font-mono text-white mb-0.5">
            ${formatPrice(tokenInfo.price)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-mono ${isPositive ? "text-neon-green" : "text-red-500"}`}
            >
              {isPositive ? "+" : "-"}${formatChangeAmount(priceChangeAbs)}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                isPositive
                  ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                  : "bg-red-500/10 border-red-500/30 text-red-500"
              }`}
            >
              {isPositive ? "+" : ""}
              {tokenInfo.priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="-mx-4 min-h-40 flex items-center justify-center">
          {isChartLoading ? (
            <div className="w-5 h-5 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          ) : chartData.length > 0 ? (
            renderChart()
          ) : (
            <p className="text-xs font-mono text-zinc-600">
              No chart data available
            </p>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center gap-1.5 mb-4">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeFrameChange(tf)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                selectedTimeFrame === tf
                  ? "border-neon-green/30 text-neon-green bg-neon-green/10"
                  : "border-white/10 text-zinc-500 bg-zinc-900/40 hover:text-zinc-300"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">
              TOKEN INFO
            </p>
          </div>

          <div className="p-2.5 bg-zinc-900/40 border border-white/10">
            <InfoRow label="Name" value={tokenInfo.name} />
            <InfoRow label="Symbol" value={tokenInfo.symbol} />
            <InfoRow label="Network" value="Solana" />
            <InfoRow
              label="Market Cap"
              value={`$${formatNumber(tokenInfo.marketCap)}`}
            />
            <InfoRow
              label="24h Volume"
              value={`$${formatNumber(tokenInfo.volume24h)}`}
            />
            <InfoRow
              label="Liquidity"
              value={`$${formatNumber(tokenInfo.liquidity)}`}
              isLast
            />
          </div>
        </div>

        {/* About Section */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">
              ABOUT
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tokenInfo.symbol} is a cryptocurrency token on the Solana
              blockchain.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tokenInfo.websites.length > 0 && (
              <a
                href={tokenInfo.websites[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-mono font-bold text-neon-green border border-neon-green hover:border-neon-green/80 hover:text-neon-green/80 transition-colors"
              >
                WEBSITE
              </a>
            )}
            {tokenInfo.socials
              .filter((s) => s.type === "twitter")
              .map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-mono font-bold text-neon-green border border-neon-green hover:border-neon-green/80 hover:text-neon-green/80 transition-colors"
                >
                  TWITTER
                </a>
              ))}
            {dexScreenerPairAddress && (
              <button
                onClick={openDexScreener}
                className="px-3 py-2 text-xs font-mono font-bold text-neon-green border border-neon-green hover:border-neon-green/80 hover:text-neon-green/80 transition-colors"
              >
                DEXSCREENER
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-2 ${
        !isLast ? "border-b border-white/5" : ""
      }`}
    >
      <span className="text-[10px] text-zinc-500 font-mono tracking-widest">
        {label.toUpperCase()}
      </span>
      <span className="text-xs font-medium text-zinc-300">{value}</span>
    </div>
  );
}
