import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";

import GamesCarousel from "../components/games/GamesCarousel";
import GameLoader from "../components/common/GameLoader";
import CoinHero from "../components/common/CoinHero";
import BottomNav from "../components/common/BottomNav";

import gamesData from "../data/gamesData";

import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();

  const { gameCoinBalance } = useGameCoins();
  const { tokenBalance } = useTokens();

  const [isLoading, setIsLoading] = useState(() => gamesData.length > 0);

  /* =========================================================
     PRELOAD GAME ARTWORK
  ========================================================= */

  useEffect(() => {
    const imagesToPreload = gamesData.slice(0, 6);

    if (imagesToPreload.length === 0) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const total = imagesToPreload.length;

    const markLoaded = () => {
      loadedCount += 1;

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

    return () => {
      clearTimeout(failSafe);
    };
  }, []);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handlePlay = (game) => {
    navigate(`/games/${game.slug}`);
  };

  const scrollToGames = () => {
    document
      .getElementById("explore-games")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleStartPlaying = () => {
    scrollToGames();
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <GameLoader
        theme="dark"
        title="Loading Games..."
        subtitle="Preparing your next reward challenge..."
      />
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className={styles.page}>
      {/* =====================================================
          01 — TOP HEADER
      ====================================================== */}

      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* BRAND */}

          <button
            type="button"
            className={styles.brand}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="VELOOP Games home"
          >
            <span className={styles.brandMark}>V</span>

            <span className={styles.brandName}>VELOOP</span>
          </button>

          {/* REWARD WALLET */}

          <button
            type="button"
            className={styles.rewardWallet}
            aria-label={`Rewards. ${tokenBalance} Tokens and ${gameCoinBalance} Game Coins`}
            onClick={() => navigate("/redeem")}
          >
            <div className={styles.rewardItem}>
              <img
                src="/assets/icons/token-icon.png"
                alt=""
                className={styles.rewardTokenIcon}
              />

              <div className={styles.rewardItemInfo}>
                <span>TOKENS</span>
                <strong>{tokenBalance}</strong>
              </div>
            </div>

            <span className={styles.rewardDivider} />

            <div className={styles.rewardItem}>
              <img
                src="/assets/icons/game-coin-icon.png"
                alt=""
                className={styles.rewardCoinIcon}
              />

              <div className={styles.rewardItemInfo}>
                <span>GAME COINS</span>
                <strong>{gameCoinBalance}</strong>
              </div>
            </div>

            <span className={styles.rewardArrow}>›</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          02 — PLAY / EARN / REDEEM + COIN HERO
      ====================================================== */}

      <main>
        <CoinHero
          title="PLAY. EARN. REDEEM."
          subtitle="Enter the VELOOP Games zone, take on exciting challenges, earn Game Coins and turn your gameplay into rewards."
          onPlay={handleStartPlaying}
        />

        {/* ===================================================
            03 — PLAY / EARN / REDEEM EXPLANATION
        ==================================================== */}

        <section className={styles.loopSection}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.sectionEyebrow}>
              THE REWARD LOOP
            </span>

            <h2>
              Play. Earn. <span>Redeem.</span>
            </h2>

            <p>
              A simple journey from gameplay to rewards.
            </p>
          </div>

          <div className={styles.loopGrid}>
            {/* PLAY */}

            <article className={styles.loopCard}>
              <div className={styles.loopCardTop}>
                <span className={styles.loopNumber}>01</span>

                <div className={styles.loopIcon}>
                  <span>🎮</span>
                </div>
              </div>

              <span className={styles.loopLabel}>PLAY</span>

              <h3>Choose Your Challenge</h3>

              <p>
                Pick a game from the VELOOP Games collection and put your
                skills to the test.
              </p>

              <div className={styles.loopCardLine} />
            </article>

            {/* EARN */}

            <article className={styles.loopCard}>
              <div className={styles.loopCardTop}>
                <span className={styles.loopNumber}>02</span>

                <div className={styles.loopIcon}>
                  <img
                    src="/assets/icons/game-coin-icon.png"
                    alt=""
                  />
                </div>
              </div>

              <span className={styles.loopLabel}>EARN</span>

              <h3>Collect Game Coins</h3>

              <p>
                Complete challenges, improve your performance and collect
                Game Coins through gameplay.
              </p>

              <div className={styles.loopCardLine} />
            </article>

            {/* REDEEM */}

            <article className={styles.loopCard}>
              <div className={styles.loopCardTop}>
                <span className={styles.loopNumber}>03</span>

                <div className={styles.loopIcon}>
                  <span>🎁</span>
                </div>
              </div>

              <span className={styles.loopLabel}>REDEEM</span>

              <h3>Turn Coins Into Rewards</h3>

              <p>
                Use your Game Coins inside the Rewards Center and continue
                the loop.
              </p>

              <div className={styles.loopCardLine} />
            </article>
          </div>
        </section>

        {/* ===================================================
            04 — EXPLORE GAMES
        ==================================================== */}

        <section
          className={styles.exploreSection}
          id="explore-games"
        >
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                DISCOVER YOUR NEXT CHALLENGE
              </span>

              <h2>
                Explore <span>Games</span>
              </h2>

              <p>
                Pick your challenge. Play with skill. Earn your reward.
              </p>
            </div>

            <div className={styles.gameCount}>
              <strong>13</strong>
              <span>GAMES</span>
            </div>
          </div>

          {/* CATEGORY FILTER VISUAL */}

          <div className={styles.categories}>
            <button
              type="button"
              className={`${styles.categoryButton} ${styles.categoryActive}`}
            >
              All Games
            </button>

            <button
              type="button"
              className={styles.categoryButton}
            >
              Arcade
            </button>

            <button
              type="button"
              className={styles.categoryButton}
            >
              Puzzle
            </button>

            <button
              type="button"
              className={styles.categoryButton}
            >
              Adventure
            </button>

            <button
              type="button"
              className={styles.categoryButton}
            >
              Skill
            </button>
          </div>
        </section>

        {/* ===================================================
            05 — GAME CAROUSEL
        ==================================================== */}

        <section className={styles.gamesCarouselSection}>
          <GamesCarousel onPlay={handlePlay} />
        </section>

        {/* ===================================================
            06 — WHY PLAY?
        ==================================================== */}

        <section className={styles.whyPlaySection}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.sectionEyebrow}>
              MORE THAN JUST GAMES
            </span>

            <h2>
              Why <span>Play?</span>
            </h2>

            <p>
              Every game is part of the VELOOP reward journey.
            </p>
          </div>

          <div className={styles.whyPlayGrid}>
            <article className={styles.whyPlayCard}>
              <div className={styles.cardIcon}>
                🎮
              </div>

              <span className={styles.cardNumber}>
                01
              </span>

              <h3>Play & Challenge</h3>

              <p>
                Jump into exciting games and challenge yourself across
                different game styles.
              </p>
            </article>

            <article className={styles.whyPlayCard}>
              <div className={styles.cardIcon}>
                <img
                  src="/assets/icons/game-coin-icon.png"
                  alt=""
                />
              </div>

              <span className={styles.cardNumber}>
                02
              </span>

              <h3>Earn Game Coins</h3>

              <p>
                Complete games, improve your performance and collect Game
                Coins as you play.
              </p>
            </article>

            <article className={styles.whyPlayCard}>
              <div className={styles.cardIcon}>
                🎁
              </div>

              <span className={styles.cardNumber}>
                03
              </span>

              <h3>Redeem Rewards</h3>

              <p>
                Use your Game Coins to unlock rewards inside the VELOOP
                ecosystem.
              </p>
            </article>
          </div>
        </section>

        {/* ===================================================
            07 — HOW TO EARN GAME COINS
        ==================================================== */}

        <section className={styles.earnSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                BUILD YOUR BALANCE
              </span>

              <h2>
                How to Earn <span>Game Coins</span>
              </h2>

              <p>
                Play, perform and collect Game Coins along the way.
              </p>
            </div>

            <div className={styles.coinBalanceShowcase}>
              <img
                src="/assets/icons/game-coin-icon.png"
                alt=""
              />

              <div>
                <span>YOUR BALANCE</span>

                <strong>{gameCoinBalance}</strong>
              </div>
            </div>
          </div>

          <div className={styles.earnSteps}>
            <article className={styles.earnStep}>
              <span className={styles.stepNumber}>
                01
              </span>

              <div className={styles.stepIcon}>
                🎮
              </div>

              <h3>Play Games</h3>

              <p>
                Enter your favourite game using Tokens and start your
                challenge.
              </p>
            </article>

            <div className={styles.stepConnector} />

            <article className={styles.earnStep}>
              <span className={styles.stepNumber}>
                02
              </span>

              <div className={styles.stepIcon}>
                🏆
              </div>

              <h3>Complete Challenges</h3>

              <p>
                Finish levels, score higher and complete gameplay
                objectives.
              </p>
            </article>

            <div className={styles.stepConnector} />

            <article className={styles.earnStep}>
              <span className={styles.stepNumber}>
                03
              </span>

              <div className={styles.stepIcon}>
                <img
                  src="/assets/icons/game-coin-icon.png"
                  alt=""
                />
              </div>

              <h3>Collect Game Coins</h3>

              <p>
                Successful gameplay adds Game Coins to your reward
                balance.
              </p>
            </article>
          </div>
        </section>

        {/* ===================================================
            08 — HOW TO USE GAME COINS
        ==================================================== */}

        <section className={styles.useCoinsSection}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.sectionEyebrow}>
              YOUR GAME COINS. YOUR REWARDS.
            </span>

            <h2>
              How to Use <span>Game Coins</span>
            </h2>

            <p>
              Turn the coins you earn through gameplay into rewards.
            </p>
          </div>

          <div className={styles.useCoinsGrid}>
            <article className={styles.useCoinCard}>
              <div className={styles.useCoinIcon}>
                🎁
              </div>

              <span>01</span>

              <h3>Redeem Rewards</h3>

              <p>
                Exchange your Game Coins for available rewards inside the
                Rewards Center.
              </p>
            </article>

            <article className={styles.useCoinCard}>
              <div className={styles.useCoinIcon}>
                ✨
              </div>

              <span>02</span>

              <h3>Explore Rewards</h3>

              <p>
                Discover the different reward options available to you.
              </p>
            </article>

            <article className={styles.useCoinCard}>
              <div className={styles.useCoinIcon}>
                🚀
              </div>

              <span>03</span>

              <h3>Keep Playing</h3>

              <p>
                Play more games and continue building your Game Coin
                balance.
              </p>
            </article>
          </div>

          <button
            type="button"
            className={styles.textLink}
            onClick={() => navigate("/redeem")}
          >
            Explore Rewards
            <span>→</span>
          </button>
        </section>

        {/* ===================================================
            09 — FEATURED PLAYABLE GAMES
        ==================================================== */}

        <section className={styles.featuredSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                PLAYABLE EXPERIENCES
              </span>

              <h2>
                Featured <span>Games</span>
              </h2>

              <p>
                Take on deeper challenges in our fully playable games.
              </p>
            </div>

            <span className={styles.featuredBadge}>
              2 PLAYABLE
            </span>
          </div>

          <div className={styles.featuredGrid}>
            {/* MERGE MASTER */}

            <article
              className={`${styles.featuredGameCard} ${styles.mergeMasterCard}`}
            >
              <div className={styles.featuredGameVisual}>
                <div className={styles.featuredGamePattern}>
                  <span>2</span>
                  <span>8</span>
                  <span>64</span>
                  <span>128</span>
                  <span>512</span>
                </div>

                <div className={styles.featuredGameBadge}>
                  PLAYABLE
                </div>
              </div>

              <div className={styles.featuredGameContent}>
                <span className={styles.featuredGameCategory}>
                  ARCADE PUZZLE
                </span>

                <h3>Merge Master</h3>

                <p>
                  Merge numbers, build combos and chase your highest score.
                </p>

                <button
                  type="button"
                  className={styles.featuredPlayButton}
                  onClick={() =>
                    navigate("/games/merge-master")
                  }
                >
                  <span>Play Merge Master</span>
                  <span>→</span>
                </button>
              </div>
            </article>

            {/* WORMZY */}

            <article
              className={`${styles.featuredGameCard} ${styles.wormzyCard}`}
            >
              <div className={styles.featuredGameVisual}>
                <div className={styles.wormzyVisual}>
                  <span>🐍</span>
                </div>

                <div className={styles.featuredGameBadge}>
                  PLAYABLE
                </div>
              </div>

              <div className={styles.featuredGameContent}>
                <span className={styles.featuredGameCategory}>
                  ADVENTURE PUZZLE
                </span>

                <h3>Wormzy</h3>

                <p>
                  Solve levels, collect apples and guide Wormzy to the
                  exit.
                </p>

                <button
                  type="button"
                  className={styles.featuredPlayButton}
                  onClick={() =>
                    navigate("/games/wormzy")
                  }
                >
                  <span>Play Wormzy</span>
                  <span>→</span>
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* ===================================================
            10 — GAME COIN SHOWCASE
        ==================================================== */}

        <section className={styles.coinShowcaseSection}>
          <div className={styles.coinShowcaseBackground}>
            <div className={styles.showcaseGlow} />

            <div
              className={`${styles.showcaseRing} ${styles.showcaseRingOne}`}
            />

            <div
              className={`${styles.showcaseRing} ${styles.showcaseRingTwo}`}
            />
          </div>

          <div className={styles.coinShowcaseContent}>
            <span className={styles.sectionEyebrow}>
              YOUR REWARD CURRENCY
            </span>

            <h2>
              Every Game.
              <br />
              Every Challenge.
              <br />
              <span>Every Coin.</span>
            </h2>

            <p>
              Game Coins are at the heart of the VELOOP Games experience.
              Keep playing and keep earning.
            </p>

            <div className={styles.showcaseBalance}>
              <img
                src="/assets/icons/game-coin-icon.png"
                alt=""
              />

              <div>
                <span>CURRENT GAME COINS</span>

                <strong>{gameCoinBalance}</strong>
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate("/redeem")}
            >
              Redeem Game Coins
            </button>
          </div>

          <div className={styles.bigCoinContainer}>
            <div className={styles.bigCoin}>
              <img
                src="/assets/icons/game-coin-icon.png"
                alt="Game Coin"
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            11 — HOW VELOOP WORKS
        ==================================================== */}

        <section className={styles.howWorks}>
          <div className={styles.howWorksHeader}>
            <span className={styles.sectionEyebrow}>
              THE VELOOP JOURNEY
            </span>

            <h2 className={styles.howWorksTitle}>
              Play. Earn. <span>Redeem.</span>
            </h2>

            <p className={styles.howWorksSubtitle}>
              One simple loop from gameplay to rewards.
            </p>
          </div>

          <div className={styles.steps}>
            <article className={styles.stepCard}>
              <div className={styles.stepNumber}>
                01
              </div>

              <div className={styles.stepIcon}>
                🎮
              </div>

              <div className={styles.stepContent}>
                <h3>PLAY</h3>

                <p>
                  Choose a game and put your skills to the test.
                </p>
              </div>
            </article>

            <div className={styles.stepConnector} />

            <article className={styles.stepCard}>
              <div className={styles.stepNumber}>
                02
              </div>

              <div className={styles.stepIcon}>
                <img
                  src="/assets/icons/game-coin-icon.png"
                  alt=""
                />
              </div>

              <div className={styles.stepContent}>
                <h3>EARN</h3>

                <p>
                  Complete challenges and collect Game Coins.
                </p>
              </div>
            </article>

            <div className={styles.stepConnector} />

            <article className={styles.stepCard}>
              <div className={styles.stepNumber}>
                03
              </div>

              <div className={styles.stepIcon}>
                🎁
              </div>

              <div className={styles.stepContent}>
                <h3>REDEEM</h3>

                <p>
                  Exchange your Game Coins for exciting rewards.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ===================================================
            12 — REWARDS CTA
        ==================================================== */}

        <section className={styles.rewardsCta}>
          <div className={styles.ctaBackground}>
            <div className={styles.ctaGlow} />
          </div>

          <div className={styles.ctaContent}>
            <span className={styles.sectionEyebrow}>
              READY TO PLAY?
            </span>

            <h2>
              Your next reward
              <br />
              <span>starts with a game.</span>
            </h2>

            <p>
              Choose your challenge, earn Game Coins and keep the loop
              going.
            </p>

            <div className={styles.ctaActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleStartPlaying}
              >
                Start Playing
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate("/redeem")}
              >
                Explore Rewards
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          13 — FOOTER
      ====================================================== */}

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span>V</span>
              VELOOP
            </div>

            <p>Play. Earn. Redeem.</p>
          </div>

          <div className={styles.footerLinks}>
            <div>
              <span>EXPLORE</span>

              <button
                type="button"
                onClick={scrollToGames}
              >
                Games
              </button>

              <button
                type="button"
                onClick={() => navigate("/redeem")}
              >
                Rewards
              </button>
            </div>

            <div>
              <span>ACCOUNT</span>

              <button
                type="button"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>

              <button
                type="button"
                onClick={() => navigate("/redeem")}
              >
                Redeem
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 VELOOP</span>

          <span>Games • Rewards • Experiences</span>
        </div>
      </footer>

      {/* =====================================================
          14 — FLOATING BOTTOM NAVIGATION
      ====================================================== */}

      <BottomNav theme="dark" />
    </div>
  );
}

export default Home;