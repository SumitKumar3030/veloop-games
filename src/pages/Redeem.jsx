import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";
import BottomNav from "../components/common/BottomNav";
import styles from "./Redeem.module.css";

const REDEMPTION_OPTIONS = [
  { id: "ve", label: "VEs", icon: "/assets/icons/ve-icon.png", coinsRequired: 100, rewardAmount: 10 },
  { id: "sve", label: "SVEs", icon: "/assets/icons/sve-icon.png", coinsRequired: 150, rewardAmount: 10 },
  { id: "gems", label: "Gems", icon: "/assets/icons/gems-icon.png", coinsRequired: 80, rewardAmount: 5 },
  { id: "tokens", label: "Tokens", icon: "/assets/icons/token-icon.png", coinsRequired: 50, rewardAmount: 20 },
  { id: "spins", label: "Spins", icon: "/assets/icons/spin-icon.png", coinsRequired: 120, rewardAmount: 1 },
];

const GAME_COIN_ICON = "/assets/icons/game-coin-icon.png";

function Redeem() {
  const { gameCoinBalance, hasEnoughGameCoins, redeemGameCoins } = useGameCoins();
  const { addTokens } = useTokens();

  const [confirmOption, setConfirmOption] = useState(null);
  const [insufficientOption, setInsufficientOption] = useState(null);
  const [history, setHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleCardClick = (option) => {
    if (!hasEnoughGameCoins(option.coinsRequired)) {
      setInsufficientOption(option);
      return;
    }
    setConfirmOption(option);
  };

  const handleConfirm = () => {
    const option = confirmOption;
    const success = redeemGameCoins(option.coinsRequired);

    if (success) {
      if (option.id === "tokens") {
        addTokens(option.rewardAmount);
      }

      setHistory((prev) => [
        {
          id: Date.now(),
          coinsSpent: option.coinsRequired,
          rewardAmount: option.rewardAmount,
          rewardLabel: option.label,
          when: "Just now",
        },
        ...prev,
      ]);

      setSuccessMsg(`${option.rewardAmount} ${option.label}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }

    setConfirmOption(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} aria-label="Back to Games">
          ← Back
        </Link>
        <h1 className={styles.pageTitle}>Redeem Game Coins</h1>
      </header>

      <div className={styles.balanceBanner}>
        <img src={GAME_COIN_ICON} alt="" className={styles.balanceIcon} />
        <span className={styles.balanceValue}>{gameCoinBalance}</span>
        <span className={styles.balanceLabel}>Game Coins</span>
      </div>

      {successMsg && (
        <div className={styles.successToast}>✓ Redeemed {successMsg}!</div>
      )}

      <main className={styles.grid}>
        {REDEMPTION_OPTIONS.map((option) => (
          <div key={option.id} className={styles.card}>
            <img src={option.icon} alt={option.label} className={styles.cardIcon} />
            <p className={styles.cardTitle}>
              <img src={GAME_COIN_ICON} alt="" className={styles.inlineIcon} /> →{" "}
              {option.label}
            </p>
            <p className={styles.cardDesc}>
              {option.coinsRequired} Coins → {option.rewardAmount} {option.label}
            </p>
            <button
              type="button"
              className={styles.redeemBtn}
              onClick={() => handleCardClick(option)}
            >
              Redeem
            </button>
          </div>
        ))}
      </main>

      {history.length > 0 && (
        <section className={styles.historySection}>
          <h2 className={styles.historyTitle}>Recent Redemptions</h2>
          <ul className={styles.historyList}>
            {history.map((h) => (
              <li key={h.id} className={styles.historyItem}>
                <span className={styles.historyLine}>
                  <img src={GAME_COIN_ICON} alt="" className={styles.inlineIcon} />
                  {h.coinsSpent} → {h.rewardAmount} {h.rewardLabel}
                </span>
                <span className={styles.historyWhen}>{h.when}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirmOption && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalTitle}>Redeem Game Coins?</p>
            <p className={styles.modalText}>
              You are about to convert:
              <br />
              <strong className={styles.modalHighlight}>
                <img src={GAME_COIN_ICON} alt="" className={styles.inlineIcon} />{" "}
                {confirmOption.coinsRequired} Game Coins
              </strong>
              <br />
              into:
              <br />
              <strong className={styles.modalHighlight}>
                {confirmOption.rewardAmount} {confirmOption.label}
              </strong>
            </p>
            <p className={styles.remaining}>
              Remaining: {gameCoinBalance - confirmOption.coinsRequired} Game Coins
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmOption(null)}>
                Cancel
              </button>
              <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {insufficientOption && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.insufficientTitle}>Not Enough Game Coins</p>
            <p className={styles.modalText}>
              You have: {gameCoinBalance}
              <br />
              Required: {insufficientOption.coinsRequired}
            </p>
            <p className={styles.hint}>Keep playing games to earn more!</p>
            <div className={styles.modalActions}>
              <Link to="/" className={styles.playGamesBtn} onClick={() => setInsufficientOption(null)}>
                Play Games
              </Link>
              <button type="button" className={styles.cancelBtn} onClick={() => setInsufficientOption(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav theme="dark" />
    </div>
  );
}

export default Redeem;