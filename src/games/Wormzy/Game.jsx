import { useState, useEffect, useRef, useCallback } from "react";
import {
  BOARD_SIZE,
  TICK_MS,
  COUNTDOWN_SECONDS,
  createInitialSnake,
  randomEmptyCell,
  createPortals,
  tick,
  isOpposite,
  reviveSnake,
  calculateReward,
} from "./logic";
import GameOver from "../../components/games/GameOver";
import styles from "./Game.module.css";

function WormzyGame({ onGameEnd }) {
  const [snake, setSnake] = useState(createInitialSnake);
  const [food, setFood] = useState(() => randomEmptyCell(createInitialSnake()));
  const [portals, setPortals] = useState(() =>
    createPortals(createInitialSnake(), food)
  );
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle -> counting -> playing
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const directionRef = useRef("right");
  const nextDirectionRef = useRef("right"); // buffered — prevents double-turns within one tick
  const touchStartRef = useRef(null);

  const setDirection = useCallback((newDir) => {
    if (isOpposite(newDir, directionRef.current)) return; // can't reverse into self
    nextDirectionRef.current = newDir;
  }, []);

  const handlePlay = () => {
    setCountdown(COUNTDOWN_SECONDS);
    setPhase("counting");
  };

  // 3-second countdown after Play is tapped
  useEffect(() => {
    if (phase !== "counting") return;

    const t = setTimeout(() => {
      if (countdown === 0) {
        setPhase("playing");
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      const keyMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        setDirection(keyMap[e.key]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setDirection]);

  // Game loop
  useEffect(() => {
    if (gameOver || phase !== "playing") return;

    const interval = setInterval(() => {
      directionRef.current = nextDirectionRef.current;

      setSnake((prevSnake) => {
        setFood((prevFood) => {
          const result = tick(prevSnake, directionRef.current, prevFood, portals);

          if (result.crashed) {
            setGameOver(true);
            return prevFood;
          }

          if (result.ate) {
            setScore((s) => s + 10);
            setSnake(result.snake);
            const nextFood = randomEmptyCell(result.snake, portals);
            setPortals(createPortals(result.snake, nextFood));
            return nextFood;
          }

          setSnake(result.snake);
          return prevFood;
        });
        return prevSnake; // actual snake update happens inside setFood callback above
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [gameOver, phase, portals]);

  // Touch swipe
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return;

    if (absDx > absDy) {
      setDirection(dx > 0 ? "right" : "left");
    } else {
      setDirection(dy > 0 ? "down" : "up");
    }
    touchStartRef.current = null;
  };

  const handleRevive = () => {
    const fresh = createInitialSnake();
    const freshFood = randomEmptyCell(fresh);
    setSnake(fresh);
    setFood(freshFood);
    setPortals(createPortals(fresh, freshFood));
    directionRef.current = "right";
    nextDirectionRef.current = "right";
    setGameOver(false);
    setHasUsedRevive(true);
  };

  const handleNoThanks = () => {
    const reward = calculateReward(score);
    onGameEnd(reward);
  };

  const snakeSet = new Set(snake.map((s) => `${s.x},${s.y}`));
  const headKey = `${snake[0].x},${snake[0].y}`;
  const portalKeys = portals.map((p) => `${p.x},${p.y}`);

  const cells = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x},${y}`;
      let cls = styles.cell;
      if (key === headKey) cls = `${styles.cell} ${styles.snakeHead}`;
      else if (snakeSet.has(key)) cls = `${styles.cell} ${styles.snakeBody}`;
      else if (food.x === x && food.y === y) cls = `${styles.cell} ${styles.food}`;
      else if (portalKeys.includes(key)) cls = `${styles.cell} ${styles.portal}`;
      cells.push(<div key={key} className={cls} />);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.hud}>
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>Score</div>
          <div className={styles.scoreValue}>{score}</div>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {cells}
        </div>

        {phase !== "playing" && (
          <div className={styles.overlay}>
            {phase === "idle" && (
              <button className={styles.playBtn} onClick={handlePlay}>
                Play Now
              </button>
            )}
            {phase === "counting" && (
              <div className={styles.countdown} key={countdown}>
                {countdown === 0 ? "GO!" : countdown}
              </div>
            )}
          </div>
        )}
      </div>

      <p className={styles.hint}>Arrow keys or swipe to steer Wormzy · hit a portal to warp</p>

      {/* On-screen D-pad — helps on mobile where swipe-per-tick can feel fiddly */}
      <div className={styles.dpad}>
        <div />
        <button className={styles.dpadBtn} onClick={() => setDirection("up")}>↑</button>
        <div />
        <button className={styles.dpadBtn} onClick={() => setDirection("left")}>←</button>
        <div />
        <button className={styles.dpadBtn} onClick={() => setDirection("right")}>→</button>
        <div />
        <button className={styles.dpadBtn} onClick={() => setDirection("down")}>↓</button>
        <div />
      </div>

      {gameOver && (
        <GameOver
          score={score}
          canRevive={!hasUsedRevive}
          onRevive={handleRevive}
          onNoThanks={handleNoThanks}
        />
      )}
    </div>
  );
}

export default WormzyGame;