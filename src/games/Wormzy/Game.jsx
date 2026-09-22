"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  COLS,
  ROWS,
  KEY_TO_DIRECTION,
  calculateScore,
  calculateStars,
  createLevelState,
  getCellKey,
  getCellType,
  getTotalLevels,
  moveWorm,
} from "./logic";

import styles from "./Game.module.css";

const COUNTDOWN_SECONDS = 3;

// Converts total accumulated score (across every completed level this
// session) into a Game Coin reward — same style of conversion as
// Merge Master, so both games' rewards feel comparable.
function calculateCoinReward(totalScore) {
  return Math.max(5, Math.round(totalScore / 15));
}

function WormzyGame({ onGameEnd, onExit, onGameOver }) {
  const gameRef = useRef(null);
  const touchStartRef = useRef(null);
  const totalScoreRef = useRef(0); // running total across all completed levels this session

  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState(() => createLevelState(0));

  const [phase, setPhase] = useState("idle"); // idle | counting | playing | complete | failed | finished
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [finalReward, setFinalReward] = useState(0);
  const [fallRetryUsed, setFallRetryUsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalLevels = getTotalLevels();

  const score = calculateScore(gameState, elapsedSeconds);
  const stars = calculateStars(gameState, elapsedSeconds);

  const enterFullscreen = useCallback(async () => {
    try {
      if (
        !document.fullscreenElement &&
        gameRef.current &&
        document.fullscreenEnabled
      ) {
        await gameRef.current.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen was not available:", error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Exiting fullscreen failed:", error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const startLevel = useCallback(
  (nextLevelIndex = levelIndex) => {
    setLevelIndex(nextLevelIndex);
    setGameState(createLevelState(nextLevelIndex));
    setElapsedSeconds(0);
    setCountdown(COUNTDOWN_SECONDS);
    setPhase("counting");
    setShowHowToPlay(false);
    setScreenShake(false);
  },
  [levelIndex],
);

  useEffect(() => {
    if (phase !== "counting") return undefined;
    const timer = setTimeout(
      () => {
        if (countdown === 0) setPhase("playing");
        else setCountdown((c) => c - 1);
      },
      countdown === 0 ? 700 : 1000,
    );
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = setInterval(() => setElapsedSeconds((c) => c + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const handleMove = useCallback(
    (direction) => {
      if (phase !== "playing" || gameState.completed || gameState.failed)
        return;

      const next = moveWorm(gameState, direction);
      setGameState(next);

      if (next.invalidMove) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 180);
      } else if (next.completed) {
        setPhase("complete");
      } else if (next.failed) {
        if (next.failReason === "fell") {
          if (!fallRetryUsed) {
            setFallRetryUsed(true);
            setPhase("failed"); // first fall — free retry, same as before
          } else {
            setPhase("gameover"); // second fall this session — real consequence
          }
        } else {
          setPhase("failed"); // spikes stay unlimited free retries
        }
      }
    },
    [phase, gameState, fallRetryUsed],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      handleMove(direction);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  const handleTouchStart = (event) => {
    const t = event.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (Math.max(adx, ady) < 25) {
      touchStartRef.current = null;
      return;
    }
    if (adx > ady) handleMove(dx > 0 ? "right" : "left");
    else handleMove(dy > 0 ? "down" : "up");
    touchStartRef.current = null;
  };

  // Retry the SAME level after a spike/fall failure — not sent back to level 1
  const handleRetryAfterFail = () => {
    startLevel(levelIndex);
  };

  const handleRestart = () => {
    startLevel(levelIndex);
  };

  const handleNextLevel = () => {
    const newTotal = totalScoreRef.current + score;
    totalScoreRef.current = newTotal;

    const nextLevel = levelIndex + 1;
    if (nextLevel >= totalLevels) {
      setFinalReward(calculateCoinReward(newTotal));
      setPhase("finished");
      return;
    }
    startLevel(nextLevel);
  };

  // Only called when the player explicitly collects their reward on the
  // final "all levels complete" screen — this is what actually pays out.
  const handleCollectReward = async () => {
    await exitFullscreen();
    if (onGameEnd) onGameEnd(finalReward);
  };

  // Bail out mid-game — no reward, tokens already spent stay spent
  // (same as walking away from any paid attempt).
  const handleExit = async () => {
    await exitFullscreen();
    if (onExit) onExit();
  };

  const handleGameOverRetry = async () => {
    await exitFullscreen();
    if (onGameOver) onGameOver(true);
  };

  const handleGameOverGoBack = async () => {
    await exitFullscreen();
    if (onGameOver) onGameOver(false);
  };

  const handleFullscreenToggle = async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  const renderCellContent = (cellType) => {
    switch (cellType) {
      case "wormHead":
        return <span className={styles.wormHead}>👀</span>;
      case "wormBody":
        return <span className={styles.wormBody} />;
      case "apple":
        return <span className={styles.apple}>🍎</span>;
      case "hole":
        return <span className={styles.hole}>🕳️</span>;
      case "stone":
      case "stoneOnTarget":
        return <span className={styles.stone} aria-hidden="true" />;
      case "spike":
        return <span className={styles.spikeIcon}>⚠️</span>;
      default:
        return null;
    }
  };

  const renderBoard = () => {
    const cells = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cellType = getCellType(gameState, row, col);
        const cellKey = getCellKey(row, col);
        const isSolved = cellType === "stoneOnTarget";
        cells.push(
          <div
            key={cellKey}
            className={`${styles.cell} ${styles[`cell${cellType}`] || ""} ${
              isSolved ? styles.cellSolved : ""
            }`}
          >
            {renderCellContent(cellType)}
          </div>,
        );
      }
    }
    return cells;
  };

  return (
    <main
      ref={gameRef}
      className={`${styles.gameContainer} ${screenShake ? styles.screenShake : ""}`}
    >
      <div className={styles.backgroundDecor}>
        <span className={`${styles.cloud} ${styles.cloudOne}`}>☁️</span>
        <span className={`${styles.cloud} ${styles.cloudTwo}`}>☁️</span>
        <span className={`${styles.tree} ${styles.treeOne}`}>🌲</span>
        <span className={`${styles.tree} ${styles.treeTwo}`}>🌳</span>
        <span className={`${styles.tree} ${styles.treeThree}`}>🌲</span>
      </div>

      <section className={styles.game}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PUZZLE ADVENTURE</p>
            <h1 className={styles.title}>Wormzy</h1>
            <p className={styles.subtitle}>Eat. Push. Escape.</p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.fullscreenButton}
              onClick={handleFullscreenToggle}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? "⛶" : "⛶"}
            </button>

            <button
              type="button"
              className={styles.exitButton}
              onClick={handleExit}
              aria-label="Exit game"
              title="Exit game"
            >
              ✕
            </button>
          </div>

          <div className={styles.levelBadge}>
            <span>LEVEL</span>
            <strong>
              {levelIndex + 1}/{totalLevels}
            </strong>
          </div>
        </header>

        <section className={styles.stats}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>MOVES</span>
            <strong>{gameState.moves}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>TIME</span>
            <strong>{elapsedSeconds}s</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>STARS</span>
            <strong>{stars > 0 ? "★".repeat(stars) : "—"}</strong>
          </div>
        </section>

        <section className={styles.levelInfo}>
          <div>
            <p className={styles.levelTitle}>{gameState.levelName}</p>
            <p className={styles.levelDescription}>{gameState.description}</p>
          </div>
          <div className={styles.objective}>
            <span>🍎🍎</span>
            <span>→</span>
            <span>🕳️</span>
          </div>
        </section>

        <section className={styles.boardSection}>
          <div
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {renderBoard()}

            {phase !== "playing" && (
              <div className={styles.overlay}>
                {phase === "idle" && (
                  <div className={styles.startPanel}>
                    <div className={styles.logoWorm}>🐛</div>
                    <h2>Welcome to Wormzy</h2>
                    <p>
                      Eat both apples, avoid spikes, mind the gaps, and reach
                      the hole.
                    </p>
                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => startLevel(levelIndex)}
                      >
                        <span>▶</span>Play
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setShowHowToPlay(true)}
                      >
                        How to Play
                      </button>
                    </div>
                  </div>
                )}

                {phase === "counting" && (
                  <div className={styles.countdown}>
                    {countdown === 0 ? "GO!" : countdown}
                  </div>
                )}

                {phase === "failed" && (
                  <div className={styles.completePanel}>
                    <div className={styles.completeIcon}>
                      {gameState.failReason === "spike" ? "💥" : "🕳️"}
                    </div>
                    <h2>
                      {gameState.failReason === "spike"
                        ? "Ouch! Spike Hit"
                        : "You Fell!"}
                    </h2>
                    <p>
                      {gameState.failReason === "spike"
                        ? "Watch out for the spikes next time."
                        : "You fell into the void. Try a different path."}
                    </p>
                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleRetryAfterFail}
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleExit}
                      >
                        Exit
                      </button>
                    </div>
                  </div>
                )}

                {phase === "gameover" && (
                  <div className={styles.completePanel}>
                    <div className={styles.completeIcon}>💀</div>
                    <h2>Game Over</h2>
                    <p>
                      You've used your retry and fallen again. Try again with a
                      fresh entry?
                    </p>
                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleGameOverRetry}
                      >
                        Try Again (20 Tokens)
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleGameOverGoBack}
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                )}

                {phase === "complete" && (
                  <div className={styles.completePanel}>
                    <div className={styles.completeIcon}>🎉</div>
                    <h2>Level Complete!</h2>
                    <div className={styles.resultStars}>
                      {"★".repeat(stars)}
                      <span>{"★".repeat(3 - stars)}</span>
                    </div>
                    <p className={styles.resultScore}>
                      Score: <strong>{score}</strong>
                    </p>
                    <p className={styles.resultDetails}>
                      Completed in {gameState.moves} moves and {elapsedSeconds}{" "}
                      seconds.
                    </p>
                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleNextLevel}
                      >
                        {levelIndex + 1 >= totalLevels
                          ? "Finish Game"
                          : "Next Level"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleRestart}
                      >
                        Replay
                      </button>
                    </div>
                  </div>
                )}

                {phase === "finished" && (
                  <div className={styles.completePanel}>
                    <div className={styles.completeIcon}>🏆</div>
                    <h2>All Levels Complete!</h2>
                    <p>
                      You completed the entire Wormzy adventure and earned{" "}
                      <strong>{finalReward} Game Coins</strong>
                    </p>
                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleCollectReward}
                      >
                        Collect Reward
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showHowToPlay && (
              <div className={styles.overlay}>
                <div className={styles.instructionsPanel}>
                  <h2>How to Play</h2>
                  <div className={styles.instructionItem}>
                    <span>🐛</span>
                    <p>Move Wormzy using arrow keys or swipe.</p>
                  </div>
                  <div className={styles.instructionItem}>
                    <span>🍎</span>
                    <p>Eat both apples on the level.</p>
                  </div>
                  <div className={styles.instructionItem}>
                    <span>🪨</span>
                    <p>Push stones onto glowing targets to bridge gaps.</p>
                  </div>
                  <div className={styles.instructionItem}>
                    <span>⚠️</span>
                    <p>Avoid spikes — one touch ends the attempt.</p>
                  </div>
                  <div className={styles.instructionItem}>
                    <span>🕳️</span>
                    <p>
                      Falling off a platform with nothing below restarts the
                      level.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => {
                      setShowHowToPlay(false);
                      startLevel(levelIndex);
                    }}
                  >
                    Start Game
                  </button>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setShowHowToPlay(false)}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.mobileControls}>
          <button
            type="button"
            aria-label="Move up"
            onClick={() => handleMove("up")}
          >
            ▲
          </button>
          <div className={styles.horizontalControls}>
            <button
              type="button"
              aria-label="Move left"
              onClick={() => handleMove("left")}
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Move down"
              onClick={() => handleMove("down")}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Move right"
              onClick={() => handleMove("right")}
            >
              ▶
            </button>
          </div>
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.footerButton}
            onClick={handleRestart}
          >
            ↻ Restart
          </button>
          <p>Use arrow keys, swipe, or the controls</p>
          <button
            type="button"
            className={styles.footerButton}
            onClick={() => setShowHowToPlay(true)}
          >
            ? Help
          </button>
        </footer>
      </section>
    </main>
  );
}

export default WormzyGame;
