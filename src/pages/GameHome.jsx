import { useEffect, useState } from "react";
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

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (gameStarted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [gameStarted]);

  if (!game) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundGlow} />

        <div className={styles.notFoundContent}>
          <span className={styles.notFoundLabel}>VELOOP GAMES</span>
          <h1>Game not found</h1>
          <p>The game you are looking for is unavailable.</p>

          <Link to="/" className={styles.notFoundButton}>
            ← Back to Games
          </Link>
        </div>
      </div>
    );
  }

  const guideSeenKey = `veloop-guide-seen-${game.slug}`;

  const handlePlayNow = () => {
    if (isStarting) return;

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
      setTimeout(() => {
        handlePlayNow();
      }, 50);
    }
  };

  const themeClass =
    game.theme?.key === "merge-master"
      ? styles.themeMergeMaster
      : game.theme?.key === "wormzy"
        ? styles.themeWormzy
        : "";

  const isMergeMaster = game.slug === "merge-master";
  const isWormzy = game.slug === "wormzy";

  const gameCategory =
    game.category || (isMergeMaster ? "ARCADE PUZZLE" : "ADVENTURE PUZZLE");

  const gameObjective = isMergeMaster
    ? "Merge numbers, build combos and chase your highest score."
    : isWormzy
      ? "Solve levels, collect apples and guide Wormzy to the exit."
      : game.description || "Play the game and earn rewards.";

  const intelItems = isMergeMaster
    ? [
        {
          value: "20",
          label: "ENTRY TOKENS",
          icon: "◈",
        },
        {
          value: "2048",
          label: "TARGET TILE",
          icon: "◆",
        },
        {
          value: "BOMB",
          label: "POWER MOVE",
          icon: "✦",
        },
        {
          value: "1×",
          label: "REVIVE",
          icon: "↻",
        },
      ]
    : isWormzy
      ? [
          {
            value: "15",
            label: "LEVELS",
            icon: "◎",
          },
          {
            value: "2",
            label: "APPLES / LEVEL",
            icon: "●",
          },
          {
            value: "3★",
            label: "MAX STARS",
            icon: "★",
          },
          {
            value: "20",
            label: "ENTRY TOKENS",
            icon: "◈",
          },
        ]
      : [
          {
            value: String(game.cost),
            label: "ENTRY TOKENS",
            icon: "◈",
          },
          {
            value: "PLAY",
            label: "GAME MODE",
            icon: "▶",
          },
          {
            value: "EARN",
            label: "REWARDS",
            icon: "✦",
          },
          {
            value: "20",
            label: "TOKEN COST",
            icon: "◈",
          },
        ];

  return (
    <GameArtworkPreloader key={game.slug} game={game}>
      <div
        className={`${styles.page} ${themeClass} ${
          gameStarted ? styles.gameRunning : ""
        }`}
        style={{ "--game-accent": accentColor }}
      >
        <div className={styles.ambientGlow} />
        <div className={styles.ambientGlowSecondary} />

        <div className={styles.particleField} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        {!gameStarted && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <Link to="/" className={styles.brandLink}>
                <span className={styles.brandMark}>V</span>
                <span className={styles.brandName}>VELOOP</span>
              </Link>

              <span className={styles.headerDivider} />

              <Link
                to="/"
                className={styles.backLink}
                aria-label="Back to Games"
              >
                <span className={styles.backIcon}>←</span>
                <span>Games</span>
              </Link>
            </div>

            <div className={styles.coinBalance}>
              <div className={styles.coinBalanceIcon}>
                <img src="/assets/icons/game-coin-icon.png" alt="" />
              </div>

              <div className={styles.coinBalanceText}>
                <span className={styles.coinBalanceLabel}>GAME COINS</span>
                <strong>{gameCoinBalance}</strong>
              </div>
            </div>
          </header>
        )}

        <div
          className={styles.artworkBackdrop}
          style={{
            background: `
              radial-gradient(
                circle at 20% 20%,
                ${accentColor}38 0%,
                transparent 42%
              ),
              radial-gradient(
                circle at 82% 68%,
                ${accentColor}26 0%,
                transparent 48%
              )
            `,
          }}
        />

        {isWormzy && !gameStarted && (
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
          <div className={styles.rewardToast} role="status">
            <img
              src="/assets/icons/game-coin-icon.png"
              alt=""
              className={styles.rewardToastIcon}
            />
            <div>
              <span>REWARD UNLOCKED</span>
              <strong>+{rewardToast} Game Coins</strong>
            </div>
          </div>
        )}

        <main
          className={`${styles.content} ${
            gameStarted ? styles.gameModeContent : ""
          }`}
        >
          {!gameStarted && (
            <>
              <section className={styles.hero}>
                <div className={styles.heroCopy}>
                  <div className={styles.heroEyebrow}>
                    <span>{gameCategory}</span>
                    <i />
                    <span>VELOOP ORIGINAL</span>
                  </div>

                  <p className={styles.preTitle}>READY WHEN YOU ARE</p>

                  <h1
                    className={styles.title}
                    style={{ "--title-accent": accentColor }}
                  >
                    {game.name}
                  </h1>

                  <p className={styles.tagline}>{game.tagline}</p>

                  <p className={styles.heroDescription}>{gameObjective}</p>

                  <div className={styles.heroActions}>
                    <button
                      type="button"
                      className={styles.primaryPlayButton}
                      onClick={handlePlayNow}
                      disabled={isStarting || !game.playable}
                      style={{ "--button-accent": accentColor }}
                    >
                      <span className={styles.primaryPlayGlow} />
                      <span className={styles.primaryPlayIcon}>
                        {isStarting ? "⟳" : "▶"}
                      </span>
                      <span>
                        {isStarting
                          ? "Starting..."
                          : game.playable
                            ? "Play Now"
                            : "Coming Soon"}
                      </span>
                      {game.playable && <small>{game.cost} Tokens</small>}
                    </button>

                    {game.guide && (
                      <button
                        type="button"
                        className={styles.guideButton}
                        onClick={() => setShowGuide(true)}
                      >
                        <span>?</span>
                        How to Play
                      </button>
                    )}
                  </div>

                  <div className={styles.entryNotice}>
                    <img src="/assets/icons/token-icon.png" alt="" />
                    <span>
                      {game.playable
                        ? `${game.cost} Tokens will be deducted when you start.`
                        : "Gameplay will be available soon."}
                    </span>
                  </div>
                </div>

                <div className={styles.heroVisual}>
                  <div
                    className={styles.artworkFrame}
                    style={{ "--accent": accentColor }}
                  >
                    <div className={styles.artworkGlow} />

                    <div className={styles.artworkRing}>
                      <span />
                    </div>

                    <img
                      src={game.image}
                      alt={game.name}
                      className={styles.artwork}
                    />

                    <div className={styles.artworkShine} />

                    <div className={styles.artworkBadge}>
                      <span>20</span>
                      <small>TOKENS</small>
                    </div>
                  </div>

                  <div className={styles.visualCaption}>
                    <span className={styles.visualLine} />
                    <span>PLAY • EARN • REDEEM</span>
                    <span className={styles.visualLine} />
                  </div>
                </div>
              </section>

              <section className={styles.introSection}>
                <div>
                  <span className={styles.sectionEyebrow}>THE CHALLENGE</span>
                  <h2>
                    Are you ready to play <strong>{game.name}</strong>?
                  </h2>
                </div>

                <p>
                  Step into the game, prove your skills and turn your
                  performance into Game Coins.
                </p>
              </section>

              <section className={styles.playPanel}>
                <div className={styles.playPanelMain}>
                  <div className={styles.playPanelLabel}>
                    <span className={styles.liveDot} />
                    READY TO PLAY
                  </div>

                  <h2>
                    Your next reward
                    <br />
                    starts here.
                  </h2>

                  <p>
                    Use your Tokens to enter. Finish the game and earn Game
                    Coins based on your performance.
                  </p>
                </div>

                <div className={styles.playStats}>
                  <div className={styles.playStat}>
                    <span>ENTRY</span>
                    <strong>
                      <img src="/assets/icons/token-icon.png" alt="" />
                      {game.cost}
                    </strong>
                    <small>Tokens</small>
                  </div>

                  <div className={styles.playStatDivider} />

                  <div className={styles.playStat}>
                    <span>YOUR BALANCE</span>
                    <strong>{tokenBalance}</strong>
                    <small>Tokens</small>
                  </div>

                  <div className={styles.playStatDivider} />

                  <div className={styles.playStat}>
                    <span>GAME COINS</span>
                    <strong className={styles.gameCoinValue}>
                      <img src="/assets/icons/game-coin-icon.png" alt="" />
                      {gameCoinBalance}
                    </strong>
                    <small>Current balance</small>
                  </div>
                </div>

                {game.playable ? (
                  <button
                    type="button"
                    className={styles.panelPlayButton}
                    onClick={handlePlayNow}
                    disabled={isStarting}
                  >
                    <span>
                      {isStarting ? "Starting Game..." : "Start Playing"}
                    </span>
                    <b>→</b>
                  </button>
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

              <section className={styles.intelSection}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionEyebrow}>GAME INTEL</span>
                  <h2>Know the mission.</h2>
                </div>

                <div className={styles.intelGrid}>
                  {intelItems.map((item) => (
                    <div className={styles.intelCard} key={item.label}>
                      <span className={styles.intelIcon}>{item.icon}</span>
                      <strong>{item.value}</strong>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.howSection}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionEyebrow}>HOW TO PLAY</span>
                  <h2>Simple to start. Hard to master.</h2>
                </div>

                <div className={styles.stepsGrid}>
                  {(isMergeMaster
                    ? [
                        ["01", "MOVE", "Swipe or use arrow keys."],
                        ["02", "MERGE", "Match identical numbers."],
                        ["03", "COMBO", "Build bigger tiles."],
                        ["04", "SCORE", "Chase your best run."],
                      ]
                    : isWormzy
                      ? [
                          ["01", "MOVE", "Guide Wormzy across the map."],
                          ["02", "EAT", "Collect the apples."],
                          ["03", "PUSH", "Solve the stone puzzles."],
                          ["04", "ESCAPE", "Reach the final hole."],
                        ]
                      : [
                          ["01", "PLAY", "Enter the game."],
                          ["02", "COMPETE", "Complete the challenge."],
                          ["03", "SCORE", "Perform your best."],
                          ["04", "EARN", "Collect Game Coins."],
                        ]
                  ).map(([number, label, text], index) => (
                    <div className={styles.stepCard} key={label}>
                      <span className={styles.stepNumber}>{number}</span>

                      <div className={styles.stepIcon}>
                        {index === 0
                          ? "→"
                          : index === 1
                            ? "◆"
                            : index === 2
                              ? "✦"
                              : "★"}
                      </div>

                      <h3>{label}</h3>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.rewardSection}>
                <div className={styles.rewardVisual}>
                  <div className={styles.rewardCoinGlow} />

                  <img
                    src="/assets/icons/game-coin-icon.png"
                    alt="Game Coin"
                    className={styles.rewardCoin}
                  />

                  <span
                    className={`${styles.rewardOrbit} ${styles.rewardOrbitOne}`}
                  />
                  <span
                    className={`${styles.rewardOrbit} ${styles.rewardOrbitTwo}`}
                  />
                </div>

                <div className={styles.rewardCopy}>
                  <span className={styles.sectionEyebrow}>THE PAYOFF</span>

                  <h2>
                    Play well.
                    <br />
                    <strong>Earn more.</strong>
                  </h2>

                  <p>
                    Complete the challenge and your performance is converted
                    into Game Coins. Keep playing, keep improving and build your
                    reward balance.
                  </p>

                  <div className={styles.rewardFlow}>
                    <span>PLAY</span>
                    <b>→</b>
                    <span>SCORE</span>
                    <b>→</b>
                    <span>EARN</span>
                    <b>→</b>
                    <span>REDEEM</span>
                  </div>
                </div>
              </section>

              <section className={styles.finalCta}>
                <span className={styles.finalCtaGlow} />

                <span className={styles.sectionEyebrow}>YOUR MOVE</span>

                <h2>
                  Ready to make
                  <br />
                  your score count?
                </h2>

                <p>Your next Game Coin is one game away.</p>

                <button
                  type="button"
                  className={styles.finalPlayButton}
                  onClick={handlePlayNow}
                  disabled={isStarting || !game.playable}
                >
                  {isStarting
                    ? "Starting..."
                    : game.playable
                      ? "Play Now →"
                      : "Coming Soon"}
                </button>
              </section>

              <footer className={styles.gameFooter}>
                <div className={styles.footerBrand}>
                  <span className={styles.footerMark}>V</span>
                  <div>
                    <strong>VELOOP</strong>
                    <span>Games & Rewards</span>
                  </div>
                </div>

                <div className={styles.footerFlow}>
                  <span>PLAY</span>
                  <i>•</i>
                  <span>EARN</span>
                  <i>•</i>
                  <span>REDEEM</span>
                </div>

                <p>Play games. Earn Game Coins. Redeem rewards.</p>
              </footer>
            </>
          )}

          {gameStarted && isMergeMaster && (
            <MergeMasterGame onGameEnd={handleGameEnd} />
          )}

          {gameStarted && isWormzy && (
            <WormzyGame
              onGameEnd={handleGameEnd}
              onExit={() => setGameStarted(false)}
              onGameOver={handleWormzyGameOver}
            />
          )}

          {gameStarted && !isMergeMaster && !isWormzy && (
            <div className={styles.gameStartedPlaceholder}>
              <p>🎮 {game.name} gameplay coming in a later phase.</p>
            </div>
          )}
        </main>

        {showGuide && (
          <GameGuide guide={game.guide} onClose={handleGuideClose} />
        )}

        {showInsufficientModal && (
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="insufficient-title"
          >
            <div className={styles.insufficientModal}>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowInsufficientModal(false)}
                aria-label="Close"
              >
                ×
              </button>

              <span className={styles.modalIcon}>◈</span>

              <span className={styles.modalEyebrow}>ENTRY REQUIREMENT</span>

              <h2 id="insufficient-title">Not Enough Tokens</h2>

              <p>
                You need <strong>{game.cost} Tokens</strong> to play this game.
              </p>

              <div className={styles.modalBalance}>
                <span>Your Balance</span>
                <strong>{tokenBalance} Tokens</strong>
              </div>

              <button
                type="button"
                className={styles.earnMoreBtn}
                onClick={() => setShowInsufficientModal(false)}
              >
                Close & Return
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
