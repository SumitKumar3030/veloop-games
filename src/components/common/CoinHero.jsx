import { useEffect, useRef } from "react";
import styles from "./CoinHero.module.css";

const THICKNESS = 14;
const LAYERS = 28;
const ANGLE = Math.PI * 0.56;

function Emblem() {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="#161827"
      strokeWidth="5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M50 8 82 24 88 56 50 92 12 56 18 24Z" />
      <path d="M50 28 68 38 64 62 50 74 36 62 32 38Z" />
      <path d="M50 28V74M32 38 68 62M68 38 32 62" strokeWidth="3" />
    </svg>
  );
}

export default function CoinHero({
  title = "PLAY. EARN. REDEEM.",
  subtitle = "Play games, earn Game Coins, and turn your wins into rewards.",
  onPlay,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dx = Math.cos(ANGLE);
    const dy = Math.sin(ANGLE);

    let width = 0;
    let height = 0;
    let streaks = [];
    let dots = [];
    let rafId;

    const createStreak = (fresh = false) => ({
      x: Math.random() * (width + 300),
      y: fresh ? Math.random() * height : -200,
      len: 60 + Math.random() * 220,
      speed: 9 + Math.random() * 16,
      lineWidth: 1 + Math.random() * 2.5,
      alpha: 0.12 + Math.random() * 0.42,

      // VELOOP gold instead of purple
      color:
        Math.random() < 0.2
          ? "255,255,255"
          : "240,185,11",
    });

    const initialize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = canvas.clientWidth;
      height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      streaks = Array.from(
        { length: 45 },
        () => createStreak(true)
      );

      dots = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        time: Math.random() * 6,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Speed streaks
      for (const streak of streaks) {
        const tailX = streak.x - dx * streak.len;
        const tailY = streak.y - dy * streak.len;

        const gradient = ctx.createLinearGradient(
          tailX,
          tailY,
          streak.x,
          streak.y
        );

        gradient.addColorStop(
          0,
          `rgba(${streak.color},0)`
        );

        gradient.addColorStop(
          1,
          `rgba(${streak.color},${streak.alpha})`
        );

        ctx.strokeStyle = gradient;
        ctx.lineWidth = streak.lineWidth;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(streak.x, streak.y);
        ctx.stroke();

        if (!reduceMotion) {
          streak.x += dx * streak.speed;
          streak.y += dy * streak.speed;
        }

        if (
          streak.y - dy * streak.len > height + 50 ||
          streak.x < -400
        ) {
          Object.assign(streak, createStreak(false));
        }
      }

      // Small particles
      for (const dot of dots) {
        if (!reduceMotion) {
          dot.time += 0.03;
        }

        const opacity =
          0.22 + 0.35 * Math.sin(dot.time);

        ctx.fillStyle = `rgba(255,255,255,${opacity})`;

        ctx.beginPath();
        ctx.arc(
          dot.x,
          dot.y,
          dot.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(animate);
      }
    };

    initialize();
    animate();

    window.addEventListener("resize", initialize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", initialize);
    };
  }, []);

  return (
    <section className={styles.coinHero}>
      <canvas
        ref={canvasRef}
        className={styles.fx}
        aria-hidden="true"
      />

      {/* Background glow */}
      <div
        className={styles.glow}
        aria-hidden="true"
      />

      {/* Coin */}
      <div className={styles.scene}>
        <div className={styles.tilt}>
          <div className={styles.coin}>
            {Array.from(
              { length: LAYERS },
              (_, index) => (
                <div
                  key={index}
                  className={styles.layer}
                  style={{
                    transform: `translateZ(${
                      -THICKNESS +
                      (2 * THICKNESS * index) /
                        (LAYERS - 1)
                    }px)`,
                  }}
                />
              )
            )}

            {/* Front */}
            <div
              className={styles.face}
              style={{
                transform: `translateZ(${THICKNESS}px)`,
              }}
            >
              <Emblem />
            </div>

            {/* Back */}
            <div
              className={styles.face}
              style={{
                transform: `rotateY(180deg) translateZ(${THICKNESS}px)`,
              }}
            >
              <Emblem />
            </div>
          </div>
        </div>
      </div>

      {/* Coin shadow */}
      <div
        className={styles.shadow}
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          <span />
          VELOOP REWARDS
          <span />
        </div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

        <button
          type="button"
          className={styles.button}
          onClick={onPlay}
        >
          <span>PLAY NOW</span>
          <span className={styles.buttonArrow}>→</span>
        </button>
      </div>
    </section>
  );
}