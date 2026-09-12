import { createContext, useContext, useCallback, useState } from "react";

export const TokenContext = createContext(null);

export const STARTING_TOKENS = 150;

export function useTokenStoreValue() {
  const [tokenBalance, setTokenBalance] = useState(STARTING_TOKENS);

  const hasEnoughTokens = useCallback(
    (cost) => tokenBalance >= cost,
    [tokenBalance]
  );

  const deductTokens = useCallback((cost) => {
    let success = false;
    setTokenBalance((prev) => {
      if (prev >= cost) {
        success = true;
        return prev - cost;
      }
      return prev;
    });
    return success;
  }, []);

  const addTokens = useCallback((amount) => {
    setTokenBalance((prev) => prev + amount);
  }, []);

  return { tokenBalance, hasEnoughTokens, deductTokens, addTokens };
}

export function useTokens() {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw new Error("useTokens must be used within a TokenProvider");
  }
  return ctx;
}