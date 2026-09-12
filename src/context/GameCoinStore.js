import { createContext, useContext, useCallback, useState } from "react";

export const GameCoinContext = createContext(null);

export const STARTING_GAME_COINS = 20;

export function useGameCoinStoreValue() {
  const [gameCoinBalance, setGameCoinBalance] = useState(STARTING_GAME_COINS);

  const addGameCoins = useCallback((amount) => {
    setGameCoinBalance((prev) => prev + amount);
  }, []);

  const hasEnoughGameCoins = useCallback(
    (amount) => gameCoinBalance >= amount,
    [gameCoinBalance]
  );

  const redeemGameCoins = useCallback((amount) => {
    let success = false;
    setGameCoinBalance((prev) => {
      if (prev >= amount) {
        success = true;
        return prev - amount;
      }
      return prev;
    });
    return success;
  }, []);

  return { gameCoinBalance, addGameCoins, hasEnoughGameCoins, redeemGameCoins };
}

export function useGameCoins() {
  const ctx = useContext(GameCoinContext);
  if (!ctx) {
    throw new Error("useGameCoins must be used within a GameCoinProvider");
  }
  return ctx;
}