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

const HERO_TILES = [
  2,
  16,
  64,
  128,
  512,
  1024,
  2048,
];

const TARGETS = [
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
];

function MergeMasterGame({ onGameEnd }) {
  const [grid, setGrid] = useState(createInitialGrid);

  const [score, setScore] = useState(0);

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("merge-master-best");
    return saved ? Number(saved) : 0;
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);

  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] =
    useState(COUNTDOWN_SECONDS);

  const [showHowToPlay, setShowHowToPlay] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [muted, setMutedState] =
    useState(false);

  const [bombPowerups, setBombPowerups] =
    useState(1);

  const [doubleScorePowerups, setDoubleScorePowerups] =
    useState(1);

  const [undoPowerups, setUndoPowerups] =
    useState(1);

  const [doubleScoreMoves, setDoubleScoreMoves] =
    useState(0);

  const [undoAvailable, setUndoAvailable] =
    useState(false);

  const [powerupMessage, setPowerupMessage] =
    useState(null);

  const [show2048Celebration, setShow2048Celebration] =
    useState(false);

  const [reached2048, setReached2048] =
    useState(false);

  const [milestone, setMilestone] =
    useState(null);

  const [mergeEffects, setMergeEffects] =
    useState([]);

  const [floatingScores, setFloatingScores] =
    useState([]);

  const [spawnEffects, setSpawnEffects] =
    useState([]);

  const [explosionEffects, setExplosionEffects] =
    useState([]);

  const [screenShake, setScreenShake] =
    useState(false);

  const [combo, setCombo] =
    useState(0);

  const [comboVisible, setComboVisible] =
    useState(false);

  const [bonusFlash, setBonusFlash] =
    useState(null);

  const touchStartRef =
    useRef(null);

  const gridRef =
    useRef(grid);

  const gameRef =
    useRef(null);

  const comboTimerRef =
    useRef(null);

  const effectIdRef =
    useRef(0);

  const gameOverTimerRef =
    useRef(null);

  const screenShakeTimerRef =
    useRef(null);

  const effectTimersRef =
    useRef([]);

  const previousStateRef =
    useRef(null);

  const scoreRef =
    useRef(0);

  const powerupMessageTimerRef =
    useRef(null);

  /*
   * ---------------------------------------------------------
   * DERIVED GAME DATA
   * ---------------------------------------------------------
   */

  const numericTiles = grid
    .flat()
    .filter(
      (value) =>
        typeof value === "number" &&
        value > 0,
    );

  const highestTile =
    numericTiles.length > 0
      ? Math.max(...numericTiles)
      : 0;

  const currentTarget =
    highestTile || 2;

  const nextTarget =
    highestTile < 2
      ? 2
      : highestTile < 2048
        ? highestTile * 2
        : highestTile * 2;

  const progressValue =
    highestTile > 0
      ? Math.min(
          100,
          (highestTile / 2048) * 100,
        )
      : 0;

  const progressLabel =
    highestTile >= 2048
      ? "2048 MASTERED"
      : `${highestTile || 0} / 2048`;

  /*
   * ---------------------------------------------------------
   * CLEANUP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }

      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current);
      }

      if (screenShakeTimerRef.current) {
        clearTimeout(
          screenShakeTimerRef.current,
        );
      }

      if (powerupMessageTimerRef.current) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      effectTimersRef.current.forEach(
        (timer) => clearTimeout(timer),
      );

      stopBackgroundMusic();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * FULLSCREEN
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement),
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

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await gameRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen is optional.
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * SOUND
   * ---------------------------------------------------------
   */

  const handleMuteToggle = useCallback(() => {
    const nextMuted = !muted;

    setMutedState(nextMuted);
    setMuted(nextMuted);

    if (nextMuted) {
      stopBackgroundMusic();
    } else if (phase === "playing") {
      startBackgroundMusic(
        BACKGROUND_MUSIC_SRC,
        BACKGROUND_MUSIC_VOLUME,
      );
    }
  }, [muted, phase]);

  /*
   * ---------------------------------------------------------
   * TIMER HELPERS
   * ---------------------------------------------------------
   */

  const schedule = useCallback(
    (callback, delay) => {
      const timer = setTimeout(
        callback,
        delay,
      );

      effectTimersRef.current.push(timer);

      return timer;
    },
    [],
  );

  /*
   * ---------------------------------------------------------
   * EFFECT LEVEL
   * ---------------------------------------------------------
   */

  const getEffectLevel = useCallback(
    (value) => {
      if (value >= 1024) {
        return "legendary";
      }

      if (value >= 256) {
        return "epic";
      }

      if (value >= 64) {
        return "strong";
      }

      if (value >= 16) {
        return "medium";
      }

      return "small";
    },
    [],
  );

  /*
   * ---------------------------------------------------------
   * MERGE EFFECTS
   * ---------------------------------------------------------
   */

  const triggerMergeEffects = useCallback(
    (merges) => {
      if (!merges?.length) {
        return;
      }

      const newMergeEffects = merges.map(
        (merge) => ({
          id: ++effectIdRef.current,
          row: merge.row,
          col: merge.col,
          value: merge.value,
          level: getEffectLevel(
            merge.value,
          ),
        }),
      );

      const newFloatingScores =
        merges.map((merge) => ({
          id: ++effectIdRef.current,
          row: merge.row,
          col: merge.col,
          value: merge.value,
        }));

      setMergeEffects(
        (current) => [
          ...current,
          ...newMergeEffects,
        ],
      );

      setFloatingScores(
        (current) => [
          ...current,
          ...newFloatingScores,
        ],
      );

      setCombo((current) => {
        const next = current + merges.length;

        setComboVisible(next > 1);

        if (comboTimerRef.current) {
          clearTimeout(
            comboTimerRef.current,
          );
        }

        comboTimerRef.current =
          setTimeout(() => {
            setCombo(0);
            setComboVisible(false);
          }, 1800);

        return next;
      });

      const biggestMerge =
        Math.max(
          ...merges.map(
            (merge) => merge.value,
          ),
        );

      if (biggestMerge >= 64) {
        setScreenShake(true);

        if (screenShakeTimerRef.current) {
          clearTimeout(
            screenShakeTimerRef.current,
          );
        }

        screenShakeTimerRef.current =
          setTimeout(() => {
            setScreenShake(false);
          }, 260);
      }

      schedule(() => {
        setMergeEffects((current) =>
          current.filter(
            (effect) =>
              !newMergeEffects.some(
                (item) =>
                  item.id === effect.id,
              ),
          ),
        );

        setFloatingScores((current) =>
          current.filter(
            (effect) =>
              !newFloatingScores.some(
                (item) =>
                  item.id === effect.id,
              ),
          ),
        );
      }, 850);
    },
    [getEffectLevel, schedule],
  );

  /*
   * ---------------------------------------------------------
   * SPAWN EFFECT
   * ---------------------------------------------------------
   */

  const triggerSpawnEffect = useCallback(
    (nextGrid, previousGrid) => {
      const effects = [];

      for (
        let row = 0;
        row < GRID_SIZE;
        row++
      ) {
        for (
          let col = 0;
          col < GRID_SIZE;
          col++
        ) {
          if (
            previousGrid[row][col] === 0 &&
            nextGrid[row][col] !== 0
          ) {
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

      setSpawnEffects((current) => [
        ...current,
        ...effects,
      ]);

      schedule(() => {
        setSpawnEffects((current) =>
          current.filter(
            (effect) =>
              !effects.some(
                (item) =>
                  item.id === effect.id,
              ),
          ),
        );
      }, 450);
    },
    [schedule],
  );

  /*
   * ---------------------------------------------------------
   * MILESTONE
   * ---------------------------------------------------------
   */

  const getMilestone = useCallback(
    (value) => {
      if (value >= 4096) {
        return "LEGENDARY";
      }

      if (value >= 2048) {
        return "MASTER";
      }

      if (value >= 1024) {
        return "EPIC";
      }

      if (value >= 512) {
        return "ELITE";
      }

      if (value >= 256) {
        return "GREAT";
      }

      if (value >= 128) {
        return "NICE";
      }

      if (value >= 64) {
        return "GOOD";
      }

      return null;
    },
    [],
  );

  const triggerMilestone = useCallback(
    (value) => {
      const nextMilestone =
        getMilestone(value);

      if (!nextMilestone) {
        return;
      }

      setMilestone(nextMilestone);

      setPowerupMessage(
        `${value.toLocaleString()} — ${nextMilestone}`,
      );

      if (powerupMessageTimerRef.current) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      powerupMessageTimerRef.current =
        setTimeout(() => {
          setPowerupMessage(null);
        }, 1800);
    },
    [getMilestone],
  );

  /*
   * ---------------------------------------------------------
   * PLAY / RESET
   * ---------------------------------------------------------
   */

  const handlePlay = useCallback(() => {
    const freshGrid =
      createInitialGrid();

    setGrid(freshGrid);
    gridRef.current = freshGrid;

    setScore(0);
    scoreRef.current = 0;

    setGameOver(false);
    setHasUsedRevive(false);

    setBombPowerups(1);
    setDoubleScorePowerups(1);
    setUndoPowerups(1);

    setDoubleScoreMoves(0);
    setUndoAvailable(false);

    setPowerupMessage(null);

    setShow2048Celebration(false);
    setReached2048(false);

    setMilestone(null);

    setMergeEffects([]);
    setFloatingScores([]);
    setSpawnEffects([]);
    setExplosionEffects([]);

    setCombo(0);
    setComboVisible(false);
    setBonusFlash(null);
    setScreenShake(false);

    previousStateRef.current = null;

    initSound();
    setMuted(muted);

    if (!muted) {
      startBackgroundMusic(
        BACKGROUND_MUSIC_SRC,
        BACKGROUND_MUSIC_VOLUME,
      );
    }

    setCountdown(
      COUNTDOWN_SECONDS,
    );

    setPhase("counting");
  }, [muted]);

  /*
   * ---------------------------------------------------------
   * COUNTDOWN
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (phase !== "counting") {
      return;
    }

    if (countdown <= 0) {
      const timer = setTimeout(() => {
        setPhase("playing");
      }, 350);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCountdown(
        (current) => current - 1,
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  /*
   * ---------------------------------------------------------
   * HOW TO PLAY
   * ---------------------------------------------------------
   */

  const handleHowToPlay = useCallback(() => {
    setShowHowToPlay(true);
  }, []);

  const closeHowToPlay = useCallback(() => {
    setShowHowToPlay(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * MOVE
   * ---------------------------------------------------------
   */

  const handleMove = useCallback(
    (direction) => {
      if (
        phase !== "playing" ||
        gameOver ||
        show2048Celebration
      ) {
        return;
      }

      const currentGrid =
        gridRef.current;

      const result = move(
        currentGrid,
        direction,
      );

      if (!result.moved) {
        playInvalidMove();
        return;
      }

      previousStateRef.current = {
        grid: currentGrid.map(
          (row) => [...row],
        ),
        score: scoreRef.current,
        doubleScoreMoves,
      };

      setUndoAvailable(true);

      const multiplier =
        doubleScoreMoves > 0 ? 2 : 1;

      const gainedScore =
        result.scoreGained *
        multiplier;

      const nextScore =
        scoreRef.current +
        gainedScore;

      scoreRef.current =
        nextScore;

      setScore(nextScore);

      if (nextScore > bestScore) {
        setBestScore(nextScore);

        localStorage.setItem(
          "merge-master-best",
          String(nextScore),
        );
      }

      let nextGrid =
        addRandomTile(
          result.grid,
        );

      if (
        result.scoreGained >= 64 &&
        Math.random() < 0.25
      ) {
        nextGrid =
          addBombTile(nextGrid);
      }

      gridRef.current =
        nextGrid;

      setGrid(nextGrid);

      if (doubleScoreMoves > 0) {
        setDoubleScoreMoves(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      }

      if (result.merges.length > 0) {
        triggerMergeEffects(
          result.merges,
        );

        result.merges.forEach(
          (merge, index) => {
            playMerge(
              merge.value,
              index,
            );
          },
        );

        playComboBoost(
          result.merges.length,
        );

        const highestMerge =
          Math.max(
            ...result.merges.map(
              (merge) =>
                merge.value,
            ),
          );

        triggerMilestone(
          highestMerge,
        );

        if (
          highestMerge >= 2048 &&
          !reached2048
        ) {
          setReached2048(true);

          schedule(() => {
            setShow2048Celebration(
              true,
            );
          }, 500);
        }
      } else {
        playSpawn();
      }

      triggerSpawnEffect(
        nextGrid,
        result.grid,
      );

      if (isGameOver(nextGrid)) {
        gameOverTimerRef.current =
          schedule(() => {
            setGameOver(true);
            playGameOver();
          }, 250);
      }
    },
    [
      phase,
      gameOver,
      show2048Celebration,
      doubleScoreMoves,
      bestScore,
      reached2048,
      triggerMergeEffects,
      triggerMilestone,
      triggerSpawnEffect,
      schedule,
    ],
  );

  /*
   * ---------------------------------------------------------
   * KEYBOARD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };

      const direction =
        directions[event.key];

      if (!direction) {
        return;
      }

      event.preventDefault();

      handleMove(direction);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [handleMove]);

  /*
   * ---------------------------------------------------------
   * TOUCH
   * ---------------------------------------------------------
   */

  const handleTouchStart = useCallback(
    (event) => {
      const touch =
        event.touches[0];

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (
        !touchStartRef.current
      ) {
        return;
      }

      const touch =
        event.changedTouches[0];

      const deltaX =
        touch.clientX -
        touchStartRef.current.x;

      const deltaY =
        touch.clientY -
        touchStartRef.current.y;

      touchStartRef.current = null;

      if (
        Math.max(
          Math.abs(deltaX),
          Math.abs(deltaY),
        ) < SWIPE_THRESHOLD
      ) {
        return;
      }

      if (
        Math.abs(deltaX) >
        Math.abs(deltaY)
      ) {
        handleMove(
          deltaX > 0
            ? "right"
            : "left",
        );
      } else {
        handleMove(
          deltaY > 0
            ? "down"
            : "up",
        );
      }
    },
    [handleMove],
  );

  /*
   * ---------------------------------------------------------
   * CELL / BOMB
   * ---------------------------------------------------------
   */

  const handleCellClick =
    useCallback(
      (index) => {
        if (
          phase !== "playing" ||
          gameOver
        ) {
          return;
        }

        const row = Math.floor(
          index / GRID_SIZE,
        );

        const col =
          index % GRID_SIZE;

        if (
          gridRef.current[row][col] !==
          BOMB
        ) {
          return;
        }

        const result =
          detonateBomb(
            gridRef.current,
            row,
            col,
          );

        setGrid(result.grid);
        gridRef.current =
          result.grid;

        setScore(
          (current) => {
            const next =
              current +
              result.bonus;

            scoreRef.current =
              next;

            if (
              next > bestScore
            ) {
              setBestScore(next);

              localStorage.setItem(
                "merge-master-best",
                String(next),
              );
            }

            return next;
          },
        );

        setExplosionEffects([
          {
            id: ++effectIdRef.current,
            row,
            col,
          },
        ]);

        setBonusFlash(
          result.bonus,
        );

        playBombExplosion();
        playBonus();

        setBombPowerups(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );

        schedule(() => {
          setExplosionEffects([]);
          setBonusFlash(null);
        }, 800);
      },
      [
        phase,
        gameOver,
        bestScore,
        schedule,
      ],
    );

  /*
   * ---------------------------------------------------------
   * POWER-UP: BOMB
   * ---------------------------------------------------------
   */

  const handleBombPowerup =
    useCallback(() => {
      if (
        bombPowerups <= 0 ||
        phase !== "playing"
      ) {
        return;
      }

      const emptyCells = [];

      for (
        let row = 0;
        row < GRID_SIZE;
        row++
      ) {
        for (
          let col = 0;
          col < GRID_SIZE;
          col++
        ) {
          if (
            gridRef.current[row][col] ===
            0
          ) {
            emptyCells.push([
              row,
              col,
            ]);
          }
        }
      }

      if (!emptyCells.length) {
        setPowerupMessage(
          "No empty tile available",
        );
        return;
      }

      const [
        row,
        col,
      ] =
        emptyCells[
          Math.floor(
            Math.random() *
              emptyCells.length,
          )
        ];

      const nextGrid =
        gridRef.current.map(
          (line) => [...line],
        );

      nextGrid[row][col] =
        BOMB;

      gridRef.current =
        nextGrid;

      setGrid(nextGrid);

      setBombPowerups(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      );

      setPowerupMessage(
        "Bomb placed — tap it!",
      );

      if (
        powerupMessageTimerRef.current
      ) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      powerupMessageTimerRef.current =
        setTimeout(() => {
          setPowerupMessage(null);
        }, 1800);
    }, [
      bombPowerups,
      phase,
    ]);

  /*
   * ---------------------------------------------------------
   * POWER-UP: DOUBLE SCORE
   * ---------------------------------------------------------
   */

  const handleDoubleScore =
    useCallback(() => {
      if (
        doubleScorePowerups <= 0 ||
        doubleScoreMoves > 0 ||
        phase !== "playing"
      ) {
        return;
      }

      setDoubleScorePowerups(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      );

      setDoubleScoreMoves(3);

      setPowerupMessage(
        "2× SCORE active for 3 moves!",
      );

      if (
        powerupMessageTimerRef.current
      ) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      powerupMessageTimerRef.current =
        setTimeout(() => {
          setPowerupMessage(null);
        }, 1800);
    }, [
      doubleScorePowerups,
      doubleScoreMoves,
      phase,
    ]);

  /*
   * ---------------------------------------------------------
   * POWER-UP: UNDO
   * ---------------------------------------------------------
   */

  const handleUndo =
    useCallback(() => {
      if (
        !undoAvailable ||
        undoPowerups <= 0 ||
        !previousStateRef.current ||
        phase !== "playing"
      ) {
        return;
      }

      const previous =
        previousStateRef.current;

      const restoredGrid =
        previous.grid.map(
          (row) => [...row],
        );

      gridRef.current =
        restoredGrid;

      scoreRef.current =
        previous.score;

      setGrid(restoredGrid);
      setScore(previous.score);

      setDoubleScoreMoves(
        previous.doubleScoreMoves,
      );

      setUndoAvailable(false);

      setUndoPowerups(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      );

      setPowerupMessage(
        "Previous move restored",
      );

      playRevive();

      if (
        powerupMessageTimerRef.current
      ) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      powerupMessageTimerRef.current =
        setTimeout(() => {
          setPowerupMessage(null);
        }, 1500);
    }, [
      undoAvailable,
      undoPowerups,
      phase,
    ]);

  /*
   * ---------------------------------------------------------
   * REVIVE
   * ---------------------------------------------------------
   */

  const handleRevive =
    useCallback(() => {
      if (hasUsedRevive) {
        return;
      }

      const revived =
        reviveGrid(
          gridRef.current,
          4,
        );

      gridRef.current =
        revived;

      setGrid(revived);
      setGameOver(false);
      setHasUsedRevive(true);

      playRevive();

      setPowerupMessage(
        "REVIVED — keep merging!",
      );

      if (
        powerupMessageTimerRef.current
      ) {
        clearTimeout(
          powerupMessageTimerRef.current,
        );
      }

      powerupMessageTimerRef.current =
        setTimeout(() => {
          setPowerupMessage(null);
        }, 1800);
    }, [hasUsedRevive]);

  /*
   * ---------------------------------------------------------
   * GAME END
   * ---------------------------------------------------------
   */

  const handleNoThanks =
    useCallback(() => {
      stopBackgroundMusic();

      const reward =
        calculateReward(score);

      onGameEnd?.(reward);
    }, [score, onGameEnd]);

  /*
   * ---------------------------------------------------------
   * 2048
   * ---------------------------------------------------------
   */

  const handle2048Continue =
    useCallback(() => {
      setShow2048Celebration(false);
    }, []);

  const handle2048Home =
    useCallback(() => {
      stopBackgroundMusic();

      const reward =
        calculateReward(score);

      onGameEnd?.(reward);
    }, [score, onGameEnd]);

  /*
   * ---------------------------------------------------------
   * NAVIGATION
   * ---------------------------------------------------------
   */

  const handleBack =
    useCallback(() => {
      stopBackgroundMusic();

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      onGameEnd?.(0);
    }, [onGameEnd]);

  const handleRedeem =
    useCallback(() => {
      stopBackgroundMusic();
      window.location.href =
        "/redeem";
    }, []);

  /*
   * ---------------------------------------------------------
   * TILE CLASS
   * ---------------------------------------------------------
   */

  const tileClass =
    useCallback((value) => {
      if (value === BOMB) {
        return `${styles.tile} ${styles.bomb}`;
      }

      if (value === 0) {
        return `${styles.tile} ${styles.tileEmpty}`;
      }

      const exactClass =
        styles[`tile${value}`];

      if (exactClass) {
        return `${styles.tile} ${exactClass}`;
      }

      return `${styles.tile} ${styles.tile2048}`;
    }, []);

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div
      ref={gameRef}
      className={`${styles.gameContainer} ${
        screenShake
          ? styles.screenShake
          : ""
      } ${
        show2048Celebration
          ? styles.celebrationMode
          : ""
      }`}
    >
      <div className={styles.game}>
        {/* =================================================
            TOP NAV
        ================================================= */}

        <header className={styles.pageNav}>
          <div className={styles.navLeft}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              aria-label="Back to game home"
            >
              <span aria-hidden="true">
                ←
              </span>

              <span>Back</span>
            </button>
          </div>

          <div className={styles.navCenter}>
            <span className={styles.navTitle}>
              MERGE MASTER
            </span>
          </div>

          <div className={styles.navRight}>
            <div
              className={styles.coinBalance}
              aria-label="Game coin balance"
            >
              <span aria-hidden="true">
                🪙
              </span>

              <span>GAME COINS</span>
            </div>

            <button
              type="button"
              className={styles.redeemButton}
              onClick={handleRedeem}
            >
              Redeem
            </button>

            <button
              type="button"
              className={
                styles.fullscreenButton
              }
              onClick={
                handleMuteToggle
              }
              aria-label={
                muted
                  ? "Unmute game"
                  : "Mute game"
              }
            >
              <span>
                {muted
                  ? "🔇"
                  : "🔊"}
              </span>
            </button>

            {document.fullscreenEnabled && (
              <button
                type="button"
                className={
                  styles.fullscreenButton
                }
                onClick={
                  toggleFullscreen
                }
                aria-label={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Enter fullscreen"
                }
              >
                <span>
                  {isFullscreen
                    ? "⤢"
                    : "⛶"}
                </span>

                <span
                  className={
                    styles.fullscreenLabel
                  }
                >
                  {isFullscreen
                    ? "Exit"
                    : "Fullscreen"}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* =================================================
            HERO BANNER
        ================================================= */}

        <section
          className={styles.heroBanner}
          aria-labelledby="merge-master-title"
        >
          <div
            className={
              styles.heroFloatingLayer
            }
            aria-hidden="true"
          >
            {HERO_TILES.map(
              (value, index) => (
                <span
                  key={value}
                  className={`${styles.floatingTile} ${
                    styles[
                      `tile${value}`
                    ] || styles.tile2048
                  }`}
                  style={{
                    "--float-index":
                      index,
                  }}
                >
                  {value}
                </span>
              ),
            )}
          </div>

          <div
            className={
              styles.heroContent
            }
          >
            <p
              className={
                styles.heroEyebrow
              }
            >
              VELOOP ARCADE
            </p>

            <h1
              id="merge-master-title"
              className={
                styles.heroTitle
              }
            >
              MERGE MASTER
            </h1>

            <p
              className={
                styles.heroSubtitle
              }
            >
              Merge. Match. Master
              the board.
            </p>

            <div
              className={
                styles.heroMeta
              }
            >
              <span>
                5 × 5 BOARD
              </span>

              <span>
                •
              </span>

              <span>
                REACH 2048
              </span>

              <span>
                •
              </span>

              <span>
                EARN REWARDS
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            GAME AREA
        ================================================= */}

        <main
          className={styles.gameLayout}
        >
          {/* ===============================================
              TARGET PANEL
          =============================================== */}

          <aside
            className={
              styles.targetPanel
            }
          >
            <div
              className={
                styles.panelEyebrow
              }
            >
              CURRENT TARGET
            </div>

            <h2
              className={
                styles.panelTitle
              }
            >
              Master the
              next level
            </h2>

            <div
              className={
                styles.targetTile
              }
            >
              <span
                className={
                  styles.targetTileLabel
                }
              >
                HIGHEST TILE
              </span>

              <strong
                className={`${styles.tile} ${
                  styles[
                    `tile${Math.min(
                      highestTile,
                      2048,
                    )}`
                  ] ||
                  styles.tile2048
                }`}
              >
                {highestTile || 0}
              </strong>
            </div>

            <div
              className={
                styles.targetMeta
              }
            >
              <span>
                NEXT TARGET
              </span>

              <strong>
                {nextTarget.toLocaleString()}
              </strong>
            </div>

            <div
              className={
                styles.progressSection
              }
            >
              <div
                className={
                  styles.progressHeader
                }
              >
                <span>
                  PROGRESS
                </span>

                <strong>
                  {progressLabel}
                </strong>
              </div>

              <div
                className={
                  styles.progressTrack
                }
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={
                  Math.round(
                    progressValue,
                  )
                }
              >
                <span
                  className={
                    styles.progressFill
                  }
                  style={{
                    width: `${progressValue}%`,
                  }}
                />
              </div>

              <p
                className={
                  styles.progressCaption
                }
              >
                {highestTile >= 2048
                  ? "2048 mastered. Keep pushing."
                  : "Build your way to the legendary tile."}
              </p>
            </div>

            {milestone && (
              <div
                className={
                  styles.milestoneBadge
                }
              >
                <span>
                  ✦
                </span>

                <div>
                  <small>
                    LATEST MILESTONE
                  </small>

                  <strong>
                    {milestone}
                  </strong>
                </div>
              </div>
            )}

            <div
              className={
                styles.targetStats
              }
            >
              <div>
                <span>
                  SCORE
                </span>

                <strong>
                  {score.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>
                  BEST
                </span>

                <strong>
                  {bestScore.toLocaleString()}
                </strong>
              </div>
            </div>
          </aside>

          {/* ===============================================
              CENTER BOARD
          =============================================== */}

          <section
            className={
              styles.gameCenter
            }
          >
            <div
              className={
                styles.scoreContainer
              }
            >
              <div
                className={
                  styles.scoreBox
                }
              >
                <span
                  className={
                    styles.scoreLabel
                  }
                >
                  SCORE
                </span>

                <strong
                  className={
                    styles.scoreValue
                  }
                >
                  {score.toLocaleString()}
                </strong>
              </div>

              <div
                className={
                  styles.scoreBox
                }
              >
                <span
                  className={
                    styles.scoreLabel
                  }
                >
                  BEST
                </span>

                <strong
                  className={
                    styles.scoreValue
                  }
                >
                  {bestScore.toLocaleString()}
                </strong>
              </div>
            </div>

            {comboVisible &&
              combo > 1 && (
                <div
                  className={`${styles.combo} ${
                    combo >= 4
                      ? styles.comboEpic
                      : ""
                  }`}
                >
                  <span>
                    ✦
                  </span>

                  COMBO ×{combo}

                  <span>
                    ✦
                  </span>
                </div>
              )}

            <div
              className={
                styles.boardWrap
              }
            >
              <div
                className={
                  styles.board
                }
                onTouchStart={
                  handleTouchStart
                }
                onTouchEnd={
                  handleTouchEnd
                }
              >
                {grid
                  .flat()
                  .map(
                    (
                      value,
                      index,
                    ) => {
                      const row =
                        Math.floor(
                          index /
                            GRID_SIZE,
                        );

                      const col =
                        index %
                        GRID_SIZE;

                      const isSpawned =
                        spawnEffects.some(
                          (effect) =>
                            effect.row ===
                              row &&
                            effect.col ===
                              col,
                        );

                      return (
                        <button
                          key={`${row}-${col}`}
                          type="button"
                          className={tileClass(
                            value,
                          )}
                          onClick={() =>
                            handleCellClick(
                              index,
                            )
                          }
                          aria-label={
                            value ===
                            BOMB
                              ? `Bomb at row ${
                                  row + 1
                                }, column ${
                                  col + 1
                                }`
                              : value
                                ? `Tile ${value}`
                                : "Empty tile"
                          }
                        >
                          {value ===
                          BOMB
                            ? "💣"
                            : value !==
                                0
                              ? value
                              : ""}

                          {isSpawned && (
                            <span
                              className={
                                styles.spawnFlash
                              }
                            />
                          )}
                        </button>
                      );
                    },
                  )}

                {/* MERGE EFFECTS */}

                {mergeEffects.map(
                  (effect) => {
                    const positionStyle =
                      {
                        "--row":
                          effect.row,
                        "--col":
                          effect.col,
                      };

                    return (
                      <div
                        key={
                          effect.id
                        }
                        className={`${styles.mergeEffect} ${
                          styles[
                            effect.level
                          ]
                        }`}
                        style={
                          positionStyle
                        }
                      >
                        <span
                          className={
                            styles.mergeRing
                          }
                        />

                        <span
                          className={
                            styles.mergeBurst
                          }
                        />

                        <span
                          className={
                            styles.mergeCore
                          }
                        />

                        {Array.from(
                          {
                            length: 6,
                          },
                        ).map(
                          (
                            _,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className={
                                styles.mergeSpark
                              }
                            />
                          ),
                        )}
                      </div>
                    );
                  },
                )}

                {/* FLOATING SCORE */}

                {floatingScores.map(
                  (effect) => {
                    const positionStyle =
                      {
                        "--row":
                          effect.row,
                        "--col":
                          effect.col,
                      };

                    return (
                      <div
                        key={
                          effect.id
                        }
                        className={
                          styles.floatingScore
                        }
                        style={
                          positionStyle
                        }
                      >
                        +{effect.value}
                      </div>
                    );
                  },
                )}

                {/* EXPLOSION */}

                {explosionEffects.map(
                  (effect) => {
                    const positionStyle =
                      {
                        "--row":
                          effect.row,
                        "--col":
                          effect.col,
                      };

                    return (
                      <div
                        key={
                          effect.id
                        }
                        className={
                          styles.explosionEffect
                        }
                        style={
                          positionStyle
                        }
                      >
                        <span
                          className={
                            styles.explosionRing
                          }
                        />

                        <span
                          className={
                            styles.explosionCore
                          }
                        />

                        {Array.from(
                          {
                            length: 4,
                          },
                        ).map(
                          (
                            _,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className={
                                styles.explosionParticle
                              }
                            />
                          ),
                        )}
                      </div>
                    );
                  },
                )}

                {/* =========================================
                    2048 CELEBRATION
                ========================================= */}

                {show2048Celebration && (
                  <div
                    className={
                      styles.celebrationOverlay
                    }
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="merge-master-achievement"
                  >
                    <div
                      className={
                        styles.celebrationGlow
                      }
                    />

                    <div
                      className={
                        styles.celebrationParticles
                      }
                    >
                      {Array.from({
                        length: 18,
                      }).map(
                        (_, index) => (
                          <span
                            key={
                              index
                            }
                            className={
                              styles.celebrationParticle
                            }
                            style={{
                              "--particle-index":
                                index,
                            }}
                          />
                        ),
                      )}
                    </div>

                    <div
                      className={
                        styles.celebrationContent
                      }
                    >
                      <div
                        className={
                          styles.celebrationCrown
                        }
                      >
                        👑
                      </div>

                      <p
                        className={
                          styles.celebrationEyebrow
                        }
                      >
                        MILESTONE REACHED
                      </p>

                      <h2
                        id="merge-master-achievement"
                        className={
                          styles.celebrationTitle
                        }
                      >
                        2048
                      </h2>

                      <p
                        className={
                          styles.celebrationTitleGlow
                        }
                      >
                        MASTERED
                      </p>

                      <p
                        className={
                          styles.celebrationText
                        }
                      >
                        You reached
                        the legendary
                        tile.
                      </p>

                      <div
                        className={
                          styles.celebrationActions
                        }
                      >
                        <button
                          type="button"
                          className={
                            styles.continueButton
                          }
                          onClick={
                            handle2048Continue
                          }
                        >
                          Continue
                          Playing
                        </button>

                        <button
                          type="button"
                          className={
                            styles.homeButton
                          }
                          onClick={
                            handle2048Home
                          }
                        >
                          Back to
                          Home
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================
                    START / COUNTDOWN
                ========================================= */}

                {phase !==
                  "playing" &&
                  !showHowToPlay &&
                  !show2048Celebration && (
                    <div
                      className={
                        styles.overlay
                      }
                    >
                      {phase ===
                        "idle" && (
                        <>
                          <div
                            className={
                              styles.overlayLogo
                            }
                          >
                            ✦
                          </div>

                          <h2
                            className={
                              styles.overlayTitle
                            }
                          >
                            READY TO
                            MERGE?
                          </h2>

                          <p
                            className={
                              styles.overlayText
                            }
                          >
                            Build
                            powerful
                            combinations,
                            chase 2048
                            and earn
                            rewards.
                          </p>

                          <div
                            className={
                              styles.overlayButtons
                            }
                          >
                            <button
                              type="button"
                              className={
                                styles.playBtn
                              }
                              onClick={
                                handlePlay
                              }
                            >
                              <span>
                                ▶
                              </span>

                              Play
                              Now
                            </button>

                            <button
                              type="button"
                              className={
                                styles.secondaryButton
                              }
                              onClick={
                                handleHowToPlay
                              }
                            >
                              How to
                              Play
                            </button>
                          </div>
                        </>
                      )}

                      {phase ===
                        "counting" && (
                        <div
                          className={
                            styles.countdown
                          }
                          key={
                            countdown
                          }
                        >
                          {countdown ===
                          0
                            ? "GO!"
                            : countdown}
                        </div>
                      )}
                    </div>
                  )}

                {/* =========================================
                    HOW TO PLAY OVERLAY
                ========================================= */}

                {showHowToPlay && (
                  <div
                    className={
                      styles.overlay
                    }
                  >
                    <div
                      className={
                        styles.howToPlay
                      }
                    >
                      <h2
                        className={
                          styles.overlayTitle
                        }
                      >
                        How to Play
                      </h2>

                      <div
                        className={
                          styles.instructions
                        }
                      >
                        <div>
                          <span>
                            👆
                          </span>

                          <p>
                            Swipe in
                            any
                            direction
                            to move
                            tiles.
                          </p>
                        </div>

                        <div>
                          <span>
                            ⌨️
                          </span>

                          <p>
                            Use arrow
                            keys on
                            desktop.
                          </p>
                        </div>

                        <div>
                          <span>
                            🔢
                          </span>

                          <p>
                            Match two
                            identical
                            numbers
                            to merge
                            them.
                          </p>
                        </div>

                        <div>
                          <span>
                            💣
                          </span>

                          <p>
                            Tap a bomb
                            to clear
                            tiles and
                            earn a
                            bonus.
                          </p>
                        </div>

                        <div>
                          <span>
                            🏆
                          </span>

                          <p>
                            Build
                            bigger
                            tiles and
                            chase the
                            highest
                            score.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.playBtn
                        }
                        onClick={() => {
                          closeHowToPlay();
                          handlePlay();
                        }}
                      >
                        <span>
                          ▶
                        </span>

                        Play Now
                      </button>

                      <button
                        type="button"
                        className={
                          styles.closeButton
                        }
                        onClick={
                          closeHowToPlay
                        }
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BONUS */}

            {bonusFlash !==
              null && (
              <div
                className={
                  styles.bonusFlash
                }
              >
                {typeof bonusFlash ===
                "number"
                  ? `+${bonusFlash}`
                  : bonusFlash}
              </div>
            )}

            {/* 2× STATUS */}

            {phase ===
              "playing" &&
              !gameOver &&
              doubleScoreMoves >
                0 && (
                <div
                  className={
                    styles.multiplierStatus
                  }
                >
                  <span>
                    ⚡
                  </span>

                  <span>
                    2× SCORE ACTIVE
                  </span>

                  <strong>
                    {doubleScoreMoves}
                  </strong>
                </div>
              )}

            {/* POWER-UPS */}

            {phase ===
              "playing" &&
              !gameOver && (
              <div
                className={
                  styles.powerups
                }
              >
                <button
                  type="button"
                  className={`${styles.powerupButton} ${
                    bombPowerups <= 0
                      ? styles.powerupDisabled
                      : ""
                  }`}
                  onClick={
                    handleBombPowerup
                  }
                  disabled={
                    bombPowerups <= 0
                  }
                  aria-label={`Use bomb power-up. ${bombPowerups} remaining.`}
                >
                  <span
                    className={
                      styles.powerupIcon
                    }
                  >
                    💣
                  </span>

                  <span
                    className={
                      styles.powerupInfo
                    }
                  >
                    <span
                      className={
                        styles.powerupText
                      }
                    >
                      BOMB
                    </span>

                    <span
                      className={
                        styles.powerupCount
                      }
                    >
                      {bombPowerups}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.powerupButton} ${
                    doubleScorePowerups <=
                      0 ||
                    doubleScoreMoves >
                      0
                      ? styles.powerupDisabled
                      : ""
                  }`}
                  onClick={
                    handleDoubleScore
                  }
                  disabled={
                    doubleScorePowerups <=
                      0 ||
                    doubleScoreMoves >
                      0
                  }
                  aria-label={`Use double score power-up. ${doubleScorePowerups} remaining.`}
                >
                  <span
                    className={
                      styles.powerupIcon
                    }
                  >
                    ⚡
                  </span>

                  <span
                    className={
                      styles.powerupInfo
                    }
                  >
                    <span
                      className={
                        styles.powerupText
                      }
                    >
                      2× SCORE
                    </span>

                    <span
                      className={
                        styles.powerupCount
                      }
                    >
                      {
                        doubleScorePowerups
                      }
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.powerupButton} ${
                    !undoAvailable ||
                    undoPowerups <= 0
                      ? styles.powerupDisabled
                      : ""
                  }`}
                  onClick={
                    handleUndo
                  }
                  disabled={
                    !undoAvailable ||
                    undoPowerups <= 0
                  }
                  aria-label={`Undo last move. ${undoPowerups} remaining.`}
                >
                  <span
                    className={
                      styles.powerupIcon
                    }
                  >
                    ↩
                  </span>

                  <span
                    className={
                      styles.powerupInfo
                    }
                  >
                    <span
                      className={
                        styles.powerupText
                      }
                    >
                      UNDO
                    </span>

                    <span
                      className={
                        styles.powerupCount
                      }
                    >
                      {undoPowerups}
                    </span>
                  </span>
                </button>
              </div>
            )}

            <p
              className={
                styles.hint
              }
            >
              Swipe or use arrow
              keys to merge tiles
              <br />
              Tap 💣 to detonate a
              bomb
            </p>
          </section>

          {/* ===============================================
              PERMANENT HOW TO PLAY
          =============================================== */}

          <aside
            className={
              styles.howToPlayPanel
            }
          >
            <div
              className={
                styles.panelEyebrow
              }
            >
              HOW TO PLAY
            </div>

            <h2
              className={
                styles.panelTitle
              }
            >
              Think ahead.
              Merge smart.
            </h2>

            <div
              className={
                styles.howToPlayIllustration
              }
              aria-hidden="true"
            >
              <span
                className={
                  styles.illustrationTile
                }
              >
                2
              </span>

              <span
                className={
                  styles.illustrationOperator
                }
              >
                +
              </span>

              <span
                className={
                  styles.illustrationTile
                }
              >
                2
              </span>

              <span
                className={
                  styles.illustrationOperator
                }
              >
                =
              </span>

              <span
                className={`${styles.illustrationTile} ${styles.illustrationTarget}`}
              >
                4
              </span>
            </div>

            <div
              className={
                styles.instructionList
              }
            >
              <div
                className={
                  styles.instructionItem
                }
              >
                <span
                  className={
                    styles.instructionIcon
                  }
                >
                  01
                </span>

                <div
                  className={
                    styles.instructionText
                  }
                >
                  <strong>
                    Move
                  </strong>

                  <span>
                    Swipe or use
                    arrow keys.
                  </span>
                </div>
              </div>

              <div
                className={
                  styles.instructionItem
                }
              >
                <span
                  className={
                    styles.instructionIcon
                  }
                >
                  02
                </span>

                <div
                  className={
                    styles.instructionText
                  }
                >
                  <strong>
                    Merge
                  </strong>

                  <span>
                    Match identical
                    numbers.
                  </span>
                </div>
              </div>

              <div
                className={
                  styles.instructionItem
                }
              >
                <span
                  className={
                    styles.instructionIcon
                  }
                >
                  03
                </span>

                <div
                  className={
                    styles.instructionText
                  }
                >
                  <strong>
                    Power Up
                  </strong>

                  <span>
                    Bomb, 2× score
                    and undo.
                  </span>
                </div>
              </div>

              <div
                className={
                  styles.instructionItem
                }
              >
                <span
                  className={
                    styles.instructionIcon
                  }
                >
                  04
                </span>

                <div
                  className={
                    styles.instructionText
                  }
                >
                  <strong>
                    Master
                  </strong>

                  <span>
                    Reach 2048 and
                    keep going.
                  </span>
                </div>
              </div>
            </div>

            <div
              className={
                styles.nextTarget
              }
            >
              <span>
                NEXT TARGET
              </span>

              <strong>
                {nextTarget.toLocaleString()}
              </strong>
            </div>
          </aside>
        </main>

        {/* =================================================
            DETAILS
        ================================================= */}

        <section
          className={
            styles.gameDetails
          }
        >
          <div
            className={
              styles.detailCard
            }
          >
            <span>
              ENTRY
            </span>

            <strong>
              20 TOKENS
            </strong>

            <p>
              Start every run
              with a 20 Token
              entry.
            </p>
          </div>

          <div
            className={
              styles.detailCard
            }
          >
            <span>
              REWARD
            </span>

            <strong>
              SCORE BASED
            </strong>

            <p>
              Higher scores
              unlock bigger
              rewards.
            </p>
          </div>

          <div
            className={
              styles.detailCard
            }
          >
            <span>
              MILESTONE
            </span>

            <strong>
              2048+
            </strong>

            <p>
              Reach the
              legendary tile
              and continue.
            </p>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer
          className={
            styles.gameFooter
          }
        >
          <div
            className={
              styles.footerBrand
            }
          >
            <strong>
              VELOOP
            </strong>

            <span>
              PLAY • EARN • REDEEM
            </span>
          </div>

          <div
            className={
              styles.footerLinks
            }
          >
            <span>
              MERGE MASTER
            </span>

            <span>
              •
            </span>

            <span>
              5 × 5
            </span>

            <span>
              •
            </span>

            <span>
              2048
            </span>
          </div>
        </footer>

        {/* =================================================
            POWER-UP / MILESTONE MESSAGE
        ================================================= */}

        {powerupMessage && (
          <div
            className={
              styles.powerupMessage
            }
            aria-live="polite"
          >
            {powerupMessage}
          </div>
        )}

        {/* =================================================
            GAME OVER
        ================================================= */}

        {gameOver && (
          <GameOver
            score={score}
            canRevive={!hasUsedRevive}
            onRevive={
              handleRevive
            }
            onNoThanks={
              handleNoThanks
            }
          />
        )}
      </div>
    </div>
  );
}

export default MergeMasterGame;