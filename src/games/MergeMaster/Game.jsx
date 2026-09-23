import { useState, useEffect, useCallback, useRef } from "react";

import {
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

// Put your own track at this path inside your project's /public folder
// (e.g. public/sounds/background.mp3) — served at the root, so the path
// here stays "/sounds/background.mp3" regardless of file format.
const BACKGROUND_MUSIC_SRC = "/sounds/background.mp3";
const BACKGROUND_MUSIC_VOLUME = 0.22;

function MergeMasterGame({ onGameEnd }) {
  // --------------------------------------------------
  // GAME STATE
  // --------------------------------------------------

  const [grid, setGrid] = useState(createInitialGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("merge-master-best");
    return saved ? Number(saved) : 0;
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);

  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMutedState] = useState(false);

  // --------------------------------------------------
  // VISUAL EFFECT STATE
  // --------------------------------------------------

  const [mergeEffects, setMergeEffects] = useState([]);
  const [floatingScores, setFloatingScores] = useState([]);
  const [spawnEffects, setSpawnEffects] = useState([]);
  const [explosionEffects, setExplosionEffects] = useState([]);
  const [screenShake, setScreenShake] = useState(false);

  const [combo, setCombo] = useState(0);
  const [comboVisible, setComboVisible] = useState(false);
  const [bonusFlash, setBonusFlash] = useState(null);

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const touchStartRef = useRef(null);
  const gridRef = useRef(grid);
  const gameRef = useRef(null);

  const comboTimerRef = useRef(null);
  const effectIdRef = useRef(0);

  // --------------------------------------------------
  // KEEP GRID REF UPDATED
  // --------------------------------------------------

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // --------------------------------------------------
  // SAVE BEST SCORE
  // --------------------------------------------------

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("merge-master-best", String(score));
    }
  }, [score, bestScore]);

  // --------------------------------------------------
  // COUNTDOWN
  // --------------------------------------------------

  useEffect(() => {
    if (phase !== "counting") return;

    const timer = setTimeout(() => {
      if (countdown === 0) {
        setPhase("playing");
      } else {
        setCountdown((current) => current - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // --------------------------------------------------
  // FULLSCREEN STATE
  // --------------------------------------------------

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === gameRef.current,
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // FULLSCREEN
  // --------------------------------------------------

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

  // --------------------------------------------------
  // START GAME
  // --------------------------------------------------

  const handleMuteToggle = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  // Stop the background track if the player navigates away without going
  // through handleNoThanks (e.g. the parent component unmounts us).
  useEffect(() => {
    return () => stopBackgroundMusic();
  }, []);

  const handlePlay = () => {
    // Browsers only allow audio to start from a user gesture — handlePlay()
    // only ever runs from a button click, so this is a safe place to
    // unlock the AudioContext and kick off the background track.
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

    setMergeEffects([]);
    setFloatingScores([]);
    setSpawnEffects([]);
    setExplosionEffects([]);
    setBonusFlash(null);
    setCombo(0);
    setComboVisible(false);
    setScreenShake(false);
  };

  // --------------------------------------------------
  // HOW TO PLAY
  // --------------------------------------------------

  const handleHowToPlay = () => {
    setShowHowToPlay(true);
  };

  // --------------------------------------------------
  // EFFECT LEVEL
  // --------------------------------------------------

  const getEffectLevel = useCallback((value) => {
    if (value >= 1024) return "mergeLegendary";
    if (value >= 256) return "mergeEpic";
    if (value >= 64) return "mergeStrong";
    if (value >= 16) return "mergeMedium";

    return "mergeSmall";
  }, []);

  // --------------------------------------------------
  // CREATE MERGE EFFECT
  // --------------------------------------------------

  const createMergeEffect = useCallback(
    (merge) => {
      const id = ++effectIdRef.current;

      return {
        id,
        row: merge.row,
        col: merge.col,
        value: merge.value,
        level: getEffectLevel(merge.value),
      };
    },
    [getEffectLevel],
  );

  // --------------------------------------------------
  // CREATE FLOATING SCORE
  // --------------------------------------------------

  const createFloatingScore = useCallback((merge) => {
    const id = ++effectIdRef.current;

    return {
      id,
      row: merge.row,
      col: merge.col,
      value: merge.value,
    };
  }, []);

  // --------------------------------------------------
  // MERGE VISUALS
  // --------------------------------------------------

  const triggerMergeEffects = useCallback(
    (merges) => {
      if (!merges || merges.length === 0) {
        return;
      }

      const newMergeEffects = merges.map(createMergeEffect);
      const newFloatingScores = merges.map(createFloatingScore);

      setMergeEffects(newMergeEffects);
      setFloatingScores(newFloatingScores);

      setCombo((currentCombo) => currentCombo + merges.length);
      setComboVisible(true);

      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }

      comboTimerRef.current = setTimeout(() => {
        setComboVisible(false);
        setCombo(0);
      }, 1400);

      const biggestMerge = Math.max(
        ...merges.map((merge) => merge.value),
      );

      if (biggestMerge >= 64) {
        setScreenShake(true);

        setTimeout(() => {
          setScreenShake(false);
        }, biggestMerge >= 512 ? 500 : 350);
      }

      setTimeout(() => {
        setMergeEffects([]);
      }, 650);

      setTimeout(() => {
        setFloatingScores([]);
      }, 850);
    },
    [createMergeEffect, createFloatingScore],
  );

  // --------------------------------------------------
  // SPAWN EFFECT
  // --------------------------------------------------

  const triggerSpawnEffect = useCallback((nextGrid, previousGrid) => {
    const effects = [];

    for (let r = 0; r < nextGrid.length; r++) {
      for (let c = 0; c < nextGrid[r].length; c++) {
        const oldValue = previousGrid[r][c];
        const newValue = nextGrid[r][c];

        if (
          oldValue === 0 &&
          newValue !== 0 &&
          newValue !== BOMB
        ) {
          effects.push({
            id: ++effectIdRef.current,
            row: r,
            col: c,
          });
        }
      }
    }

    if (effects.length > 0) {
      setSpawnEffects(effects);

      setTimeout(() => {
        setSpawnEffects([]);
      }, 350);
    }
  }, []);

  // --------------------------------------------------
  // MOVE
  // --------------------------------------------------

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

      setScore((currentScore) => {
        return currentScore + result.scoreGained;
      });

      let nextGrid = addRandomTile(result.grid);

      // Big merge can create a bomb.
      if (
        result.scoreGained >= 64 &&
        Math.random() < 0.25
      ) {
        nextGrid = addBombTile(nextGrid);
      }

      gridRef.current = nextGrid;
      setGrid(nextGrid);

      if (result.merges.length > 0) {
        triggerMergeEffects(result.merges);
        result.merges.forEach((merge, i) => playMerge(merge.value, i));
        playComboBoost(result.merges.length);
      } else {
        playSpawn();
      }

      triggerSpawnEffect(nextGrid, result.grid);

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
      triggerMergeEffects,
      triggerSpawnEffect,
    ],
  );

  // --------------------------------------------------
  // KEYBOARD
  // --------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event) => {
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

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleMove]);

  // --------------------------------------------------
  // TOUCH START
  // --------------------------------------------------

  const handleTouchStart = (event) => {
    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  // --------------------------------------------------
  // TOUCH END
  // --------------------------------------------------

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];

    const dx =
      touch.clientX - touchStartRef.current.x;

    const dy =
      touch.clientY - touchStartRef.current.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const SWIPE_THRESHOLD = 30;

    if (
      Math.max(absDx, absDy) <
      SWIPE_THRESHOLD
    ) {
      touchStartRef.current = null;
      return;
    }

    if (absDx > absDy) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }

    touchStartRef.current = null;
  };

  // --------------------------------------------------
  // BOMB CLICK
  // --------------------------------------------------

  const handleCellClick = (index) => {
    if (phase !== "playing" || gameOver) {
      return;
    }

    const row = Math.floor(index / 5);
    const col = index % 5;

    if (grid[row][col] !== BOMB) {
      return;
    }

    const {
      grid: newGrid,
      bonus,
    } = detonateBomb(grid, row, col);

    const explosionId = ++effectIdRef.current;

    setExplosionEffects([
      {
        id: explosionId,
        row,
        col,
      },
    ]);

    setTimeout(() => {
      setExplosionEffects([]);
    }, 700);

    playBombExplosion();

    gridRef.current = newGrid;
    setGrid(newGrid);

    setScore(
      (currentScore) => currentScore + bonus,
    );

    setTimeout(() => playBonus(), 250);

    setBonusFlash(bonus);

    setTimeout(() => {
      setBonusFlash(null);
    }, 900);

    setScreenShake(true);

    setTimeout(() => {
      setScreenShake(false);
    }, 400);
  };

  // --------------------------------------------------
  // REVIVE
  // --------------------------------------------------

  const handleRevive = () => {
    playRevive();

    const revivedGrid = reviveGrid(
      gridRef.current,
    );

    gridRef.current = revivedGrid;

    setGrid(revivedGrid);
    setGameOver(false);
    setHasUsedRevive(true);

    setBonusFlash("REVIVED");

    setTimeout(() => {
      setBonusFlash(null);
    }, 900);
  };

  // --------------------------------------------------
  // GAME END
  // --------------------------------------------------

  const handleNoThanks = () => {
    stopBackgroundMusic();

    const reward = calculateReward(score);

    onGameEnd(reward);
  };

  // --------------------------------------------------
  // TILE CLASS
  // --------------------------------------------------

  const tileClass = (value) => {
    if (value === BOMB) {
      return `${styles.tile} ${styles.bomb}`;
    }

    if (!value) {
      return styles.tile;
    }

    const valueClass = styles[`tile${value}`];

    return `${styles.tile} ${valueClass || ""}`;
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

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
            <h1 className={styles.title}>
              MERGE MASTER!
            </h1>

            <p className={styles.subtitle}>
              Merge. Explode. Master.
            </p>
          </div>

          {/* SOUND + FULLSCREEN */}

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
                isFullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
              title={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Fullscreen"
              }
            >
              <span aria-hidden="true">
                {isFullscreen ? "⤢" : "⛶"}
              </span>

              <span className={styles.fullscreenLabel}>
                {isFullscreen
                  ? "Exit"
                  : "Fullscreen"}
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
            <div className={styles.scoreLabel}>
              SCORE
            </div>

            <div className={styles.scoreValue}>
              {score.toLocaleString()}
            </div>
          </div>

          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>
              BEST
            </div>

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
            className={`${styles.combo} ${
              combo >= 4
                ? styles.comboEpic
                : ""
            }`}
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
              const row = Math.floor(
                index / 5,
              );

              const col = index % 5;

              const isSpawned =
                spawnEffects.some(
                  (effect) =>
                    effect.row === row &&
                    effect.col === col,
                );

              return (
                <div
                  key={index}
                  className={tileClass(value)}
                  onClick={() =>
                    handleCellClick(index)
                  }
                >
                  {value === BOMB
                    ? "💣"
                    : value !== 0
                      ? value
                      : ""}

                  {isSpawned && (
                    <span
                      className={
                        styles.spawnFlash
                      }
                    />
                  )}
                </div>
              );
            })}

            {/* MERGE EFFECTS */}

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

                  <span className={styles.mergeSpark} />
                  <span className={styles.mergeSpark} />
                  <span className={styles.mergeSpark} />
                  <span className={styles.mergeSpark} />
                  <span className={styles.mergeSpark} />
                  <span className={styles.mergeSpark} />
                </div>
              );
            })}

            {/* FLOATING SCORE */}

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

            {/* BOMB EXPLOSION */}

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
                  <span className={styles.explosionParticle} />
                  <span className={styles.explosionParticle} />
                  <span className={styles.explosionParticle} />
                  <span className={styles.explosionParticle} />
                </div>
              );
            })}

            {/* =====================================
                START / COUNTDOWN
            ===================================== */}

            {phase !== "playing" &&
              !showHowToPlay && (
                <div className={styles.overlay}>
                  {phase === "idle" && (
                    <>
                      <div className={styles.overlayLogo}>
                        🔥
                      </div>

                      <h2 className={styles.overlayTitle}>
                        MERGE MASTER
                      </h2>

                      <p className={styles.overlayText}>
                        Match tiles, create combos
                        and reach 2048.
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
                    <div
                      className={styles.countdown}
                      key={countdown}
                    >
                      {countdown === 0
                        ? "GO!"
                        : countdown}
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
                  <h2 className={styles.overlayTitle}>
                    How to Play
                  </h2>

                  <div className={styles.instructions}>
                    <div>
                      <span>👆</span>
                      <p>
                        Swipe in any direction
                        to move tiles.
                      </p>
                    </div>

                    <div>
                      <span>⌨️</span>
                      <p>
                        Use arrow keys on
                        desktop.
                      </p>
                    </div>

                    <div>
                      <span>🔢</span>
                      <p>
                        Match two identical
                        numbers to merge them.
                      </p>
                    </div>

                    <div>
                      <span>💣</span>
                      <p>
                        Tap a bomb to clear
                        nearby tiles.
                      </p>
                    </div>

                    <div>
                      <span>🏆</span>
                      <p>
                        Build bigger tiles and
                        chase the highest score.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.playBtn}
                    onClick={() => {
                      setShowHowToPlay(false);
                      handlePlay();
                    }}
                  >
                    <span>▶</span>
                    Play Now
                  </button>

                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={() =>
                      setShowHowToPlay(false)
                    }
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BONUS FLASH */}

          {bonusFlash !== null && (
            <div className={styles.bonusFlash}>
              {typeof bonusFlash === "number"
                ? `+${bonusFlash}`
                : bonusFlash}
            </div>
          )}
        </div>

        {/* =========================================
            POWERUPS
        ========================================= */}

        <div className={styles.powerups}>
          <button
            className={styles.powerupButton}
            type="button"
          >
            <span className={styles.powerupIcon}>
              💣
            </span>

            <span className={styles.powerupText}>
              Bomb
            </span>
          </button>

          <button
            className={styles.powerupButton}
            type="button"
          >
            <span className={styles.powerupIcon}>
              ⚡
            </span>

            <span className={styles.powerupText}>
              2× Score
            </span>
          </button>

          <button
            className={styles.powerupButton}
            type="button"
          >
            <span className={styles.powerupIcon}>
              ↩
            </span>

            <span className={styles.powerupText}>
              Undo
            </span>
          </button>
        </div>

        {/* =========================================
            HINT
        ========================================= */}

        <p className={styles.hint}>
          Swipe or use arrow keys to merge
          tiles
          <br />
          Tap 💣 to detonate a bomb
        </p>

        {/* =========================================
            GAME OVER
        ========================================= */}

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