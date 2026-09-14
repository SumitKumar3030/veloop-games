"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

function WormzyGame({ onGameEnd }) {
  const gameRef = useRef(null);
  const touchStartRef = useRef(null);

  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState(() =>
    createLevelState(0),
  );

  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

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

  const startLevel = useCallback(
    async (nextLevelIndex = levelIndex) => {
      await enterFullscreen();

      setLevelIndex(nextLevelIndex);
      setGameState(createLevelState(nextLevelIndex));
      setElapsedSeconds(0);
      setCountdown(COUNTDOWN_SECONDS);
      setPhase("counting");
      setShowHowToPlay(false);
      setScreenShake(false);
    },
    [enterFullscreen, levelIndex],
  );

  useEffect(() => {
    if (phase !== "counting") {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (countdown === 0) {
        setPhase("playing");
      } else {
        setCountdown((current) => current - 1);
      }
    }, countdown === 0 ? 700 : 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing") {
      return undefined;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!gameState.completed) {
      return;
    }

    setPhase("complete");
  }, [gameState.completed]);

  const handleMove = useCallback(
    (direction) => {
      if (phase !== "playing" || gameState.completed) {
        return;
      }

      setGameState((currentState) => {
        const nextState = moveWorm(currentState, direction);

        if (nextState.invalidMove) {
          setScreenShake(true);

          setTimeout(() => {
            setScreenShake(false);
          }, 180);
        }

        return nextState;
      });
    },
    [phase, gameState.completed],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEY_TO_DIRECTION[event.key];

      if (!direction) {
        return;
      }

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMove]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);
    const swipeThreshold = 25;

    if (
      Math.max(absoluteX, absoluteY) < swipeThreshold
    ) {
      touchStartRef.current = null;
      return;
    }

    if (absoluteX > absoluteY) {
      handleMove(deltaX > 0 ? "right" : "left");
    } else {
      handleMove(deltaY > 0 ? "down" : "up");
    }

    touchStartRef.current = null;
  };

  const handleRestart = () => {
    startLevel(levelIndex);
  };

  const handleNextLevel = () => {
    const nextLevel = levelIndex + 1;

    if (nextLevel >= totalLevels) {
      if (onGameEnd) {
        onGameEnd({
          score,
          stars,
          level: levelIndex + 1,
        });
      }

      setPhase("finished");
      return;
    }

    startLevel(nextLevel);
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

      case "block":
        return <span className={styles.stone}>🪨</span>;

      case "blockOnTarget":
        return <span className={styles.stone}>🪨</span>;

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

        const isBlockOnTarget = cellType === "blockOnTarget";

        cells.push(
          <div
            key={cellKey}
            className={`${styles.cell} ${
              styles[`cell${cellType}`] || ""
            } ${isBlockOnTarget ? styles.cellSolved : ""}`}
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
      className={`${styles.gameContainer} ${
        screenShake ? styles.screenShake : ""
      }`}
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
            <p className={styles.subtitle}>
              Eat. Push. Escape.
            </p>
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
            <strong>
              {stars > 0 ? "★".repeat(stars) : "—"}
            </strong>
          </div>
        </section>

        <section className={styles.levelInfo}>
          <div>
            <p className={styles.levelTitle}>
              {gameState.levelName}
            </p>
            <p className={styles.levelDescription}>
              {gameState.description}
            </p>
          </div>

          <div className={styles.objective}>
            <span>🍎</span>
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
                      Guide the worm, collect the apple,
                      solve the stone puzzle, and reach the hole.
                    </p>

                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => startLevel(levelIndex)}
                      >
                        <span>▶</span>
                        Play
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
                      Completed in {gameState.moves} moves
                      and {elapsedSeconds} seconds.
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
                      You completed the entire Wormzy adventure.
                    </p>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => startLevel(0)}
                    >
                      Play Again
                    </button>
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
                    <p>Eat the apple to make Wormzy longer.</p>
                  </div>

                  <div className={styles.instructionItem}>
                    <span>🪨</span>
                    <p>Push stones onto the glowing target areas.</p>
                  </div>

                  <div className={styles.instructionItem}>
                    <span>🕳️</span>
                    <p>After solving the puzzle, reach the hole.</p>
                  </div>

                  <div className={styles.instructionItem}>
                    <span>⭐</span>
                    <p>Fewer moves and less time give more stars.</p>
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