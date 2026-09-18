import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import gamesData from "../data/gamesData";
import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";
import GameGuide from "../components/games/GameGuide";
import MergeMasterGame from "../games/MergeMaster/Game";
import styles from "./GameHome.module.css";
import WormzyGame from "../games/Wormzy/Game";
import BottomNav from "../components/common/BottomNav";
import GameArtworkPreloader from "../components/common/GameArtworkPreloader";
import { useDominantColor } from "../hooks/useDominantColor";

function GameHome() {
  const { slug } = useParams();

  // All hooks live at the top, unconditionally — before any early return
  const { gameCoinBalance, addGameCoins } = useGameCoins();
  const { tokenBalance, hasEnoughTokens, deductTokens } = useTokens();

  const [showGuide, setShowGuide] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const game = gamesData.find((g) => g.slug === slug);

  const accentColor = useDominantColor(game?.image);

  // Early return is now safe — every hook above already ran
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
    setTimeout(() => setRewardToast(null), 3500);
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
      <div className={`${styles.page} ${themeClass}`}>
        <header className={styles.header}>
          <Link to="/" className={styles.backLink} aria-label="Back to Games">
            ← Back
          </Link>
          <div className={styles.coinBalance}>
            <img
              src="/assets/icons/game-coin-icon.png"
              alt=""
              className={styles.coinIcon}
            />
            {gameCoinBalance} Game Coins
          </div>
        </header>

        <div
          className={styles.artworkBackdrop}
          style={{
            background: `
              radial-gradient(circle at 18% 15%, ${accentColor}40 0%, transparent 45%),
              radial-gradient(circle at 82% 70%, ${accentColor}2a 0%, transparent 50%)
            `,
          }}
        />

        {game.slug === "wormzy" && (
          <svg
            className={styles.snakeTrail}
            viewBox="0 0 400 320"
            preserveAspectRatio="none"
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

        <main className={styles.content}>
          <img src={game.image} alt={game.name} className={styles.artwork} />
          <h1 className={styles.title} style={{ color: accentColor }}>
            {game.name}
          </h1>
          <p className={styles.tagline}>{game.tagline}</p>

          {!gameStarted && (
            <>
              <p className={styles.entry}>
                Entry:{" "}
                <img
                  src="/assets/icons/token-icon.png"
                  alt=""
                  className={styles.inlineIcon}
                />{" "}
                {game.cost} {game.currency}
              </p>
              <p className={styles.tokenBalanceLine}>
                Your Balance: {tokenBalance} Tokens
              </p>

              {game.playable ? (
                hasEnoughTokens(game.cost) ? (
                  <button
                    type="button"
                    className={styles.playNowBtn}
                    onClick={handlePlayNow}
                    disabled={isStarting}
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                    }}
                  >
                    {isStarting ? "⟳ Starting..." : "▶ Play Now"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.playNowBtn} ${styles.insufficientBtn}`}
                    onClick={() => setShowInsufficientModal(true)}
                  >
                    🎫 Need {game.cost} Tokens
                  </button>
                )
              ) : (
                <p className={styles.status}>
                  🚧 This game is banner-only for this version
                </p>
              )}

              {game.guide && (
                <button
                  type="button"
                  className={styles.howToPlayLink}
                  onClick={() => setShowGuide(true)}
                >
                  How to Play
                </button>
              )}
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
                <p>🎮 {game.name} gameplay coming in a later phase.</p>
              </div>
            )}
        </main>

        {showGuide && (
          <GameGuide guide={game.guide} onClose={handleGuideClose} />
        )}

        {showInsufficientModal && (
          <div className={styles.overlay}>
            <div className={styles.insufficientModal}>
              <p className={styles.insufficientTitle}>Not Enough Tokens</p>
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
        <BottomNav />
      </div>
    </GameArtworkPreloader>
  );
}

export default GameHome;
