import styles from "./GameLoader.module.css";

function GameLoader({ theme = "dark", title = "Loading Games...", subtitle = "Preparing your next reward challenge..." }) {
  return (
    <div className={`${styles.wrapper} ${theme === "light" ? styles.light : styles.dark}`}>
      <div className={styles.spinner} aria-hidden="true">
        <span className={styles.icon}>🎮</span>
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}

export default GameLoader;