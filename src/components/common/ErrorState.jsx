import styles from "./ErrorState.module.css";

function ErrorState({
  theme = "dark",
  title = "Something went wrong.",
  message = "We couldn't load this content.",
  onRetry,
  onBack,
  backLabel = "Back to Games",
}) {
  return (
    <div className={`${styles.wrapper} ${theme === "light" ? styles.light : styles.dark}`}>
      <span className={styles.icon} aria-hidden="true">⚠️</span>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {onRetry && (
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            Try Again
          </button>
        )}
        {onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            {backLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;