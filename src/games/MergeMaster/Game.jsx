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
  // =========================================================
  // GAME STATE
  // =========================================================

  const [grid, setGrid] = useState(createInitialGrid);

  const [score, setScore] = useState(0);

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("merge-master-best");
    return saved ? Number(saved) : 0;
  });

  const [gameOver, setGameOver] = useState(false);

  const [hasUsedRevive, setHasUsedRevive] = useState(false);

  /*
    idle
      Game has not started.

    counting
      3 → 2 → 1 → GO.

    playing
      Normal gameplay.
  */
  const [phase, setPhase] = useState("idle");

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [muted, setMutedState] = useState(false);

  // =========================================================
  // POWER-UP STATE
  // =========================================================

  const [bombPowerups, setBombPowerups] = useState(1);

  const [doubleScorePowerups, setDoubleScorePowerups] = useState(1);

  const [undoPowerups, setUndoPowerups] = useState(1);

  const [doubleScoreMoves, setDoubleScoreMoves] = useState(0);

  const [undoAvailable, setUndoAvailable] = useState(false);

  const [powerupMessage, setPowerupMessage] = useState(null);

  // =========================================================
  // MILESTONE / CELEBRATION STATE
  // =========================================================

  const [show2048Celebration, setShow2048Celebration] =
    useState(false);

  const [reached2048, setReached2048] = useState(false);

  const [milestone, setMilestone] = useState(null);

  // =========================================================
  // VISUAL EFFECT STATE
  // =========================================================

  const [mergeEffects, setMergeEffects] = useState([]);

  const [floatingScores, setFloatingScores] = useState([]);

  const [spawnEffects, setSpawnEffects] = useState([]);

  const [explosionEffects, setExplosionEffects] = useState([]);

  const [screenShake, setScreenShake] = useState(false);

  const [combo, setCombo] = useState(0);

  const [comboVisible, setComboVisible] = useState(false);

  const [bonusFlash, setBonusFlash] = useState(null);

  // =========================================================
  // REFS
  // =========================================================

  const touchStartRef = useRef(null);

  const gridRef = useRef(grid);

  const gameRef = useRef(null);

  const comboTimerRef = useRef(null);

  const effectIdRef = useRef(0);

  const gameOverTimerRef = useRef(null);

  const screenShakeTimerRef = useRef(null);

  const effectTimersRef = useRef([]);

  const previousStateRef = useRef(null);

  const scoreRef = useRef(0);

  const powerupMessageTimerRef = useRef(null);

  // =========================================================
  // KEEP REFS SYNCHRONIZED
  // =========================================================

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // =========================================================
  // BEST SCORE
  // =========================================================

  useEffect(() => {
    if (score <= bestScore) {
      return;
    }

    setBestScore(score);

    localStorage.setItem(
      "merge-master-best",
      String(score),
    );
  }, [score, bestScore]);

  // =========================================================
  // TIMER HELPER
  // =========================================================

  const schedule = useCallback((callback, delay) => {
    const timer = setTimeout(callback, delay);

    effectTimersRef.current.push(timer);

    return timer;
  }, []);

  // =========================================================
  // POWER-UP MESSAGE
  // =========================================================

  const showPowerupMessage = useCallback((message) => {
    setPowerupMessage(message);

    if (powerupMessageTimerRef.current) {
      clearTimeout(powerupMessageTimerRef.current);
    }

    powerupMessageTimerRef.current = setTimeout(() => {
      setPowerupMessage(null);
      powerupMessageTimerRef.current = null;
    }, 1200);
  }, []);

  // =========================================================
  // COUNTDOWN
  // =========================================================

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

    return () => {
      clearTimeout(timer);
    };
  }, [phase, countdown]);

  // =========================================================
  // FULLSCREEN STATE
  // =========================================================

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

  // =========================================================
  // AUDIO CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // =========================================================
  // GENERAL CLEANUP
  // =========================================================

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

      if (powerupMessageTimerRef.current) {
        clearTimeout(powerupMessageTimerRef.current);
      }

      effectTimersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });

      effectTimersRef.current = [];
    };
  }, []);

  // =========================================================
  // FULLSCREEN
  // =========================================================

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

  // =========================================================
  // SOUND
  // =========================================================

  const handleMuteToggle = useCallback(() => {
    const nextMuted = !muted;

    setMutedState(nextMuted);

    setMuted(nextMuted);
  }, [muted]);

  // =========================================================
  // START / RESTART GAME
  // =========================================================

  const handlePlay = useCallback(() => {
    // -----------------------------------------------
    // Clear pending timers
    // -----------------------------------------------

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

    if (powerupMessageTimerRef.current) {
      clearTimeout(powerupMessageTimerRef.current);
      powerupMessageTimerRef.current = null;
    }

    // -----------------------------------------------
    // Unlock / start audio
    // -----------------------------------------------

    initSound();

    startBackgroundMusic(
      BACKGROUND_MUSIC_SRC,
      BACKGROUND_MUSIC_VOLUME,
    );

    // -----------------------------------------------
    // Create fresh board
    // -----------------------------------------------

    const newGrid = createInitialGrid();

    gridRef.current = newGrid;

    setGrid(newGrid);

    // -----------------------------------------------
    // Reset score
    // -----------------------------------------------

    scoreRef.current = 0;

    setScore(0);

    // -----------------------------------------------
    // Reset game state
    // -----------------------------------------------

    setGameOver(false);

    setHasUsedRevive(false);

    setCountdown(COUNTDOWN_SECONDS);

    setPhase("counting");

    // -----------------------------------------------
    // Reset visual effects
    // -----------------------------------------------

    setMergeEffects([]);

    setFloatingScores([]);

    setSpawnEffects([]);

    setExplosionEffects([]);

    setBonusFlash(null);

    setCombo(0);

    setComboVisible(false);

    setScreenShake(false);

    // -----------------------------------------------
    // Reset power-ups
    // -----------------------------------------------

    setBombPowerups(1);

    setDoubleScorePowerups(1);

    setUndoPowerups(1);

    setDoubleScoreMoves(0);

    setUndoAvailable(false);

    previousStateRef.current = null;

    setPowerupMessage(null);

    // -----------------------------------------------
    // Reset milestone / celebration
    // -----------------------------------------------

    setShow2048Celebration(false);

    setReached2048(false);

    setMilestone(null);
  }, []);

  // =========================================================
  // HOW TO PLAY
  // =========================================================

  const handleHowToPlay = useCallback(() => {
    setShowHowToPlay(true);
  }, []);

  const closeHowToPlay = useCallback(() => {
    setShowHowToPlay(false);
  }, []);

  // =========================================================
  // EFFECT LEVEL
  // =========================================================

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

  // =========================================================
  // CREATE MERGE EFFECT
  // =========================================================

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

  // =========================================================
  // CREATE FLOATING SCORE
  // =========================================================

  const createFloatingScore = useCallback((merge) => {
    return {
      id: ++effectIdRef.current,
      row: merge.row,
      col: merge.col,
      value: merge.value,
    };
  }, []);

  // =========================================================
  // MERGE EFFECTS
  // =========================================================

  const triggerMergeEffects = useCallback(
    (merges) => {
      if (!merges?.length) {
        return;
      }

      const newMergeEffects = merges.map(
        createMergeEffect,
      );

      const newFloatingScores = merges.map(
        createFloatingScore,
      );

      setMergeEffects(newMergeEffects);

      setFloatingScores(newFloatingScores);

      // -----------------------------------------------
      // Combo
      // -----------------------------------------------

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

      // -----------------------------------------------
      // Screen shake
      // -----------------------------------------------

      const biggestMerge = Math.max(
        ...merges.map((merge) => merge.value),
      );

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

      // -----------------------------------------------
      // Clear effects
      // -----------------------------------------------

      schedule(() => {
        setMergeEffects([]);
      }, 650);

      schedule(() => {
        setFloatingScores([]);
      }, 850);
    },
    [
      createMergeEffect,
      createFloatingScore,
      schedule,
    ],
  );

  // =========================================================
  // SPAWN EFFECT
  // =========================================================

  const triggerSpawnEffect = useCallback(
    (nextGrid, previousGrid) => {
      const effects = [];

      for (let row = 0; row < nextGrid.length; row++) {
        for (
          let col = 0;
          col < nextGrid[row].length;
          col++
        ) {
          const oldValue = previousGrid[row][col];

          const newValue = nextGrid[row][col];

          if (
            oldValue === 0 &&
            newValue !== 0 &&
            newValue !== BOMB
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

      setSpawnEffects(effects);

      schedule(() => {
        setSpawnEffects([]);
      }, 350);
    },
    [schedule],
  );

  // =========================================================
  // MILESTONE
  // =========================================================

  const getMilestone = useCallback((value) => {
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
  }, []);

  const triggerMilestone = useCallback(
    (value) => {
      const label = getMilestone(value);

      if (!label) {
        return;
      }

      setMilestone({
        value,
        label,
      });

      /*
        Small feedback message for milestones below 2048.
        The 2048 milestone gets its dedicated celebration.
      */
      if (value < 2048) {
        showPowerupMessage(
          `${label} — ${value}`,
        );
      }

      schedule(
        () => {
          setMilestone(null);
        },
        value >= 1024 ? 1800 : 900,
      );
    },
    [
      getMilestone,
      schedule,
      showPowerupMessage,
    ],
  );

  // =========================================================
  // BOMB POWER-UP
  // =========================================================

  const handleBombPowerup = useCallback(() => {
    if (
      phase !== "playing" ||
      gameOver ||
      show2048Celebration ||
      bombPowerups <= 0
    ) {
      return;
    }

    const currentGrid = gridRef.current;

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
        if (currentGrid[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }

    if (emptyCells.length === 0) {
      showPowerupMessage("BOARD FULL");
      return;
    }

    // -----------------------------------------------
    // Save state for Undo
    // -----------------------------------------------

    previousStateRef.current = {
      grid: currentGrid.map((row) => [...row]),
      score: scoreRef.current,
      doubleScoreMoves,
    };

    setUndoAvailable(true);

    // -----------------------------------------------
    // Place bomb
    // -----------------------------------------------

    const [row, col] =
      emptyCells[
        Math.floor(
          Math.random() * emptyCells.length,
        )
      ];

    const nextGrid = currentGrid.map((gridRow) => [
      ...gridRow,
    ]);

    nextGrid[row][col] = BOMB;

    gridRef.current = nextGrid;

    setGrid(nextGrid);

    setBombPowerups((current) =>
      Math.max(0, current - 1),
    );

    playSpawn();

    showPowerupMessage("💣 BOMB READY");

    // -----------------------------------------------
    // Small impact feedback
    // -----------------------------------------------

    setScreenShake(true);

    if (screenShakeTimerRef.current) {
      clearTimeout(screenShakeTimerRef.current);
    }

    screenShakeTimerRef.current = schedule(() => {
      setScreenShake(false);
    }, 250);
  }, [
    phase,
    gameOver,
    show2048Celebration,
    bombPowerups,
    doubleScoreMoves,
    showPowerupMessage,
    schedule,
  ]);

  // =========================================================
  // DOUBLE SCORE POWER-UP
  // =========================================================

  const handleDoubleScore = useCallback(() => {
    if (
      phase !== "playing" ||
      gameOver ||
      show2048Celebration ||
      doubleScorePowerups <= 0 ||
      doubleScoreMoves > 0
    ) {
      return;
    }

    setDoubleScorePowerups((current) =>
      Math.max(0, current - 1),
    );

    setDoubleScoreMoves(3);

    showPowerupMessage(
      "⚡ 2× SCORE — 3 MOVES",
    );
  }, [
    phase,
    gameOver,
    show2048Celebration,
    doubleScorePowerups,
    doubleScoreMoves,
    showPowerupMessage,
  ]);

  // =========================================================
  // UNDO
  // =========================================================

  const handleUndo = useCallback(() => {
    if (
      phase !== "playing" ||
      gameOver ||
      show2048Celebration ||
      undoPowerups <= 0 ||
      !previousStateRef.current
    ) {
      return;
    }

    // -----------------------------------------------
    // Cancel pending Game Over
    // -----------------------------------------------

    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);

      gameOverTimerRef.current = null;
    }

    // -----------------------------------------------
    // Restore previous state
    // -----------------------------------------------

    const previous = previousStateRef.current;

    const restoredGrid = previous.grid.map(
      (row) => [...row],
    );

    gridRef.current = restoredGrid;

    setGrid(restoredGrid);

    setScore(previous.score);

    scoreRef.current = previous.score;

    setDoubleScoreMoves(
      previous.doubleScoreMoves,
    );

    // -----------------------------------------------
    // Consume undo
    // -----------------------------------------------

    setUndoPowerups((current) =>
      Math.max(0, current - 1),
    );

    previousStateRef.current = null;

    setUndoAvailable(false);

    setGameOver(false);

    // -----------------------------------------------
    // Clear visual effects
    // -----------------------------------------------

    setMergeEffects([]);

    setFloatingScores([]);

    setSpawnEffects([]);

    setExplosionEffects([]);

    setBonusFlash(null);

    setScreenShake(false);

    setCombo(0);

    setComboVisible(false);

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);

      comboTimerRef.current = null;
    }

    showPowerupMessage(
      "↩ MOVE UNDONE",
    );
  }, [
    phase,
    gameOver,
    show2048Celebration,
    undoPowerups,
    showPowerupMessage,
  ]);

  // =========================================================
  // MOVE
  // =========================================================

  const handleMove = useCallback(
    (direction) => {
      if (
        phase !== "playing" ||
        gameOver ||
        show2048Celebration
      ) {
        return;
      }

      const previousGrid = gridRef.current;

      const result = move(
        previousGrid,
        direction,
      );

      // -----------------------------------------------
      // Invalid move
      // -----------------------------------------------

      if (!result.moved) {
        playInvalidMove();
        return;
      }

      // -----------------------------------------------
      // Save state for Undo
      // -----------------------------------------------

      previousStateRef.current = {
        grid: previousGrid.map((row) => [...row]),
        score: scoreRef.current,
        doubleScoreMoves,
      };

      setUndoAvailable(true);

      // -----------------------------------------------
      // Calculate score
      // -----------------------------------------------

      const multiplier =
        doubleScoreMoves > 0 ? 2 : 1;

      const gainedScore =
        result.scoreGained * multiplier;

      const nextScore =
        scoreRef.current + gainedScore;

      scoreRef.current = nextScore;

      setScore(nextScore);

      // -----------------------------------------------
      // Add normal random tile
      // -----------------------------------------------

      let nextGrid = addRandomTile(
        result.grid,
      );

      // -----------------------------------------------
      // Existing random bomb mechanic
      // -----------------------------------------------

      if (
        result.scoreGained >= 64 &&
        Math.random() < 0.25
      ) {
        nextGrid = addBombTile(nextGrid);
      }

      // -----------------------------------------------
      // Update board
      // -----------------------------------------------

      gridRef.current = nextGrid;

      setGrid(nextGrid);

      // -----------------------------------------------
      // Consume one 2× move
      // -----------------------------------------------

      if (doubleScoreMoves > 0) {
        setDoubleScoreMoves((current) =>
          Math.max(0, current - 1),
        );
      }

      // -----------------------------------------------
      // Merge effects
      // -----------------------------------------------

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

        // -----------------------------------------
        // Highest newly created tile
        // -----------------------------------------

        const highestMerge = Math.max(
          ...result.merges.map(
            (merge) => merge.value,
          ),
        );

        triggerMilestone(
          highestMerge,
        );

        // -----------------------------------------
        // 2048 celebration
        // -----------------------------------------

        if (
          highestMerge >= 2048 &&
          !reached2048
        ) {
          setReached2048(true);

          schedule(() => {
            setShow2048Celebration(true);
          }, 500);
        }
      } else {
        playSpawn();
      }

      // -----------------------------------------------
      // Spawn VFX
      // -----------------------------------------------

      triggerSpawnEffect(
        nextGrid,
        result.grid,
      );

      // -----------------------------------------------
      // Game Over
      // -----------------------------------------------

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
      reached2048,
      triggerMergeEffects,
      triggerSpawnEffect,
      triggerMilestone,
      schedule,
    ],
  );

  // =========================================================
  // KEYBOARD CONTROLS
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyMap = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };

      const direction =
        keyMap[event.key];

      if (!direction) {
        return;
      }

      if (phase !== "playing") {
        return;
      }

      if (gameOver || show2048Celebration) {
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
  }, [
    handleMove,
    phase,
    gameOver,
    show2048Celebration,
  ]);

  // =========================================================
  // TOUCH START
  // =========================================================

  const handleTouchStart = useCallback(
    (event) => {
      if (
        phase !== "playing" ||
        gameOver ||
        show2048Celebration
      ) {
        return;
      }

      const touch =
        event.touches[0];

      if (!touch) {
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    [
      phase,
      gameOver,
      show2048Celebration,
    ],
  );

  // =========================================================
  // TOUCH END
  // =========================================================

  const handleTouchEnd = useCallback(
    (event) => {
      if (
        !touchStartRef.current ||
        show2048Celebration
      ) {
        return;
      }

      const touch =
        event.changedTouches[0];

      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const dx =
        touch.clientX -
        touchStartRef.current.x;

      const dy =
        touch.clientY -
        touchStartRef.current.y;

      const absDx = Math.abs(dx);

      const absDy = Math.abs(dy);

      touchStartRef.current = null;

      if (
        Math.max(absDx, absDy) <
        SWIPE_THRESHOLD
      ) {
        return;
      }

      if (absDx > absDy) {
        handleMove(
          dx > 0
            ? "right"
            : "left",
        );
      } else {
        handleMove(
          dy > 0
            ? "down"
            : "up",
        );
      }
    },
    [
      handleMove,
      show2048Celebration,
    ],
  );

  // =========================================================
  // BOMB TILE CLICK
  // =========================================================

  const handleCellClick = useCallback(
    (index) => {
      if (
        phase !== "playing" ||
        gameOver ||
        show2048Celebration
      ) {
        return;
      }

      const row =
        Math.floor(
          index / GRID_SIZE,
        );

      const col =
        index % GRID_SIZE;

      // -----------------------------------------------
      // Only bomb tiles are clickable
      // -----------------------------------------------

      if (
        gridRef.current[row]?.[col] !==
        BOMB
      ) {
        return;
      }

      const currentGrid =
        gridRef.current;

      // -----------------------------------------------
      // Save state for Undo
      // -----------------------------------------------

      previousStateRef.current = {
        grid: currentGrid.map(
          (gridRow) => [...gridRow],
        ),
        score: scoreRef.current,
        doubleScoreMoves,
      };

      setUndoAvailable(true);

      // -----------------------------------------------
      // Detonate
      // -----------------------------------------------

      const result =
        detonateBomb(
          currentGrid,
          row,
          col,
        );

      const explosionId =
        ++effectIdRef.current;

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

      // -----------------------------------------------
      // Update board
      // -----------------------------------------------

      gridRef.current =
        result.grid;

      setGrid(result.grid);

      // -----------------------------------------------
      // Apply 2× score if active
      // -----------------------------------------------

      const multiplier =
        doubleScoreMoves > 0
          ? 2
          : 1;

      const actualBonus =
        result.bonus *
        multiplier;

      const nextScore =
        scoreRef.current +
        actualBonus;

      scoreRef.current =
        nextScore;

      setScore(nextScore);

      // -----------------------------------------------
      // Consume one 2× move
      // -----------------------------------------------

      if (doubleScoreMoves > 0) {
        setDoubleScoreMoves(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      }

      // -----------------------------------------------
      // Bonus sound
      // -----------------------------------------------

      schedule(() => {
        playBonus();
      }, 250);

      // -----------------------------------------------
      // Bonus UI
      // -----------------------------------------------

      setBonusFlash(
        actualBonus,
      );

      schedule(() => {
        setBonusFlash(null);
      }, 900);

      // -----------------------------------------------
      // Screen shake
      // -----------------------------------------------

      setScreenShake(true);

      if (
        screenShakeTimerRef.current
      ) {
        clearTimeout(
          screenShakeTimerRef.current,
        );
      }

      screenShakeTimerRef.current =
        schedule(() => {
          setScreenShake(false);
        }, 400);

      // -----------------------------------------------
      // Bomb may create enough space that
      // game-over is no longer possible.
      // -----------------------------------------------

      if (
        isGameOver(result.grid)
      ) {
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
      schedule,
    ],
  );

  // =========================================================
  // REVIVE
  // =========================================================

  const handleRevive = useCallback(() => {
    if (hasUsedRevive) {
      return;
    }

    // -----------------------------------------------
    // Cancel any pending Game Over timer
    // -----------------------------------------------

    if (gameOverTimerRef.current) {
      clearTimeout(
        gameOverTimerRef.current,
      );

      gameOverTimerRef.current = null;
    }

    playRevive();

    // -----------------------------------------------
    // Revive board
    // -----------------------------------------------

    const revivedGrid =
      reviveGrid(
        gridRef.current,
      );

    gridRef.current =
      revivedGrid;

    setGrid(revivedGrid);

    setGameOver(false);

    setHasUsedRevive(true);

    // -----------------------------------------------
    // Prevent undoing into Game Over state
    // -----------------------------------------------

    previousStateRef.current =
      null;

    setUndoAvailable(false);

    // -----------------------------------------------
    // Feedback
    // -----------------------------------------------

    setBonusFlash("REVIVED");

    schedule(() => {
      setBonusFlash(null);
    }, 900);
  }, [
    hasUsedRevive,
    schedule,
  ]);

  // =========================================================
  // 2048 → BACK HOME
  // =========================================================

  const handle2048Home = useCallback(() => {
    const reward =
      calculateReward(score);

    setShow2048Celebration(false);

    stopBackgroundMusic();

    onGameEnd(reward);
  }, [
    score,
    onGameEnd,
  ]);

  // =========================================================
  // 2048 → CONTINUE
  // =========================================================

  const handle2048Continue =
    useCallback(() => {
      setShow2048Celebration(false);

      setMilestone(null);

      showPowerupMessage(
        "🔥 MASTERED 2048",
      );
    }, [
      showPowerupMessage,
    ]);

  // =========================================================
  // GAME END
  // =========================================================

  const handleNoThanks =
    useCallback(() => {
      stopBackgroundMusic();

      const reward =
        calculateReward(score);

      onGameEnd(reward);
    }, [
      score,
      onGameEnd,
    ]);

  // =========================================================
  // TILE CLASS
  // =========================================================

  const tileClass = useCallback(
    (value) => {
      if (value === BOMB) {
        return `${styles.tile} ${styles.bomb}`;
      }

      if (!value) {
        return styles.tile;
      }

      const valueClass =
        styles[`tile${value}`];

      return `${styles.tile} ${
        valueClass || ""
      }`;
    },
    [],
  );

  // =========================================================
  // RENDER
  // =========================================================

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
            HEADER
        ================================================= */}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              MERGE MASTER!
            </h1>

            <p className={styles.subtitle}>
              Merge. Explode. Master.
            </p>
          </div>

          <div
            className={
              styles.headerActions
            }
          >
            {/* SOUND */}

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
                  ? "Unmute sound"
                  : "Mute sound"
              }
              title={
                muted
                  ? "Unmute"
                  : "Mute"
              }
            >
              <span aria-hidden="true">
                {muted
                  ? "🔇"
                  : "🔊"}
              </span>
            </button>

            {/* FULLSCREEN */}

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
                title={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Fullscreen"
                }
              >
                <span aria-hidden="true">
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
        </div>

        {/* =================================================
            SCORE
        ================================================= */}

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
            <div
              className={
                styles.scoreLabel
              }
            >
              SCORE
            </div>

            <div
              className={
                styles.scoreValue
              }
            >
              {score.toLocaleString()}
            </div>
          </div>

          <div
            className={
              styles.scoreBox
            }
          >
            <div
              className={
                styles.scoreLabel
              }
            >
              BEST
            </div>

            <div
              className={
                styles.scoreValue
              }
            >
              {bestScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* =================================================
            COMBO
        ================================================= */}

        {comboVisible &&
          combo > 1 && (
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

        {/* =================================================
            BOARD
        ================================================= */}

        <div
          className={
            styles.boardWrap
          }
        >
          <div
            className={styles.board}
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={
              handleTouchEnd
            }
          >
            {/* ============================================
                TILES
            ============================================ */}

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
                    <div
                      key={`${row}-${col}`}
                      className={tileClass(
                        value,
                      )}
                      onClick={() =>
                        handleCellClick(
                          index,
                        )
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
                    </div>
                  );
                },
              )}

            {/* ============================================
                MERGE EFFECTS
            ============================================ */}

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

            {/* ============================================
                FLOATING SCORES
            ============================================ */}

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
                    +
                    {
                      effect.value
                    }
                  </div>
                );
              },
            )}

            {/* ============================================
                BOMB EXPLOSION
            ============================================ */}

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

            {/* ============================================
                2048 CELEBRATION
            ============================================ */}

            {show2048Celebration && (
              <div
                className={
                  styles.celebrationOverlay
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="merge-master-achievement"
              >
                {/* RGB / ENERGY GLOW */}

                <div
                  className={
                    styles.celebrationGlow
                  }
                />

                {/* PARTICLES */}

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

                {/* CONTENT */}

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
                    You reached the
                    legendary tile.
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
                      Continue Playing
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
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================
                START / COUNTDOWN
            ============================================ */}

            {phase !== "playing" &&
              !showHowToPlay && (
                <div
                  className={
                    styles.overlay
                  }
                >
                  {/* IDLE */}

                  {phase ===
                    "idle" && (
                    <>
                      <div
                        className={
                          styles.overlayLogo
                        }
                      >
                        🔥
                      </div>

                      <h2
                        className={
                          styles.overlayTitle
                        }
                      >
                        MERGE MASTER
                      </h2>

                      <p
                        className={
                          styles.overlayText
                        }
                      >
                        Match tiles,
                        create
                        combos and
                        reach 2048.
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

                          Play Now
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
                          How to Play
                        </button>
                      </div>
                    </>
                  )}

                  {/* COUNTDOWN */}

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

            {/* ============================================
                HOW TO PLAY
            ============================================ */}

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
                        Swipe in any
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
                        numbers to
                        merge them.
                      </p>
                    </div>

                    <div>
                      <span>
                        💣
                      </span>

                      <p>
                        Tap a bomb
                        to clear
                        nearby
                        tiles.
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

          {/* =============================================
              BONUS FLASH
          ============================================= */}

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
        </div>

        {/* =================================================
            2× SCORE STATUS
        ================================================= */}

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

        {/* =================================================
            POWER-UPS
        ================================================= */}

        {phase ===
          "playing" &&
          !gameOver && (
            <div
              className={
                styles.powerups
              }
            >
              {/* BOMB */}

              <button
                type="button"
                className={`${styles.powerupButton} ${
                  bombPowerups <=
                  0
                    ? styles.powerupDisabled
                    : ""
                }`}
                onClick={
                  handleBombPowerup
                }
                disabled={
                  bombPowerups <=
                  0
                }
                aria-label={`Use bomb power-up. ${bombPowerups} remaining.`}
                title="Place a bomb on an empty tile"
              >
                <span
                  className={
                    styles.powerupIcon
                  }
                  aria-hidden="true"
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
                    {
                      bombPowerups
                    }
                  </span>
                </span>
              </button>

              {/* DOUBLE SCORE */}

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
                title="Double score for the next 3 moves"
              >
                <span
                  className={
                    styles.powerupIcon
                  }
                  aria-hidden="true"
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

              {/* UNDO */}

              <button
                type="button"
                className={`${styles.powerupButton} ${
                  !undoAvailable ||
                  undoPowerups <=
                    0
                    ? styles.powerupDisabled
                    : ""
                }`}
                onClick={
                  handleUndo
                }
                disabled={
                  !undoAvailable ||
                  undoPowerups <=
                    0
                }
                aria-label={`Undo last move. ${undoPowerups} remaining.`}
                title="Undo the previous move"
              >
                <span
                  className={
                    styles.powerupIcon
                  }
                  aria-hidden="true"
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
                    {
                      undoPowerups
                    }
                  </span>
                </span>
              </button>
            </div>
          )}

        {/* =================================================
            GAME HINT
        ================================================= */}

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
            canRevive={
              !hasUsedRevive
            }
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