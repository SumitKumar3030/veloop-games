import { useState } from "react";
import PlayNowButton from "./PlayNowButton";
import TokenCost from "./TokenCost";
import styles from "./GameCard.module.css";

function GameCard({ game, onPlay }) {
  const { name, tagline, image, cost, currency } = game;

  const [isPressed, setIsPressed] = useState(false);

 const handleTap = () => {
  setIsPressed(true);
};

  return (
    <div
      className={`${styles.card} ${isPressed ? styles.pressed : ""}`}
      onClick={handleTap}
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