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

import {
  initSound,
  setMuted,
  playEat,
  playPush,
  playInvalid,
  playSpikeHit,
  playFall,
  playLevelComplete,
  playAllComplete,
  startAmbience,
  stopAmbience,
} from "./sound";

import styles from "./Game.module.css";

const COUNTDOWN_SECONDS = 3;

function calculateCoinReward(totalScore) {
  return Math.max(5, Math.round(totalScore / 15));
}

function WormzyGame({ onGameEnd, onExit, onGameOver }) {
  const gameRef = useRef(null);
  const touchStartRef = useRef(null);
  const totalScoreRef = useRef(0);

  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState(() => createLevelState(0));

  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [finalReward, setFinalReward] = useState(0);

  const [fallRetryUsed, setFallRetryUsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMutedState] = useState(false);

  const totalLevels = getTotalLevels();

  const score = calculateScore(gameState, elapsedSeconds);
  const stars = calculateStars(gameState, elapsedSeconds);

  const currentLevelNumber = levelIndex + 1;
  const levelProgress = (currentLevelNumber / totalLevels) * 100;

  const appleCount = gameState.applesEaten;
  const applesTotal = 2;

  const currentScore = gameState.completed
    ? score
    : Math.max(0, Math.round(elapsedSeconds * 0));

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}`;
  };

  const requestFullscreen = useCallback(async () => {
    const element = gameRef.current;

    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Fullscreen is optional and can be blocked by the browser.
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
      initSound();
      startAmbience();

      setLevelIndex(nextLevelIndex);
      setGameState(createLevelState(nextLevelIndex));
      setElapsedSeconds(0);
      setCountdown(COUNTDOWN_SECONDS);
      setPhase("counting");
      setShowHowToPlay(false);
      setScreenShake(false);
      setFallRetryUsed(false);
    },
    [levelIndex],
  );

  useEffect(() => {
    return () => {
      stopAmbience();
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;

    setMutedState(nextMuted);
    setMuted(nextMuted);
  };

  useEffect(() => {
    if (phase !== "counting") return;

    if (countdown <= 0) {
      const timer = window.setTimeout(() => {
        setPhase("playing");
      }, 700);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  const triggerShake = useCallback((duration = 180) => {
    setScreenShake(true);

    window.setTimeout(() => {
      setScreenShake(false);
    }, duration);
  }, []);

  const handleMove = useCallback(
    (direction) => {
      if (phase !== "playing" || gameState.completed || gameState.failed) {
        return;
      }

      const previousState = gameState;
      const nextState = moveWorm(previousState, direction);

      if (nextState === previousState) return;

      if (nextState.invalidMove) {
        playInvalid();
        triggerShake(150);
        setGameState(nextState);
        return;
      }

      const ateApple = nextState.applesEaten > previousState.applesEaten;

      const stoneMoved =
        JSON.stringify(nextState.stones) !==
        JSON.stringify(previousState.stones);

      setGameState(nextState);

      if (nextState.failed) {
        if (nextState.failReason === "spike") {
          playSpikeHit();
          triggerShake(220);
        } else if (nextState.failReason === "fell") {
          playFall();
          triggerShake(260);
        }

        if (nextState.failReason === "fell" && !fallRetryUsed) {
          setFallRetryUsed(true);
          setPhase("failed");
        } else {
          setPhase("gameover");
        }

        return;
      }

      if (nextState.completed) {
        playLevelComplete();
        setPhase("complete");
        return;
      }

      if (stoneMoved) {
        playPush();
      }

      if (ateApple) {
        playEat();
      }
    },
    [fallRetryUsed, gameState, phase, triggerShake],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEY_TO_DIRECTION[event.key];

      if (!direction) return;

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMove]);

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];

    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches?.[0];

    if (!touch) {
      touchStartRef.current = null;
      return;
    }

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    touchStartRef.current = null;

    const distance = Math.max(Math.abs(dx), Math.abs(dy));

    if (distance < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };

  const handleRetry = () => {
    startLevel(levelIndex);
  };

  const handleRestart = () => {
    startLevel(levelIndex);
  };

  const handleNextLevel = () => {
    totalScoreRef.current += score;

    if (levelIndex >= totalLevels - 1) {
      const totalScore = totalScoreRef.current;
      const reward = calculateCoinReward(totalScore);

      playAllComplete();

      setFinalReward(reward);
      setPhase("finished");
      return;
    }

    startLevel(levelIndex + 1);
  };

  const handleCollectReward = () => {
    stopAmbience();

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    onGameEnd?.(finalReward);
  };

  const handleExit = () => {
    stopAmbience();

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    onExit?.();
  };

  const handleGameOverRetry = () => {
    stopAmbience();

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    onGameOver?.(true);
  };

  const handleGameOverExit = () => {
    stopAmbience();

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    onGameOver?.(false);
  };

  const renderCellContent = (cellType) => {
    switch (cellType) {
      case "wormHead":
        return (
          <span className={styles.wormHead}>
            <span className={`${styles.wormEye} ${styles.wormEyeLeft}`} />
            <span className={`${styles.wormEye} ${styles.wormEyeRight}`} />
            <span className={styles.wormMouth} />
          </span>
        );

      case "wormBody":
        return <span className={styles.wormBody} />;

      case "apple":
        return (
          <span className={styles.apple}>
            <span className={styles.appleLeaf} />
          </span>
        );

      case "hole":
        return (
          <span className={styles.hole}>
            <span className={styles.holeCore} />
            <span className={styles.holeRing} />
          </span>
        );

      case "stone":
        return <span className={styles.stone} />;

      case "stoneOnTarget":
        return (
          <span className={styles.stoneTargetWrap}>
            <span className={styles.targetGlow} />
            <span className={styles.stone} />
          </span>
        );

      case "spike":
        return (
          <span className={styles.spike}>
            <span />
            <span />
            <span />
          </span>
        );

      case "target":
        return (
          <span className={styles.target}>
            <span className={styles.targetInner} />
          </span>
        );

      default:
        return null;
    }
  };

  const renderBoard = () => {
    const cells = [];

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cellType = getCellType(gameState, row, col);
        const key = getCellKey(row, col);

        cells.push(
          <div
            key={key}
            className={`${styles.cell} ${
              styles[cellType] || ""
            } ${cellType === "platform" ? styles.platformCell : ""}`}
          >
            <span className={styles.cellShine} />
            {renderCellContent(cellType)}
          </div>,
        );
      }
    }

    return cells;
  };

  const objectiveProgress = Math.min(100, (appleCount / applesTotal) * 100);

  return (
    <main
      ref={gameRef}
      className={`${styles.gameContainer} ${
        screenShake ? styles.screenShake : ""
      }`}
    >
      <div className={`${styles.ambientOrb} ${styles.orbOne}`} />
      <div className={`${styles.ambientOrb} ${styles.orbTwo}`} />
      <div className={`${styles.ambientOrb} ${styles.orbThree}`} />

      <section className={styles.game}>
        {/* =========================================================
            TOP NAV
        ========================================================= */}
        <header className={styles.gameNav}>
          <button
            type="button"
            className={styles.navBack}
            onClick={handleExit}
            aria-label="Back to games"
          >
            <span className={styles.navBackIcon}>←</span>
            <span>Games</span>
          </button>

          <div className={styles.navBrand}>
            <span className={styles.navBrandMark}>V</span>
            <span>VELOOP</span>
            <small>GAMES</small>
          </div>

          <div className={styles.navActions}>
            <div className={styles.navLevel}>
              <span>LEVEL</span>
              <strong>{String(currentLevelNumber).padStart(2, "0")}</strong>
              <small>/ {String(totalLevels).padStart(2, "0")}</small>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
            >
              {muted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              className={styles.iconButton}
              onClick={requestFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? "↙" : "⛶"}
            </button>
          </div>
        </header>

        {/* =========================================================
            HERO BANNER
        ========================================================= */}
        <section className={styles.heroBanner}>
          <div className={styles.heroGrid} />

          <div className={styles.heroGlow} />

          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}>
                <i />
                PUZZLE ADVENTURE
                <i />
              </span>

              <h1>WORMZY</h1>

              <p>EAT • GROW • SOLVE • ESCAPE</p>
            </div>

            <div className={styles.heroSymbols} aria-hidden="true">
              <span className={`${styles.heroSymbol} ${styles.symbolApple}`}>
                🍎
              </span>

              <span className={`${styles.heroSymbol} ${styles.symbolStone}`}>
                ◈
              </span>

              <span className={`${styles.heroSymbol} ${styles.symbolNumber}`}>
                2
              </span>

              <span className={`${styles.heroSymbol} ${styles.symbolWorm}`}>
                ~
              </span>

              <span className={`${styles.heroSymbol} ${styles.symbolHole}`}>
                ◉
              </span>
            </div>

            <div className={styles.heroTrail} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        {/* =========================================================
            LEVEL + OBJECTIVE
        ========================================================= */}
        <section className={styles.missionPanel}>
          <div className={styles.missionMain}>
            <div className={styles.missionLabel}>
              <span className={styles.liveDot} />
              CURRENT MISSION
            </div>

            <div className={styles.missionTitleRow}>
              <div>
                <span className={styles.levelKicker}>
                  LEVEL {String(currentLevelNumber).padStart(2, "0")}
                </span>

                <h2>{gameState.levelName}</h2>
              </div>

              <div className={styles.levelProgress}>
                <div className={styles.levelProgressHeader}>
                  <span>CAMPAIGN</span>
                  <strong>
                    {currentLevelNumber}/{totalLevels}
                  </strong>
                </div>

                <div className={styles.levelProgressTrack}>
                  <span style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>

            <p className={styles.missionDescription}>{gameState.description}</p>

            <div className={styles.objectiveRow}>
              <div className={styles.objectiveIcon}>
                <span>🍎</span>
              </div>

              <div className={styles.objectiveCopy}>
                <span>OBJECTIVE</span>
                <strong>Collect both apples and reach the exit hole.</strong>
              </div>

              <div className={styles.appleProgress}>
                <strong>
                  {appleCount}/{applesTotal}
                </strong>

                <div className={styles.appleTrack}>
                  <span
                    style={{
                      width: `${objectiveProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.missionStats}>
            <div className={styles.missionStat}>
              <span className={styles.statIcon}>✦</span>
              <small>SCORE</small>
              <strong>{currentScore.toLocaleString()}</strong>
            </div>

            <div className={styles.missionStat}>
              <span className={styles.statIcon}>↗</span>
              <small>MOVES</small>
              <strong>{gameState.moves}</strong>
            </div>

            <div className={styles.missionStat}>
              <span className={styles.statIcon}>◷</span>
              <small>TIME</small>
              <strong>{formatTime(elapsedSeconds)}</strong>
            </div>

            <div className={styles.missionStat}>
              <span className={styles.statIcon}>★</span>
              <small>STARS</small>
              <strong>
                {Array.from({ length: 3 }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index < stars ? styles.starActive : styles.starInactive
                    }
                  >
                    ★
                  </span>
                ))}
              </strong>
            </div>
          </div>
        </section>

        {/* =========================================================
            MAIN GAME AREA
        ========================================================= */}
        <section className={styles.gameLayout}>
          {/* LEFT PANEL */}
          <aside className={styles.sidePanel}>
            <div className={styles.panelHeading}>
              <span>MISSION DATA</span>
              <i />
            </div>

            <div className={styles.missionCard}>
              <span className={styles.cardLabel}>APPLES</span>

              <div className={styles.appleBigRow}>
                <span className={styles.appleMini}>🍎</span>
                <strong>
                  {appleCount}
                  <small>/2</small>
                </strong>
              </div>

              <div className={styles.cardProgress}>
                <span style={{ width: `${objectiveProgress}%` }} />
              </div>

              <p>Eat both apples before reaching the exit.</p>
            </div>

            <div className={styles.missionCard}>
              <span className={styles.cardLabel}>CURRENT RUN</span>

              <div className={styles.runRows}>
                <div>
                  <span>Moves</span>
                  <strong>{gameState.moves}</strong>
                </div>

                <div>
                  <span>Time</span>
                  <strong>{formatTime(elapsedSeconds)}</strong>
                </div>

                <div>
                  <span>Stars</span>
                  <strong className={styles.smallStars}>
                    {stars > 0 ? "★".repeat(stars) : "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.controlHint}>
              <div className={styles.keyboardIcon}>
                <span>↑</span>
                <span>←</span>
                <span>↓</span>
                <span>→</span>
              </div>

              <div>
                <strong>MOVE WORMZY</strong>
                <span>Arrow keys or WASD</span>
              </div>
            </div>
          </aside>

          {/* BOARD */}
          <div className={styles.boardColumn}>
            <div className={styles.boardTopline}>
              <span>WORMZY // ACTIVE BOARD</span>

              <span className={styles.boardStatus}>
                <i />
                LIVE
              </span>
            </div>

            <div
              className={`${styles.boardShell} ${
                phase === "playing" ? styles.boardPlaying : ""
              }`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={styles.board}
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                }}
              >
                {renderBoard()}

                {phase === "counting" && (
                  <div className={styles.boardOverlay}>
                    <div className={styles.countdownCard}>
                      <span>GET READY</span>
                      <strong>{countdown > 0 ? countdown : "GO"}</strong>

                      <small>
                        {countdown > 0
                          ? "Plan your first move"
                          : "Good luck, Wormzy"}
                      </small>
                    </div>
                  </div>
                )}

                {phase === "idle" && (
                  <div className={styles.boardOverlay}>
                    <div className={styles.stateCard}>
                      <div className={styles.stateIcon}>🐍</div>

                      <span className={styles.stateEyebrow}>
                        WELCOME TO WORMZY
                      </span>

                      <h2>Ready to solve?</h2>

                      <p>Eat the apples, solve the path and reach the exit.</p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => startLevel(levelIndex)}
                      >
                        <span>Play Level</span>
                        <b>→</b>
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setShowHowToPlay(true)}
                      >
                        How To Play
                      </button>
                    </div>
                  </div>
                )}

                {phase === "failed" && (
                  <div className={styles.boardOverlay}>
                    <div className={styles.stateCard}>
                      <div className={styles.dangerIcon}>↘</div>

                      <span className={styles.stateEyebrow}>WORMZY FELL</span>

                      <h2>Try the path again.</h2>

                      <p>
                        The gap got you this time. You have one free fall retry
                        on this attempt.
                      </p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleRetry}
                      >
                        <span>Retry Level</span>
                        <b>↻</b>
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleExit}
                      >
                        Exit Game
                      </button>
                    </div>
                  </div>
                )}

                {phase === "gameover" && (
                  <div className={styles.boardOverlay}>
                    <div className={styles.stateCard}>
                      <div className={styles.dangerIcon}>!</div>

                      <span className={styles.stateEyebrow}>RUN ENDED</span>

                      <h2>Wormzy needs another try.</h2>

                      <p>
                        Start this level again for the normal 20 Token entry
                        cost.
                      </p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleGameOverRetry}
                      >
                        <span>Try Again</span>
                        <small>20 Tokens</small>
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleGameOverExit}
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                )}

                {phase === "complete" && (
                  <div className={styles.boardOverlay}>
                    <div
                      className={`${styles.stateCard} ${styles.completeCard}`}
                    >
                      <div className={styles.completeIcon}>✓</div>

                      <span className={styles.stateEyebrow}>
                        LEVEL COMPLETE
                      </span>

                      <h2>Path solved.</h2>

                      <div className={styles.bigStars}>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <span
                            key={index}
                            className={
                              index < stars
                                ? styles.starActive
                                : styles.starInactive
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <div className={styles.completeStats}>
                        <div>
                          <span>SCORE</span>
                          <strong>{score.toLocaleString()}</strong>
                        </div>

                        <div>
                          <span>MOVES</span>
                          <strong>{gameState.moves}</strong>
                        </div>

                        <div>
                          <span>TIME</span>
                          <strong>{formatTime(elapsedSeconds)}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleNextLevel}
                      >
                        <span>
                          {levelIndex >= totalLevels - 1
                            ? "Finish Campaign"
                            : "Next Level"}
                        </span>
                        <b>→</b>
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleRestart}
                      >
                        Replay Level
                      </button>
                    </div>
                  </div>
                )}

                {phase === "finished" && (
                  <div className={styles.boardOverlay}>
                    <div
                      className={`${styles.stateCard} ${styles.finishedCard}`}
                    >
                      <div className={styles.trophyIcon}>✦</div>

                      <span className={styles.stateEyebrow}>
                        CAMPAIGN COMPLETE
                      </span>

                      <h2>You mastered Wormzy.</h2>

                      <p>
                        Every level is complete. Your final performance has been
                        converted into Game Coins.
                      </p>

                      <div className={styles.finalReward}>
                        <img src="/assets/icons/game-coin-icon.png" alt="" />

                        <div>
                          <span>GAME COINS EARNED</span>
                          <strong>+{finalReward}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleCollectReward}
                      >
                        <span>Collect Reward</span>
                        <b>→</b>
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleExit}
                      >
                        Back to Games
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.boardLegend}>
              <span>
                <i className={styles.legendWorm} />
                WORMZY
              </span>

              <span>
                <i className={styles.legendApple} />
                APPLE
              </span>

              <span>
                <i className={styles.legendStone} />
                STONE
              </span>

              <span>
                <i className={styles.legendTarget} />
                TARGET
              </span>

              <span>
                <i className={styles.legendDanger} />
                DANGER
              </span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <aside className={styles.howToPanel}>
            <div className={styles.panelHeading}>
              <span>HOW TO PLAY</span>
              <i />
            </div>

            <div className={styles.howVisual}>
              <div className={styles.howGrid} />

              <div className={styles.howWorm}>
                <span />
                <span />
                <span />
                <b>
                  <i />
                  <i />
                </b>
              </div>

              <span className={styles.howApple}>🍎</span>
              <span className={styles.howStone}>◆</span>
              <span className={styles.howTarget}>◎</span>
            </div>

            <div className={styles.instructions}>
              <div className={styles.instruction}>
                <span>01</span>

                <div>
                  <strong>MOVE</strong>
                  <p>Use arrows, WASD or swipe.</p>
                </div>
              </div>

              <div className={styles.instruction}>
                <span>02</span>

                <div>
                  <strong>EAT</strong>
                  <p>Collect both apples to grow.</p>
                </div>
              </div>

              <div className={styles.instruction}>
                <span>03</span>

                <div>
                  <strong>PUSH</strong>
                  <p>Move stones into glowing targets.</p>
                </div>
              </div>

              <div className={styles.instruction}>
                <span>04</span>

                <div>
                  <strong>SURVIVE</strong>
                  <p>Avoid spikes and dangerous falls.</p>
                </div>
              </div>

              <div className={styles.instruction}>
                <span>05</span>

                <div>
                  <strong>ESCAPE</strong>
                  <p>Reach the hole after the objective.</p>
                </div>
              </div>
            </div>

            <div className={styles.tipBox}>
              <span>PRO TIP</span>
              <p>
                Your body can bridge a gap while at least one segment remains
                anchored.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MOBILE CONTROLS
        ========================================================= */}
        <section className={styles.mobileControls}>
          <div className={styles.mobileControlTitle}>
            <span>MOVE WORMZY</span>
            <small>SWIPE OR TAP</small>
          </div>

          <div className={styles.dPad}>
            <button
              type="button"
              onClick={() => handleMove("up")}
              aria-label="Move up"
            >
              ↑
            </button>

            <button
              type="button"
              onClick={() => handleMove("left")}
              aria-label="Move left"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => handleMove("down")}
              aria-label="Move down"
            >
              ↓
            </button>

            <button
              type="button"
              onClick={() => handleMove("right")}
              aria-label="Move right"
            >
              →
            </button>
          </div>
        </section>

        {/* =========================================================
            DETAILS
        ========================================================= */}
        <section className={styles.detailsSection}>
          <div className={styles.detailIntro}>
            <span className={styles.sectionEyebrow}>
              WORMZY // GAME DETAILS
            </span>

            <h2>
              Every move matters.
              <br />
              Every level gets harder.
            </h2>

            <p>
              Solve the route, manage your movement and collect enough apples to
              reach the exit. Your score is calculated from level progress,
              moves, time and stars.
            </p>
          </div>

          <div className={styles.detailGrid}>
            <article className={styles.detailCard}>
              <span>01</span>
              <strong>15 LEVELS</strong>
              <p>Progress through a complete puzzle campaign.</p>
            </article>

            <article className={styles.detailCard}>
              <span>02</span>
              <strong>STONE PUZZLES</strong>
              <p>Push stones into targets to bridge dangerous gaps.</p>
            </article>

            <article className={styles.detailCard}>
              <span>03</span>
              <strong>STAR SYSTEM</strong>
              <p>Faster and cleaner solutions can earn up to three stars.</p>
            </article>

            <article className={styles.detailCard}>
              <span>04</span>
              <strong>GAME COINS</strong>
              <p>Complete the campaign and earn Game Coins.</p>
            </article>
          </div>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}
        <footer className={styles.gameFooter}>
          <div className={styles.footerBrand}>
            <span className={styles.footerMark}>V</span>

            <div>
              <strong>VELOOP</strong>
              <span>Games & Rewards</span>
            </div>
          </div>

          <div className={styles.footerCenter}>
            <span>WORMZY</span>
            <i>•</i>
            <span>EAT</span>
            <i>•</i>
            <span>GROW</span>
            <i>•</i>
            <span>ESCAPE</span>
          </div>

          <button
            type="button"
            className={styles.footerExit}
            onClick={handleExit}
          >
            Back to Games →
          </button>
        </footer>

        {/* =========================================================
            HOW TO PLAY MODAL
        ========================================================= */}
        {showHowToPlay && (
          <div className={styles.modalBackdrop}>
            <div
              className={styles.howModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wormzy-how-title"
            >
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowHowToPlay(false)}
                aria-label="Close how to play"
              >
                ×
              </button>

              <span className={styles.modalEyebrow}>WORMZY // GUIDE</span>

              <h2 id="wormzy-how-title">How To Play</h2>

              <p className={styles.modalIntro}>
                Solve each level by collecting both apples, navigating the
                platforms and reaching the exit.
              </p>

              <div className={styles.modalSteps}>
                <div>
                  <span>01</span>
                  <strong>MOVE WORMZY</strong>
                  <p>Arrow keys, WASD, swipe or the mobile controls.</p>
                </div>

                <div>
                  <span>02</span>
                  <strong>EAT APPLES</strong>
                  <p>Collect both apples before reaching the hole.</p>
                </div>

                <div>
                  <span>03</span>
                  <strong>PUSH STONES</strong>
                  <p>Use stones to bridge gaps and solve paths.</p>
                </div>

                <div>
                  <span>04</span>
                  <strong>AVOID DANGER</strong>
                  <p>Spikes and unsupported falls can end a run.</p>
                </div>

                <div>
                  <span>05</span>
                  <strong>REACH THE HOLE</strong>
                  <p>Complete the objective and escape the level.</p>
                </div>
              </div>

              <div className={styles.modalTip}>
                <span>★</span>
                <p>
                  Keep your move count and time low to improve your star rating.
                </p>
              </div>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setShowHowToPlay(false);

                  if (phase === "idle") {
                    startLevel(levelIndex);
                  }
                }}
              >
                <span>{phase === "idle" ? "Start Level" : "Got It"}</span>
                <b>→</b>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default WormzyGame;
