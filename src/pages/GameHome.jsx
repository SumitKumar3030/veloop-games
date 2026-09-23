import { useState } from "react";
import { useParams, Link } from "react-router-dom";

import gamesData from "../data/gamesData";
import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";

import GameGuide from "../components/games/GameGuide";
import BottomNav from "../components/common/BottomNav";
import GameArtworkPreloader from "../components/common/GameArtworkPreloader";

import MergeMasterGame from "../games/MergeMaster/Game";
import WormzyGame from "../games/Wormzy/Game";

import { useDominantColor } from "../hooks/useDominantColor";

import styles from "./GameHome.module.css";

function GameHome() {
  const { slug } = useParams();

  const { gameCoinBalance, addGameCoins } = useGameCoins();
  const { tokenBalance, hasEnoughTokens, deductTokens } = useTokens();

  const [showGuide, setShowGuide] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const game = gamesData.find((item) => item.slug === slug);
  const accentColor = useDominantColor(game?.image);

  if (!game) {
    return (
      <div className={styles.notFound}>
        <p>Game not found.</p>
        <Link to="/">← Back to Games</Link>
      </div>
    );
  }

  const guideSeenKey = `veloop-guide-seen-${game.slug}`;

  const handlePlayNow = () => {
    if (!hasEnoughTokens(game.cost)) {
      setShowInsufficientModal(true);
      return;
    }

    setIsStarting(true);

    setTimeout(() => {
      deductTokens(game.cost);

      const hasSeenGuide = localStorage.getItem(guideSeenKey);

      if (!hasSeenGuide && game.guide) {
        setShowGuide(true);
      } else {
        setGameStarted(true);
      }

      setIsStarting(false);
    }, 450);
  };

  const handleGuideClose = () => {
    localStorage.setItem(guideSeenKey, "true");
    setShowGuide(false);
    setGameStarted(true);
  };

  const handleGameEnd = (reward) => {
    addGameCoins(reward);
    setRewardToast(reward);
    setGameStarted(false);

    setTimeout(() => {
      setRewardToast(null);
    }, 3500);
  };

  const handleWormzyGameOver = (shouldRetry) => {
    setGameStarted(false);

    if (shouldRetry) {
      setTimeout(() => handlePlayNow(), 50);
    }
  };

  const themeClass =
    game.theme?.key === "merge-master"
      ? styles.themeMergeMaster
      : game.theme?.key === "wormzy"
        ? styles.themeWormzy
        : "";

  return (
    <GameArtworkPreloader key={game.slug} game={game}>
      <div
        className={`${styles.page} ${themeClass} ${
          gameStarted ? styles.gameRunning : ""
        }`}
      >
        {!gameStarted && (
          <header className={styles.header}>
            <Link
              to="/"
              className={styles.backLink}
              aria-label="Back to Games"
            >
              ← Games
            </Link>

            <div className={styles.coinBalance}>
              <img
                src="/assets/icons/game-coin-icon.png"
                alt=""
                className={styles.coinIcon}
              />
              <span>{gameCoinBalance}</span>
              <span>Game Coins</span>
            </div>
          </header>
        )}

        <div
          className={styles.artworkBackdrop}
          style={{
            background: `
              radial-gradient(
                circle at 18% 15%,
                ${accentColor}40 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 82% 70%,
                ${accentColor}2a 0%,
                transparent 50%
              )
            `,
          }}
        />

        {game.slug === "wormzy" && !gameStarted && (
          <svg
            className={styles.snakeTrail}
            viewBox="0 0 400 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className={styles.snakeTrailPath}
              d="M -20 60 Q 100 20, 180 80 T 340 120 Q 420 160, 380 220 T 200 260"
            />
          </svg>
        )}

        {rewardToast !== null && (
          <div className={styles.rewardToast}>
            <img
              src="/assets/icons/game-coin-icon.png"
              alt=""
              className={styles.coinIcon}
            />
            +{rewardToast} Game Coins earned!
          </div>
        )}

        <main
          className={`${styles.content} ${
            gameStarted ? styles.gameModeContent : ""
          }`}
        >
          {!gameStarted && (
            <>
              {/* =========================
                  GAME ARTWORK
                  ========================= */}
              <section className={styles.gameHero}>
                <div
                  className={styles.artworkFrame}
                  style={{ "--accent": accentColor }}
                >
                  <div className={styles.artworkGlow} />

                  <img
                    src={game.image}
                    alt={game.name}
                    className={styles.artwork}
                  />

                  <div className={styles.artworkShine} />
                </div>

                <div className={styles.gameHeading}>
                  <span className={styles.gameLabel}>
                    {game.category || "VELOOP GAME"}
                  </span>

                  <h1
                    className={styles.title}
                    style={{ "--accent": accentColor }}
                  >
                    {game.name}
                  </h1>

                  <p className={styles.tagline}>{game.tagline}</p>

                  {game.description && (
                    <p className={styles.description}>
                      {game.description}
                    </p>
                  )}
                </div>
              </section>

              {/* =========================
                  ENTRY / PLAY
                  ========================= */}
              <section className={styles.gamePanel}>
                <div className={styles.entryInfo}>
                  <div className={styles.entryItem}>
                    <span className={styles.infoLabel}>ENTRY FEE</span>

                    <span className={styles.entryValue}>
                      <img
                        src="/assets/icons/token-icon.png"
                        alt=""
                        className={styles.inlineIcon}
                      />
                      {game.cost} {game.currency}
                    </span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.entryItem}>
                    <span className={styles.infoLabel}>YOUR BALANCE</span>

                    <span className={styles.balanceValue}>
                      {tokenBalance}
                      <span> Tokens</span>
                    </span>
                  </div>
                </div>

                {game.playable ? (
                  hasEnoughTokens(game.cost) ? (
                    <button
                      type="button"
                      className={styles.playNowBtn}
                      onClick={handlePlayNow}
                      disabled={isStarting}
                      style={{
                        "--accent": accentColor,
                      }}
                    >
                      <span className={styles.playButtonShine} />

                      <span className={styles.playIcon}>
                        {isStarting ? "⟳" : "▶"}
                      </span>

                      <span>
                        {isStarting ? "Starting..." : "Play Now"}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.playNowBtn} ${styles.insufficientBtn}`}
                      onClick={() => setShowInsufficientModal(true)}
                    >
                      <span className={styles.playIcon}>🎫</span>
                      Need {game.cost} Tokens
                    </button>
                  )
                ) : (
                  <div className={styles.comingSoon}>
                    <span>🎮</span>
                    <div>
                      <strong>Coming Soon</strong>
                      <p>This game is not playable yet.</p>
                    </div>
                  </div>
                )}
              </section>

              {/* =========================
                  HOW TO PLAY
                  ========================= */}
              {game.guide && (
                <section className={styles.infoSection}>
                  <button
                    type="button"
                    className={styles.infoSectionHeader}
                    onClick={() => setShowGuide(true)}
                  >
                    <span className={styles.infoSectionIcon}>?</span>

                    <span className={styles.infoSectionText}>
                      <strong>How to Play</strong>
                      <small>Learn the basics before you start</small>
                    </span>

                    <span className={styles.infoArrow}>→</span>
                  </button>
                </section>
              )}

              {/* =========================
                  REWARDS
                  ========================= */}
              <section className={styles.infoSection}>
                <div className={styles.rewardsContent}>
                  <div className={styles.rewardsIcon}>🏆</div>

                  <div className={styles.rewardsText}>
                    <strong>Rewards</strong>

                    <p>
                      Complete the game and earn Game Coins based on
                      your performance.
                    </p>
                  </div>

                  <img
                    src="/assets/icons/game-coin-icon.png"
                    alt=""
                    className={styles.rewardCoinIcon}
                  />
                </div>
              </section>
            </>
          )}

          {gameStarted && game.slug === "merge-master" && (
            <MergeMasterGame onGameEnd={handleGameEnd} />
          )}

          {gameStarted && game.slug === "wormzy" && (
            <WormzyGame
              onGameEnd={handleGameEnd}
              onExit={() => setGameStarted(false)}
              onGameOver={handleWormzyGameOver}
            />
          )}

          {gameStarted &&
            game.slug !== "merge-master" &&
            game.slug !== "wormzy" && (
              <div className={styles.gameStartedPlaceholder}>
                <p>
                  🎮 {game.name} gameplay coming in a later phase.
                </p>
              </div>
            )}
        </main>

        {showGuide && (
          <GameGuide
            guide={game.guide}
            onClose={handleGuideClose}
          />
        )}

        {showInsufficientModal && (
          <div className={styles.overlay}>
            <div className={styles.insufficientModal}>
              <p className={styles.insufficientTitle}>
                Not Enough Tokens
              </p>

              <p>
                You need {game.cost} Tokens to play.
                <br />
                Your Balance: {tokenBalance} Tokens
              </p>

              <button
                type="button"
                className={styles.earnMoreBtn}
                onClick={() => setShowInsufficientModal(false)}
              >
                Earn More Tokens
              </button>
            </div>
          </div>
        )}

        {!gameStarted && <BottomNav />}
      </div>
    </GameArtworkPreloader>
  );
}

export default GameHome;