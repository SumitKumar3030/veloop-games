import { useState, useEffect } from "react";
import GameLoader from "./GameLoader";
import ErrorState from "./ErrorState";
import { useNavigate } from "react-router-dom";

function GameArtworkPreloader({ game, children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const navigate = useNavigate();

  useEffect(() => {
  const img = new Image();
  img.onload = () => setStatus("loaded");
  img.onerror = () => setStatus("error");
  img.src = game.image;

  const failSafe = setTimeout(() => {
    setStatus((prev) => (prev === "loading" ? "loaded" : prev));
  }, 2000);

  return () => clearTimeout(failSafe);
}, [game.image]);

  const handleRetry = () => {
    setStatus("loading");
    const img = new Image();
    img.onload = () => setStatus("loaded");
    img.onerror = () => setStatus("error");
    img.src = `${game.image}?retry=${Date.now()}`; // cache-bust so it actually re-attempts
  };

  if (status === "loading") {
    return (
      <GameLoader
        theme="light"
        title={`Loading ${game.name}...`}
        subtitle="Preparing your challenge..."
      />
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        theme="light"
        title="Something went wrong."
        message="We couldn't start the game."
        onRetry={handleRetry}
        onBack={() => navigate("/")}
      />
    );
  }

  return children;
}

export default GameArtworkPreloader;