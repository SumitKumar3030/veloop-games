import { useState, useEffect, useCallback, useRef } from "react";

import {
  GRID_SIZE,
  createInitialGrid,
  move,
  addRandomTile,
  addBombTile,
  detonateBomb,
  isGameOver,
  reviveGrid,
  calculateReward,
  BOMB,
} from "./logic";

import GameOver from "../../components/games/GameOver";
import styles from "./Game.module.css";

import {
  initSound,
  setMuted,
  playMerge,
  playComboBoost,
  playSpawn,
  playInvalidMove,
  playBombExplosion,
  playBonus,
  playRevive,
  playGameOver,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "./sound";

const COUNTDOWN_SECONDS = 3;

const BACKGROUND_MUSIC_SRC = "/sounds/background.mp3";
const BACKGROUND_MUSIC_VOLUME = 0.22;

const SWIPE_THRESHOLD = 30;

function MergeMasterGame({ onGameEnd }) {
  // ==================================================
  // GAME STATE
  // ==================================================

  const [grid, setGrid] = useState(createInitialGrid);
  const [score, setScore] = useState(0);

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("merge-master-best");
    return saved ? Number(saved) : 0;
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);

  /*
    idle      -> game hasn't started
    counting  -> 3, 2, 1, GO
    playing   -> active gameplay
  */
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [muted, setMutedState] = useState(false);

  // ==================================================
  // VISUAL EFFECT STATE
  // ==================================================

  const [mergeEffects, setMergeEffects] = useState([]);
  const [floatingScores, setFloatingScores] = useState([]);

  const [spawnEffects, setSpawnEffects] = useState([]);

  const [explosionEffects, setExplosionEffects] = useState([]);

  const [screenShake, setScreenShake] = useState(false);

  const [combo, setCombo] = useState(0);
  const [comboVisible, setComboVisible] = useState(false);

  const [bonusFlash, setBonusFlash] = useState(null);

  const [bombPowerups, setBombPowerups] = useState(1);

  const [doubleScorePowerups, setDoubleScorePowerups] = useState(1);

  const [undoPowerups, setUndoPowerups] = useState(1);

  const [doubleScoreMoves, setDoubleScoreMoves] = useState(0);

  const [powerupMessage, setPowerupMessage] = useState(null);

  // ==================================================
  // REFS
  // ==================================================

  const touchStartRef = useRef(null);
  const gridRef = useRef(grid);
  const gameRef = useRef(null);

  const comboTimerRef = useRef(null);
  const effectIdRef = useRef(0);

  const gameOverTimerRef = useRef(null);
  const screenShakeTimerRef = useRef(null);

  const effectTimersRef = useRef([]);

  const previousStateRef = useRef(null);

  // ==================================================
  // GRID REF
  // ==================================================

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // ==================================================
  // BEST SCORE
  // ==================================================

  useEffect(() => {
    if (score <= bestScore) {
      return;
    }

    setBestScore(score);

    localStorage.setItem("merge-master-best", String(score));
  }, [score, bestScore]);

  // ==================================================
  // TIMER HELPER
  // ==================================================

  const schedule = useCallback((callback, delay) => {
    const timer = setTimeout(callback, delay);

    effectTimersRef.current.push(timer);

    return timer;
  }, []);

  // ==================================================
  // COUNTDOWN
  // ==================================================

  useEffect(() => {
    if (phase !== "counting") {
      return;
    }

    const timer = setTimeout(() => {
      if (countdown === 0) {
        setPhase("playing");
        return;
      }

      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // ==================================================
  // FULLSCREEN STATE
  // ==================================================

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === gameRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // ==================================================
  // AUDIO CLEANUP
  // ==================================================

  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // ==================================================
  // GENERAL CLEANUP
  // ==================================================

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }

      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current);
      }

      if (screenShakeTimerRef.current) {
        clearTimeout(screenShakeTimerRef.current);
      }

      effectTimersRef.current.forEach((timer) => clearTimeout(timer));

      effectTimersRef.current = [];
    };
  }, []);

  // ==================================================
  // FULLSCREEN
  // ==================================================

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenEnabled || !gameRef.current) {
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await gameRef.current.requestFullscreen();
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  }, []);

  // ==================================================
  // SOUND
  // ==================================================

  const handleMuteToggle = useCallback(() => {
    const nextMuted = !muted;

    setMutedState(nextMuted);
    setMuted(nextMuted);
  }, [muted]);

  // ==================================================
  // START / RESTART GAME
  // ==================================================

  const handlePlay = useCallback(() => {
    /*
      Clear any pending game-over transition from
      the previous run.
    */
    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);

      gameOverTimerRef.current = null;
    }

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }

    if (screenShakeTimerRef.current) {
      clearTimeout(screenShakeTimerRef.current);

      screenShakeTimerRef.current = null;
    }

    // Unlock audio from the user gesture.
    initSound();

    startBackgroundMusic(BACKGROUND_MUSIC_SRC, BACKGROUND_MUSIC_VOLUME);

    const newGrid = createInitialGrid();

    gridRef.current = newGrid;

    setGrid(newGrid);
    setScore(0);

    setGameOver(false);
    setHasUsedRevive(false);

    setCountdown(COUNTDOWN_SECONDS);
    setPhase("counting");

    // Reset all visual effects.
    setMergeEffects([]);
    setFloatingScores([]);
    setSpawnEffects([]);
    setExplosionEffects([]);

    setBonusFlash(null);

    setCombo(0);
    setComboVisible(false);

    setScreenShake(false);

    setBombPowerups(1);
    setDoubleScorePowerups(1);
    setUndoPowerups(1);
    setDoubleScoreMoves(0);

    previousStateRef.current = null;
    setPowerupMessage(null);
  }, []);

  // ==================================================
  // HOW TO PLAY
  // ==================================================

  const handleHowToPlay = useCallback(() => {
    setShowHowToPlay(true);
  }, []);

  const closeHowToPlay = useCallback(() => {
    setShowHowToPlay(false);
  }, []);

  // ==================================================
  // EFFECT LEVEL
  // ==================================================

  const getEffectLevel = useCallback((value) => {
    if (value >= 1024) {
      return "mergeLegendary";
    }

    if (value >= 256) {
      return "mergeEpic";
    }

    if (value >= 64) {
      return "mergeStrong";
    }

    if (value >= 16) {
      return "mergeMedium";
    }

    return "mergeSmall";
  }, []);

  // ==================================================
  // CREATE MERGE EFFECT
  // ==================================================

  const createMergeEffect = useCallback(
    (merge) => {
      return {
        id: ++effectIdRef.current,
        row: merge.row,
        col: merge.col,
        value: merge.value,
        level: getEffectLevel(merge.value),
      };
    },
    [getEffectLevel],
  );

  // ==================================================
  // CREATE FLOATING SCORE
  // ==================================================

  const createFloatingScore = useCallback((merge) => {
    return {
      id: ++effectIdRef.current,
      row: merge.row,
      col: merge.col,
      value: merge.value,
    };
  }, []);

  // ==================================================
  // MERGE EFFECTS
  // ==================================================

  const triggerMergeEffects = useCallback(
    (merges) => {
      if (!merges?.length) {
        return;
      }

      const newMergeEffects = merges.map(createMergeEffect);

      const newFloatingScores = merges.map(createFloatingScore);

      setMergeEffects(newMergeEffects);
      setFloatingScores(newFloatingScores);

      // ----------------------------------------------
      // COMBO
      // ----------------------------------------------

      setCombo((currentCombo) => {
        return currentCombo + merges.length;
      });

      setComboVisible(true);

      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }

      comboTimerRef.current = schedule(() => {
        setComboVisible(false);
        setCombo(0);
      }, 1400);

      // ----------------------------------------------
      // SCREEN SHAKE
      // ----------------------------------------------

      const biggestMerge = Math.max(...merges.map((merge) => merge.value));

      if (biggestMerge >= 64) {
        setScreenShake(true);

        if (screenShakeTimerRef.current) {
          clearTimeout(screenShakeTimerRef.current);
        }

        screenShakeTimerRef.current = schedule(
          () => {
            setScreenShake(false);
          },
          biggestMerge >= 512 ? 500 : 350,
        );
      }

      // ----------------------------------------------
      // CLEAN EFFECTS
      // ----------------------------------------------

      schedule(() => {
        setMergeEffects([]);
      }, 650);

      schedule(() => {
        setFloatingScores([]);
      }, 850);
    },
    [createMergeEffect, createFloatingScore, schedule],
  );

  // ==================================================
  // SPAWN EFFECT
  // ==================================================

  const triggerSpawnEffect = useCallback(
    (nextGrid, previousGrid) => {
      const effects = [];

      for (let row = 0; row < nextGrid.length; row++) {
        for (let col = 0; col < nextGrid[row].length; col++) {
          const oldValue = previousGrid[row][col];

          const newValue = nextGrid[row][col];

          if (oldValue === 0 && newValue !== 0 && newValue !== BOMB) {
            effects.push({
              id: ++effectIdRef.current,
              row,
              col,
            });
          }
        }
      }

      if (!effects.length) {
        return;
      }

      setSpawnEffects(effects);

      schedule(() => {
        setSpawnEffects([]);
      }, 350);
    },
    [schedule],
  );

  // ==================================================
  // MOVE
  // ==================================================

  const showPowerupMessage = useCallback((message) => {
    setPowerupMessage(message);

    setTimeout(() => {
      setPowerupMessage(null);
    }, 1200);
  }, []);

  const handleBombPowerup = useCallback(() => {
    if (gameOver || phase !== "playing" || bombPowerups <= 0) {
      return;
    }

    const currentGrid = gridRef.current;

    const emptyCells = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentGrid[r][c] === 0) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length === 0) {
      showPowerupMessage("BOARD FULL");
      return;
    }

    const [row, col] =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];

    const nextGrid = currentGrid.map((gridRow) => [...gridRow]);

    nextGrid[row][col] = BOMB;

    previousStateRef.current = {
      grid: currentGrid.map((gridRow) => [...gridRow]),
      score,
    };

    gridRef.current = nextGrid;
    setGrid(nextGrid);

    setBombPowerups((current) => current - 1);

    playSpawn();

    showPowerupMessage("💣 BOMB READY");
  }, [gameOver, phase, bombPowerups, score, showPowerupMessage]);

  const handleDoubleScore = useCallback(() => {
    if (gameOver || phase !== "playing" || doubleScorePowerups <= 0) {
      return;
    }

    setDoubleScorePowerups((current) => current - 1);

    setDoubleScoreMoves(3);

    showPowerupMessage("⚡ 2× SCORE — 3 MOVES");
  }, [gameOver, phase, doubleScorePowerups, showPowerupMessage]);

  const handleUndo = useCallback(() => {
    if (gameOver || phase !== "playing" || undoPowerups <= 0) {
      return;
    }

    if (!previousStateRef.current) {
      showPowerupMessage("NOTHING TO UNDO");
      return;
    }

    const previous = previousStateRef.current;

    const restoredGrid = previous.grid.map((row) => [...row]);

    gridRef.current = restoredGrid;

    setGrid(restoredGrid);
    setScore(previous.score);

    setUndoPowerups((current) => current - 1);

    previousStateRef.current = null;

    showPowerupMessage("↩ MOVE UNDONE");
  }, [gameOver, phase, undoPowerups, showPowerupMessage]);

  const handleMove = useCallback(
    (direction) => {
      if (gameOver || phase !== "playing") {
        return;
      }

      const previousGrid = gridRef.current;

      const result = move(previousGrid, direction);

      if (!result.moved) {
        playInvalidMove();
        return;
      }

      // Save state for Undo.
      previousStateRef.current = {
        grid: previousGrid.map((row) => [...row]),
        score,
      };

      const scoreMultiplier = doubleScoreMoves > 0 ? 2 : 1;

      const actualScoreGained = result.scoreGained * scoreMultiplier;

      setScore((currentScore) => {
        return currentScore + actualScoreGained;
      });

      let nextGrid = addRandomTile(result.grid);

      if (result.scoreGained >= 64 && Math.random() < 0.25) {
        nextGrid = addBombTile(nextGrid);
      }

      gridRef.current = nextGrid;
      setGrid(nextGrid);

      if (result.merges.length > 0) {
        triggerMergeEffects(result.merges);

        result.merges.forEach((merge, i) => {
          playMerge(merge.value, i);
        });

        playComboBoost(result.merges.length);
      } else {
        playSpawn();
      }

      triggerSpawnEffect(nextGrid, result.grid);

      if (doubleScoreMoves > 0) {
        setDoubleScoreMoves((current) => Math.max(0, current - 1));
      }

      if (isGameOver(nextGrid)) {
        setTimeout(() => {
          setGameOver(true);
          playGameOver();
        }, 250);
      }
    },
    [
      gameOver,
      phase,
      score,
      doubleScoreMoves,
      triggerMergeEffects,
      triggerSpawnEffect,
    ],
  );

  // ==================================================
  // KEYBOARD CONTROLS
  // ==================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyMap = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };

      const direction = keyMap[event.key];

      if (!direction) {
        return;
      }

      /*
        Prevent page scrolling only when the
        game is actually active.
      */
      if (phase !== "playing") {
        return;
      }

      event.preventDefault();

      handleMove(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMove, phase]);

  // ==================================================
  // TOUCH START
  // ==================================================

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  // ==================================================
  // TOUCH END
  // ==================================================

  const handleTouchEnd = useCallback(
    (event) => {
      if (!touchStartRef.current) {
        return;
      }

      const touch = event.changedTouches[0];

      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const dx = touch.clientX - touchStartRef.current.x;

      const dy = touch.clientY - touchStartRef.current.y;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      touchStartRef.current = null;

      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) {
        return;
      }

      if (absDx > absDy) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    },
    [handleMove],
  );

  // ==================================================
  // BOMB
  // ==================================================

  const handleCellClick = useCallback(
    (index) => {
      if (phase !== "playing" || gameOver) {
        return;
      }

      const row = Math.floor(index / GRID_SIZE);

      const col = index % GRID_SIZE;

      if (gridRef.current[row]?.[col] !== BOMB) {
        return;
      }

      const result = detonateBomb(gridRef.current, row, col);

      const explosionId = ++effectIdRef.current;

      setExplosionEffects([
        {
          id: explosionId,
          row,
          col,
        },
      ]);

      schedule(() => {
        setExplosionEffects([]);
      }, 700);

      playBombExplosion();

      gridRef.current = result.grid;
      setGrid(result.grid);

      setScore((currentScore) => currentScore + result.bonus);

      schedule(() => {
        playBonus();
      }, 250);

      setBonusFlash(result.bonus);

      schedule(() => {
        setBonusFlash(null);
      }, 900);

      setScreenShake(true);

      if (screenShakeTimerRef.current) {
        clearTimeout(screenShakeTimerRef.current);
      }

      screenShakeTimerRef.current = schedule(() => {
        setScreenShake(false);
      }, 400);
    },
    [phase, gameOver, schedule],
  );

  // ==================================================
  // REVIVE
  // ==================================================

  const handleRevive = useCallback(() => {
    if (hasUsedRevive) {
      return;
    }

    playRevive();

    const revivedGrid = reviveGrid(gridRef.current);

    gridRef.current = revivedGrid;

    setGrid(revivedGrid);
    setGameOver(false);
    setHasUsedRevive(true);

    setBonusFlash("REVIVED");

    schedule(() => {
      setBonusFlash(null);
    }, 900);
  }, [hasUsedRevive, schedule]);

  // ==================================================
  // GAME END
  // ==================================================

  const handleNoThanks = useCallback(() => {
    stopBackgroundMusic();

    const reward = calculateReward(score);

    onGameEnd(reward);
  }, [score, onGameEnd]);

  // ==================================================
  // TILE CLASS
  // ==================================================

  const tileClass = useCallback((value) => {
    if (value === BOMB) {
      return `${styles.tile} ${styles.bomb}`;
    }

    if (!value) {
      return styles.tile;
    }

    const valueClass = styles[`tile${value}`];

    return `${styles.tile} ${valueClass || ""}`;
  }, []);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div
      ref={gameRef}
      className={`${styles.gameContainer} ${
        screenShake ? styles.screenShake : ""
      }`}
    >
      <div className={styles.game}>
        {/* =========================================
            HEADER
        ========================================= */}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>MERGE MASTER!</h1>

            <p className={styles.subtitle}>Merge. Explode. Master.</p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.fullscreenButton}
              onClick={handleMuteToggle}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Unmute" : "Mute"}
            >
              <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
            </button>

            {document.fullscreenEnabled && (
              <button
                type="button"
                className={styles.fullscreenButton}
                onClick={toggleFullscreen}
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                <span aria-hidden="true">{isFullscreen ? "⤢" : "⛶"}</span>

                <span className={styles.fullscreenLabel}>
                  {isFullscreen ? "Exit" : "Fullscreen"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================
            SCORE
        ========================================= */}

        <div className={styles.scoreContainer}>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>SCORE</div>

            <div className={styles.scoreValue}>{score.toLocaleString()}</div>
          </div>

          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>BEST</div>

            <div className={styles.scoreValue}>
              {bestScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* =========================================
            COMBO
        ========================================= */}

        {comboVisible && combo > 1 && (
          <div
            className={`${styles.combo} ${combo >= 4 ? styles.comboEpic : ""}`}
          >
            <span>🔥</span>
            COMBO x{combo}
            <span>🔥</span>
          </div>
        )}

        {/* =========================================
            BOARD
        ========================================= */}

        <div className={styles.boardWrap}>
          <div
            className={styles.board}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {grid.flat().map((value, index) => {
              const row = Math.floor(index / GRID_SIZE);

              const col = index % GRID_SIZE;

              const isSpawned = spawnEffects.some(
                (effect) => effect.row === row && effect.col === col,
              );

              return (
                <div
                  key={`${row}-${col}`}
                  className={tileClass(value)}
                  onClick={() => handleCellClick(index)}
                >
                  {value === BOMB ? "💣" : value !== 0 ? value : ""}

                  {isSpawned && <span className={styles.spawnFlash} />}
                </div>
              );
            })}

            {/* =====================================
                MERGE EFFECTS
            ===================================== */}

            {mergeEffects.map((effect) => {
              const positionStyle = {
                "--row": effect.row,
                "--col": effect.col,
              };

              return (
                <div
                  key={effect.id}
                  className={`${styles.mergeEffect} ${styles[effect.level]}`}
                  style={positionStyle}
                >
                  <span className={styles.mergeRing} />

                  <span className={styles.mergeBurst} />

                  <span className={styles.mergeCore} />

                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <span key={index} className={styles.mergeSpark} />
                  ))}
                </div>
              );
            })}

            {/* =====================================
                FLOATING SCORE
            ===================================== */}

            {floatingScores.map((effect) => {
              const positionStyle = {
                "--row": effect.row,
                "--col": effect.col,
              };

              return (
                <div
                  key={effect.id}
                  className={styles.floatingScore}
                  style={positionStyle}
                >
                  +{effect.value}
                </div>
              );
            })}

            {/* =====================================
                BOMB EXPLOSION
            ===================================== */}

            {explosionEffects.map((effect) => {
              const positionStyle = {
                "--row": effect.row,
                "--col": effect.col,
              };

              return (
                <div
                  key={effect.id}
                  className={styles.explosionEffect}
                  style={positionStyle}
                >
                  <span className={styles.explosionRing} />

                  <span className={styles.explosionCore} />

                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <span key={index} className={styles.explosionParticle} />
                  ))}
                </div>
              );
            })}

            {/* =====================================
                START / COUNTDOWN
            ===================================== */}

            {phase !== "playing" && !showHowToPlay && (
              <div className={styles.overlay}>
                {phase === "idle" && (
                  <>
                    <div className={styles.overlayLogo}>🔥</div>

                    <h2 className={styles.overlayTitle}>MERGE MASTER</h2>

                    <p className={styles.overlayText}>
                      Match tiles, create combos and reach 2048.
                    </p>

                    <div className={styles.overlayButtons}>
                      <button
                        type="button"
                        className={styles.playBtn}
                        onClick={handlePlay}
                      >
                        <span>▶</span>
                        Play Now
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleHowToPlay}
                      >
                        How to Play
                      </button>
                    </div>
                  </>
                )}

                {phase === "counting" && (
                  <div className={styles.countdown} key={countdown}>
                    {countdown === 0 ? "GO!" : countdown}
                  </div>
                )}
              </div>
            )}

            {/* =====================================
                HOW TO PLAY
            ===================================== */}

            {showHowToPlay && (
              <div className={styles.overlay}>
                <div className={styles.howToPlay}>
                  <h2 className={styles.overlayTitle}>How to Play</h2>

                  <div className={styles.instructions}>
                    <div>
                      <span>👆</span>
                      <p>Swipe in any direction to move tiles.</p>
                    </div>

                    <div>
                      <span>⌨️</span>
                      <p>Use arrow keys on desktop.</p>
                    </div>

                    <div>
                      <span>🔢</span>
                      <p>Match two identical numbers to merge them.</p>
                    </div>

                    <div>
                      <span>💣</span>
                      <p>Tap a bomb to clear nearby tiles.</p>
                    </div>

                    <div>
                      <span>🏆</span>
                      <p>Build bigger tiles and chase the highest score.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.playBtn}
                    onClick={() => {
                      closeHowToPlay();
                      handlePlay();
                    }}
                  >
                    <span>▶</span>
                    Play Now
                  </button>

                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={closeHowToPlay}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              BONUS FLASH
          ========================================= */}

          {bonusFlash !== null && (
            <div className={styles.bonusFlash}>
              {typeof bonusFlash === "number" ? `+${bonusFlash}` : bonusFlash}
            </div>
          )}
        </div>

        {powerupMessage && (
          <div className={styles.powerupMessage} aria-live="polite">
            {powerupMessage}
          </div>
        )}

        {doubleScoreMoves > 0 && (
          <div className={styles.multiplierStatus}>
            <span>⚡</span>
            2× SCORE ACTIVE
            <strong>{doubleScoreMoves}</strong>
          </div>
        )}

        {/* =========================================
            GAME HINT
        ========================================= */}

        {/* POWER-UPS */}
        {phase === "playing" && !gameOver && (
          <>
            {doubleScoreMoves > 0 && (
              <div className={styles.multiplierStatus}>
                <span>⚡</span>
                2× SCORE ACTIVE
                <strong>{doubleScoreMoves}</strong>
              </div>
            )}

            <div className={styles.powerups}>
              <button
                type="button"
                className={`${styles.powerupButton} ${
                  bombPowerups <= 0 ? styles.powerupDisabled : ""
                }`}
                onClick={handleBombPowerup}
                disabled={bombPowerups <= 0}
                aria-label="Use bomb power-up"
              >
                <span className={styles.powerupIcon}>💣</span>

                <span className={styles.powerupInfo}>
                  <span className={styles.powerupText}>Bomb</span>

                  <span className={styles.powerupCount}>{bombPowerups}</span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.powerupButton} ${
                  doubleScorePowerups <= 0 ? styles.powerupDisabled : ""
                }`}
                onClick={handleDoubleScore}
                disabled={doubleScorePowerups <= 0}
                aria-label="Use double score power-up"
              >
                <span className={styles.powerupIcon}>⚡</span>

                <span className={styles.powerupInfo}>
                  <span className={styles.powerupText}>2× Score</span>

                  <span className={styles.powerupCount}>
                    {doubleScorePowerups}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`${styles.powerupButton} ${
                  undoPowerups <= 0 || !previousStateRef.current
                    ? styles.powerupDisabled
                    : ""
                }`}
                onClick={handleUndo}
                disabled={undoPowerups <= 0 || !previousStateRef.current}
                aria-label="Undo previous move"
              >
                <span className={styles.powerupIcon}>↩</span>

                <span className={styles.powerupInfo}>
                  <span className={styles.powerupText}>Undo</span>

                  <span className={styles.powerupCount}>{undoPowerups}</span>
                </span>
              </button>
            </div>
          </>
        )}

        <p className={styles.hint}>
          Swipe or use arrow keys to merge tiles
          <br />
          Tap 💣 to detonate a bomb
        </p>

        {powerupMessage && (
          <div className={styles.powerupMessage} aria-live="polite">
            {powerupMessage}
          </div>
        )}

        {gameOver && (
          <GameOver
            score={score}
            canRevive={!hasUsedRevive}
            onRevive={handleRevive}
            onNoThanks={handleNoThanks}
          />
        )}
      </div>
    </div>
  );
}

export default MergeMasterGame;
