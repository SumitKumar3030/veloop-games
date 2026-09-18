import { useState } from "react";
import PlayNowButton from "./PlayNowButton";
import TokenCost from "./TokenCost";
import styles from "./GameCard.module.css";

function GameCard({ game, onPlay }) {
  const { name, tagline, image, cost, currency } = game;

  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    setIsPressed(true);
  };

  const handlePointerUp = () => {
    setTimeout(() => {
      setIsPressed(false);
    }, 450);
  };

  return (
    <div
      className={`${styles.card} ${isPressed ? styles.pressed : ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
    >
      <div className={styles.imageWrap}>
        <img
          src={image}
          alt={`${name} — ${tagline}`}
          className={styles.image}
          loading="lazy"
        />
      </div>

      <div className={styles.footer}>
        <TokenCost cost={cost} currency={currency} />
        <PlayNowButton onClick={() => onPlay(game)} />
      </div>
    </div>
  );
}

export default GameCard;