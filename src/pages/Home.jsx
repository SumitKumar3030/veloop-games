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

    if (imagesToPreload.length === 0) return;

    let loadedCount = 0;
    const total = imagesToPreload.length;

    const markLoaded = () => {
      loadedCount++;

      if (loadedCount >= total) {
        setIsLoading(false);
      }
    };

    imagesToPreload.forEach((game) => {
      const img = new Image();

      img.onload = markLoaded;
      img.onerror = markLoaded;
      img.src = game.image;
    });

    const failSafe = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

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
      {/* =========================================
          HOME HERO
      ========================================= */}

      <div className={styles.pageCoins} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <img
            key={index}
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.pageCoin} ${styles[`pageCoin${index + 1}`]}`}
          />
        ))}
      </div>
      <header className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>V</span>

            <span className={styles.brandName}>VELOOP</span>
          </div>

          <button
            type="button"
            className={styles.walletButton}
            aria-label="Rewards wallet"
          >
            <img
              src="/assets/icons/game-coin-icon.png"
              alt=""
              className={styles.walletIcon}
            />

            <span className={styles.walletLabel}>Rewards</span>

            <span className={styles.walletArrow}>›</span>
          </button>
        </div>

        {/* Floating coins */}
        <div className={styles.coinField} aria-hidden="true">
          <img
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.floatingCoin} ${styles.coinOne}`}
          />

          <img
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.floatingCoin} ${styles.coinTwo}`}
          />

          <img
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.floatingCoin} ${styles.coinThree}`}
          />

          <img
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.floatingCoin} ${styles.coinFour}`}
          />

          <img
            src="/assets/icons/game-coin-icon.png"
            alt=""
            className={`${styles.floatingCoin} ${styles.coinFive}`}
          />
        </div>

        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <span>PLAY</span>
            <i>•</i>
            <span>EARN</span>
            <i>•</i>
            <span>REDEEM</span>
          </span>

          <div className={styles.titleGlow} />

          <h1 className={styles.heroTitle}>
            <span className={styles.titleMain}>GAMES</span>
            <span className={styles.titleShine}>GAMES</span>
          </h1>

          <p className={styles.heroSubtitle}>
            <span>Explore Games</span>
            <strong>&amp;</strong>
            <span>Earn Rewards</span>
          </p>

          <div className={styles.heroAccent}>
            <span />
          </div>
        </div>
      </header>

      {/* =========================================
          EXISTING GAME CAROUSEL
      ========================================= */}
      <GamesCarousel onPlay={handlePlay} />

      {/* =========================================
          NAVIGATION
      ========================================= */}
      <BottomNav theme="dark" />
    </div>
  );
}

export default Home;
