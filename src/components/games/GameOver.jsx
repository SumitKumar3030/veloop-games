import styles from "./GameOver.module.css";

function GameOver({ score, canRevive, onRevive, onNoThanks }) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <p className={styles.title}>GAME OVER</p>
        <p className={styles.scoreLabel}>Score</p>
        <p className={styles.scoreValue}>{score}</p>

        {canRevive ? (
          <>
            <p className={styles.question}>Continue playing?</p>
            <button type="button" className={styles.reviveBtn} onClick={onRevive}>
              REVIVE
            </button>
            <button type="button" className={styles.noThanksBtn} onClick={onNoThanks}>
              No Thanks
            </button>
          </>
        ) : (
          <button type="button" className={styles.reviveBtn} onClick={onNoThanks}>
            Collect Reward
          </button>
        )}
      </div>
    </div>
  );
}

export default GameOver;