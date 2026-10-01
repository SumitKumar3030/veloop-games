import { useEffect, useRef } from "react";
import styles from "./CoinHero.module.css";
import coinImg from "/assets/icons/game-coin-icon.png";

const ANGLE = Math.PI * 0.515; // streaks fall almost straight down

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

    const createStreak = (fresh = false) => {
      const big = Math.random() < 0.18; // a few long, bright, thick streaks
      return {
        x: Math.random() * (width + 100) - 50,
        y: fresh ? Math.random() * height : -300,
        len: big ? 260 + Math.random() * 300 : 80 + Math.random() * 220,
        speed: big ? 38 + Math.random() * 16 : 18 + Math.random() * 18,
        lineWidth: big ? 2.5 + Math.random() * 2 : 0.8 + Math.random() * 1.8,
        alpha: big ? 0.45 + Math.random() * 0.3 : 0.12 + Math.random() * 0.38,
        color: Math.random() < 0.25 ? "255,244,200" : "240,185,11",
      };
    };

    const initialize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      streaks = Array.from({ length: 70 }, () => createStreak(true));
      dots = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        time: Math.random() * 6,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const s of streaks) {
        const tailX = s.x - dx * s.len;
        const tailY = s.y - dy * s.len;

        const g = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        g.addColorStop(0, `rgba(${s.color},0)`);
        g.addColorStop(1, `rgba(${s.color},${s.alpha})`);

        ctx.strokeStyle = g;
        ctx.lineWidth = s.lineWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        if (!reduceMotion) {
          s.x += dx * s.speed;
          s.y += dy * s.speed;
        }

        if (s.y - dy * s.len > height + 50 || s.x < -400 || s.x > width + 400) {
          Object.assign(s, createStreak(false));
        }
      }

      ctx.globalCompositeOperation = "source-over";

      for (const d of dots) {
        if (!reduceMotion) d.time += 0.03;
        const opacity = 0.22 + 0.35 * Math.sin(d.time);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(opacity, 0)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) rafId = requestAnimationFrame(animate);
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
      <canvas ref={canvasRef} className={styles.fx} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      {/* Coin flies upward: enter -> lift pulses -> shake -> small sway */}
      <div className={styles.scene}>
        <div className={styles.trail} aria-hidden="true" />
        <div className={styles.float}>
          <div className={styles.shake}>
            <div className={styles.sway} style={{ "--coin": `url(${coinImg})` }}>
              <img
                src={coinImg}
                alt="Veloop Game Coin"
                className={styles.coinImg}
                draggable="false"
              />
              <span className={styles.sheen} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          <span />
          VELOOP REWARDS
          <span />
        </div>

        <h1>{title}</h1>
        <p>{subtitle}</p>

        <button type="button" className={styles.button} onClick={onPlay}>
          <span>PLAY NOW</span>
          <span className={styles.buttonArrow}>→</span>
        </button>
      </div>
    </section>
  );
}