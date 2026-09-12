import { TokenContext, useTokenStoreValue } from "./TokenStore";

export function TokenProvider({ children }) {
  const value = useTokenStoreValue();
  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}