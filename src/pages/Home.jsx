import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GamesCarousel from "../components/games/GamesCarousel";
import GameLoader from "../components/common/GameLoader";
import gamesData from "../data/gamesData";
import BottomNav from "../components/common/BottomNav";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(() => gamesData.length > 0);

  useEffect(() => {
    const imagesToPreload = gamesData.slice(0, 6);
    if (imagesToPreload.length === 0) return; // nothing to preload, initial state already handled it

    let loadedCount = 0;
    const total = imagesToPreload.length;

    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= total) setIsLoading(false); // fine — inside an async callback
    };

    imagesToPreload.forEach((game) => {
      const img = new Image();
      img.onload = markLoaded;
      img.onerror = markLoaded;
      img.src = game.image;
    });

    const failSafe = setTimeout(() => setIsLoading(false), 2500); // fine — inside a callback
    return () => clearTimeout(failSafe);
  }, []);

  const handlePlay = (game) => {
    navigate(`/games/${game.slug}`);
  };

  if (isLoading) {
    return (
      <GameLoader
        theme="dark"
        title="Loading Games..."
        subtitle="Preparing your next reward challenge..."
      />
    );
  }

  return (
    <div className={styles.page}>
      <GamesCarousel onPlay={handlePlay} />
      <BottomNav theme="dark" />
    </div>
  );
}

export default Home;