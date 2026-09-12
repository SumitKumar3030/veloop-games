import { useState } from "react";
import styles from "./PlayNowButton.module.css";

function PlayNowButton({ onClick, label = "Play Now" }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick();
  };

  return (
    <button
      type="button"
      className={styles.playBtn}
      onClick={handleClick}
      aria-label={`${label} — starts the game`}
    >
      <span>{label}</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className={styles.ripple}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}

export default PlayNowButton;