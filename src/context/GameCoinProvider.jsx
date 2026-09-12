import { GameCoinContext, useGameCoinStoreValue } from "./GameCoinStore";

export function GameCoinProvider({ children }) {
  const value = useGameCoinStoreValue();
  return (
    <GameCoinContext.Provider value={value}>
      {children}
    </GameCoinContext.Provider>
  );
}