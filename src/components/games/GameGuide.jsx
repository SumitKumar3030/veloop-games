import styles from "./GameGuide.module.css";

function GameGuide({ guide, onClose }) {
  if (!guide) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className={styles.modal}>
        <h2 id="guide-title" className={styles.title}>
          {guide.title}
        </h2>
        <ul className={styles.steps}>
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
        <button type="button" className={styles.gotItBtn} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default GameGuide;