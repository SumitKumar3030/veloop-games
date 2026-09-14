import styles from "./GameCard.module.css";

function TokenCost({ cost = 20, currency = "Tokens" }) {
  return (
    <div className={styles.tokenCost}>
      <img
        src="/assets/icons/token-icon.png"
        alt=""
        aria-hidden="true"
        className={styles.tokenIcon}
      />
      <span className={styles.tokenText}>
        {cost} {currency}
      </span>
    </div>
  );
}

export default TokenCost;