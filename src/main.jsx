import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/variables.css";
import "./index.css";
import App from "./App.jsx";
import { TokenProvider } from "./context/TokenProvider.jsx";
import { GameCoinProvider } from "./context/GameCoinProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TokenProvider>
      <GameCoinProvider>
        <App />
      </GameCoinProvider>
    </TokenProvider>
  </StrictMode>
);