import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";

import GamesCarousel from "../components/games/GamesCarousel";
import GameLoader from "../components/common/GameLoader";
import gamesData from "../data/gamesData";
import BottomNav from "../components/common/BottomNav";

import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();

  const { gameCoinBalance } = useGameCoins();
  const { tokenBalance } = useTokens();

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
            className={styles.rewardWallet}
            aria-label={`Rewards. ${tokenBalance} Tokens and ${gameCoinBalance} Game Coins`}
            onClick={() => navigate("/redeem")}
          >
            <span className={styles.rewardWalletPreview}>
              
              <span className={styles.rewardTokenIcon} aria-hidden="true">O</span>

              <span className={styles.rewardArrow}>›</span>
            </span>

            <span className={styles.rewardWalletDetails}>
              <span className={styles.rewardItem}>
                <img
                  src="/assets/icons/token-icon.png"
                  alt=""
                  className={styles.rewardTokenIcon}
                />

                <span className={styles.rewardItemText}>
                  <span className={styles.rewardItemLabel}>TOKENS</span>
                  <strong>{tokenBalance}</strong>
                </span>
              </span>

              <span className={styles.rewardDivider} />

              <span className={styles.rewardItem}>
                <img
                  src="/assets/icons/game-coin-icon.png"
                  alt=""
                  className={styles.rewardCoinIcon}
                />

                <span className={styles.rewardItemText}>
                  <span className={styles.rewardItemLabel}>GAME COINS</span>
                  <strong>{gameCoinBalance}</strong>
                </span>
              </span>
            </span>
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
          <div className={styles.titleGlow} />

          <h1 className={styles.heroTitle}>
            <span className={styles.titleMain}>GAMES</span>
            <span className={styles.titleShine}>GAMES</span>
          </h1>

          <span className={styles.heroEyebrow}>
            <span>PLAY</span>
            <i>•</i>
            <span>EARN</span>
            <i>•</i>
            <span>REDEEM</span>
          </span>

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
          HOW VELOOP WORKS
      ========================================= */}

      <section className={styles.howWorks}>
        <div className={styles.howWorksHeader}>
          <span className={styles.sectionEyebrow}>HOW VELOOP WORKS</span>

          <h2 className={styles.howWorksTitle}>
            Play. Earn. <span>Redeem.</span>
          </h2>

          <p className={styles.howWorksSubtitle}>
            Turn your gaming time into rewards.
          </p>
        </div>

        <div className={styles.steps}>
          <article className={styles.stepCard}>
            <div className={styles.stepNumber}>01</div>

            <div className={styles.stepIcon}>
              <span>🎮</span>
            </div>

            <div className={styles.stepContent}>
              <h3>PLAY</h3>
              <p>Choose a game and put your skills to the test.</p>
            </div>
          </article>

          <div className={styles.stepConnector} />

          <article className={styles.stepCard}>
            <div className={styles.stepNumber}>02</div>

            <div className={styles.stepIcon}>
              <img src="/assets/icons/game-coin-icon.png" alt="" />
            </div>

            <div className={styles.stepContent}>
              <h3>EARN</h3>
              <p>Complete challenges and collect Game Coins.</p>
            </div>
          </article>

          <div className={styles.stepConnector} />

          <article className={styles.stepCard}>
            <div className={styles.stepNumber}>03</div>

            <div className={styles.stepIcon}>
              <span>🎁</span>
            </div>

            <div className={styles.stepContent}>
              <h3>REDEEM</h3>
              <p>Exchange your rewards for exciting benefits.</p>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================
          NAVIGATION
      ========================================= */}
      <BottomNav theme="dark" />
    </div>
  );
}

export default Home;
