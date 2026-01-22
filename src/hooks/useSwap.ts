import { useState, useCallback, useEffect, useRef } from "react";
import { Keypair } from "@solana/web3.js";
import type { SwapToken, SwapQuote, SwapResult } from "../lib/swap";
import {
  getSwapService,
  SUPPORTED_TOKENS,
  SWAP_CONFIG,
  fromRawAmount,
  getTokenDecimals,
} from "../lib/swap";

interface UseSwapParams {
  keypair: Keypair | null;
}

interface UseSwapReturn {
  // Token state
  inputToken: SwapToken;
  outputToken: SwapToken;
  setInputToken: (token: SwapToken) => void;
  setOutputToken: (token: SwapToken) => void;
  switchTokens: () => void;

  // Amount state
  inputAmount: string;
  outputAmount: string;
  setInputAmount: (amount: string) => void;

  // Quote state
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  quoteError: string | null;
  refreshQuote: () => Promise<void>;

  // Slippage
  slippageBps: number;
  setSlippageBps: (bps: number) => void;

  // Execution
  executeSwap: () => Promise<SwapResult | null>;
  isExecuting: boolean;
  swapResult: SwapResult | null;
  swapError: string | null;
  clearSwapResult: () => void;

  // Exchange rate
  exchangeRate: string;

  // Supported tokens
  supportedTokens: SwapToken[];
}

export function useSwap({ keypair }: UseSwapParams): UseSwapReturn {
  // Token state - default to SOL -> USDC
  const [inputToken, setInputToken] = useState<SwapToken>(
    SUPPORTED_TOKENS.find((t) => t.symbol === "SOL") || SUPPORTED_TOKENS[0]
  );
  const [outputToken, setOutputToken] = useState<SwapToken>(
    SUPPORTED_TOKENS.find((t) => t.symbol === "USDC") || SUPPORTED_TOKENS[1]
  );

  // Amount state
  const [inputAmount, setInputAmountState] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");

  // Quote state
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Slippage state
  const [slippageBps, setSlippageBps] = useState(SWAP_CONFIG.defaultSlippageBps);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Exchange rate
  const [exchangeRate, setExchangeRate] = useState<string>("0");

  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh timer ref
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Swap service
  const swapService = getSwapService();

  // Fetch quote with debounce
  const fetchQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null);
        setOutputAmount("");
        setQuoteError(null);
        return;
      }

      if (!keypair) {
        setQuoteError("Wallet not connected");
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const newQuote = await swapService.getQuote({
          inputMint: inputToken.mintAddress,
          outputMint: outputToken.mintAddress,
          amount,
          slippageBps,
          userPublicKey: keypair.publicKey.toString(),
        });

        setQuote(newQuote);

        // Set output amount from quote
        const outputDecimals = getTokenDecimals(outputToken.mintAddress);
        setOutputAmount(fromRawAmount(newQuote.outputAmount, outputDecimals));

        // Calculate exchange rate
        const inputRaw = BigInt(newQuote.inputAmount);
        const outputRaw = BigInt(newQuote.outputAmount);
        if (inputRaw > 0n) {
          const rate =
            Number(outputRaw) /
            Math.pow(10, outputToken.decimals) /
            (Number(inputRaw) / Math.pow(10, inputToken.decimals));
          setExchangeRate(rate.toFixed(6));
        }
      } catch (error: any) {
        console.error("Failed to fetch quote:", error);
        setQuoteError(error.message || "Failed to get quote");
        setQuote(null);
        setOutputAmount("");
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [inputToken, outputToken, slippageBps, keypair, swapService]
  );

  // Debounced input amount setter
  const setInputAmount = useCallback(
    (amount: string) => {
      setInputAmountState(amount);

      // Clear existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce timer (500ms)
      debounceRef.current = setTimeout(() => {
        fetchQuote(amount);
      }, 500);
    },
    [fetchQuote]
  );

  // Refresh quote manually
  const refreshQuote = useCallback(async () => {
    if (inputAmount) {
      await fetchQuote(inputAmount);
    }
  }, [inputAmount, fetchQuote]);

  // Switch input and output tokens
  const switchTokens = useCallback(() => {
    const tempToken = inputToken;
    const tempAmount = outputAmount;

    setInputToken(outputToken);
    setOutputToken(tempToken);
    setInputAmountState(tempAmount);
    setOutputAmount(inputAmount);

    // Fetch new quote for switched tokens
    if (tempAmount && parseFloat(tempAmount) > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchQuote(tempAmount);
      }, 500);
    }
  }, [inputToken, outputToken, inputAmount, outputAmount, fetchQuote]);

  // Execute the swap
  const executeSwap = useCallback(async (): Promise<SwapResult | null> => {
    if (!keypair) {
      setSwapError("Wallet not connected");
      return null;
    }

    if (!quote) {
      setSwapError("No quote available");
      return null;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setSwapError("Invalid input amount");
      return null;
    }

    setIsExecuting(true);
    setSwapError(null);
    setSwapResult(null);

    try {
      const result = await swapService.executeSwap(
        {
          inputMint: inputToken.mintAddress,
          outputMint: outputToken.mintAddress,
          amount: inputAmount,
          slippageBps,
          userPublicKey: keypair.publicKey.toString(),
        },
        keypair
      );

      setSwapResult(result);

      if (!result.success) {
        setSwapError(result.error || "Swap failed");
      } else {
        // Clear input on success
        setInputAmountState("");
        setOutputAmount("");
        setQuote(null);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Swap execution failed";
      setSwapError(errorMessage);
      setSwapResult({
        success: false,
        inputSpent: "0",
        outputReceived: "0",
        error: errorMessage,
      });
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [
    keypair,
    quote,
    inputAmount,
    inputToken,
    outputToken,
    slippageBps,
    swapService,
  ]);

  // Clear swap result
  const clearSwapResult = useCallback(() => {
    setSwapResult(null);
    setSwapError(null);
  }, []);

  // Auto-refresh quote every 10 seconds when there's an active quote
  useEffect(() => {
    if (quote && inputAmount && parseFloat(inputAmount) > 0 && !isExecuting) {
      refreshIntervalRef.current = setInterval(() => {
        fetchQuote(inputAmount);
      }, SWAP_CONFIG.quoteRefreshMs);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [quote, inputAmount, isExecuting, fetchQuote]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Re-fetch quote when tokens or slippage change
  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchQuote(inputAmount);
      }, 500);
    }
  }, [inputToken, outputToken, slippageBps]);

  return {
    // Token state
    inputToken,
    outputToken,
    setInputToken,
    setOutputToken,
    switchTokens,

    // Amount state
    inputAmount,
    outputAmount,
    setInputAmount,

    // Quote state
    quote,
    isLoadingQuote,
    quoteError,
    refreshQuote,

    // Slippage
    slippageBps,
    setSlippageBps,

    // Execution
    executeSwap,
    isExecuting,
    swapResult,
    swapError,
    clearSwapResult,

    // Exchange rate
    exchangeRate,

    // Supported tokens
    supportedTokens: SUPPORTED_TOKENS,
  };
}
