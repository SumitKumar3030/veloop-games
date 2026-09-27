import { useState } from "react";
import { Link } from "react-router-dom";
import { useGameCoins } from "../context/GameCoinStore";
import { useTokens } from "../context/TokenStore";
import BottomNav from "../components/common/BottomNav";
import styles from "./Redeem.module.css";

const REDEMPTION_OPTIONS = [
  {
    id: "ve",
    label: "VEs",
    icon: "/assets/icons/ve-icon.png",
    coinsRequired: 100,
    rewardAmount: 10,
  },
  {
    id: "sve",
    label: "SVEs",
    icon: "/assets/icons/sve-icon.png",
    coinsRequired: 150,
    rewardAmount: 10,
  },
  {
    id: "gems",
    label: "Gems",
    icon: "/assets/icons/gems-icon.png",
    coinsRequired: 80,
    rewardAmount: 5,
  },
  {
    id: "tokens",
    label: "Tokens",
    icon: "/assets/icons/token-icon.png",
    coinsRequired: 50,
    rewardAmount: 20,
  },
  {
    id: "spins",
    label: "Spins",
    icon: "/assets/icons/spin-icon.png",
    coinsRequired: 120,
    rewardAmount: 1,
  },
];

const GAME_COIN_ICON = "/assets/icons/game-coin-icon.png";

function Redeem() {
  const { gameCoinBalance, hasEnoughGameCoins, redeemGameCoins } =
    useGameCoins();

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

    if (!option) return;

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

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    }

    setConfirmOption(null);
  };

  const cheapestReward = [...REDEMPTION_OPTIONS].sort(
    (a, b) => a.coinsRequired - b.coinsRequired,
  )[0];

  const nextReward = REDEMPTION_OPTIONS.filter(
    (option) => option.coinsRequired > gameCoinBalance,
  ).sort((a, b) => a.coinsRequired - b.coinsRequired)[0];

  return (
    <div className={styles.page}>
      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label="Go to VELOOP Games">
            <span className={styles.brandMark}>V</span>
            <span className={styles.brandText}>VELOOP</span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Main navigation">
            <Link to="/" className={styles.navLink}>
              Games
            </Link>

            <Link
              to="/redeem"
              className={`${styles.navLink} ${styles.navLinkActive}`}
            >
              Redeem
            </Link>
          </nav>

          <div className={styles.navCoinBalance}>
            <img src={GAME_COIN_ICON} alt="" />
            <span>{gameCoinBalance}</span>
          </div>
        </div>
      </header>

      {/* =========================================
          HERO / REWARD VAULT INTRO
      ========================================= */}

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />

        <div className={styles.floatingCoins} aria-hidden="true">
          <img
            src={GAME_COIN_ICON}
            alt=""
            className={`${styles.floatingCoin} ${styles.floatingCoinOne}`}
          />

          <img
            src={GAME_COIN_ICON}
            alt=""
            className={`${styles.floatingCoin} ${styles.floatingCoinTwo}`}
          />

          <img
            src={GAME_COIN_ICON}
            alt=""
            className={`${styles.floatingCoin} ${styles.floatingCoinThree}`}
          />

          <img
            src={GAME_COIN_ICON}
            alt=""
            className={`${styles.floatingCoin} ${styles.floatingCoinFour}`}
          />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>
            <span />
            PLAY • EARN • REDEEM
            <span />
          </div>

          <h1 className={styles.heroTitle}>
            UNLOCK
            <span>YOUR REWARDS</span>
          </h1>

          <p className={styles.heroDescription}>
            Turn your Game Coins into rewards and unlock more from VELOOP.
          </p>

          <div className={styles.heroCoinStage}>
            <div className={styles.coinAura} />

            <div className={`${styles.coinOrbit} ${styles.orbitOne}`} />
            <div className={`${styles.coinOrbit} ${styles.orbitTwo}`} />

            <img
              src={GAME_COIN_ICON}
              alt="VELOOP Game Coin"
              className={styles.heroCoin}
            />

            <div className={`${styles.coinSpark} ${styles.sparkOne}`}>✦</div>
            <div className={`${styles.coinSpark} ${styles.sparkTwo}`}>✦</div>
            <div className={`${styles.coinSpark} ${styles.sparkThree}`}>•</div>
            <div className={`${styles.coinSpark} ${styles.sparkFour}`}>•</div>
          </div>

          <div className={styles.heroBalance}>
            <span className={styles.heroBalanceLabel}>YOUR GAME COINS</span>

            <div className={styles.heroBalanceValue}>
              <img src={GAME_COIN_ICON} alt="" />
              <strong>{gameCoinBalance}</strong>
            </div>

            <span className={styles.heroBalanceUnit}>GAME COINS</span>
          </div>
        </div>
      </section>

      {/* =========================================
          SUCCESS TOAST
      ========================================= */}

      {successMsg && (
        <div className={styles.successToast} role="status">
          <span className={styles.successIcon}>✓</span>

          <div>
            <strong>Reward Unlocked</strong>
            <span>You received {successMsg}.</span>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {/* =========================================
            BALANCE / PROGRESS CARD
        ========================================= */}

        <section className={styles.balanceSection}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceCardTop}>
              <div>
                <span className={styles.sectionEyebrow}>CURRENT BALANCE</span>

                <h2 className={styles.balanceHeading}>Your Reward Wallet</h2>
              </div>

              <div className={styles.balanceMiniCoin}>
                <img src={GAME_COIN_ICON} alt="" />
              </div>
            </div>

            <div className={styles.balanceMain}>
              <img src={GAME_COIN_ICON} alt="" />

              <span className={styles.balanceValue}>{gameCoinBalance}</span>

              <span className={styles.balanceLabel}>Game Coins</span>
            </div>

            <div className={styles.rewardProgress}>
              <div className={styles.progressHeader}>
                <span>
                  {nextReward
                    ? `Next reward: ${nextReward.label}`
                    : "Rewards available to you"}
                </span>

                <span>
                  {nextReward
                    ? `${Math.min(
                        100,
                        Math.round(
                          (gameCoinBalance / nextReward.coinsRequired) * 100,
                        ),
                      )}%`
                    : "Ready"}
                </span>
              </div>

              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: nextReward
                      ? `${Math.min(
                          100,
                          (gameCoinBalance / nextReward.coinsRequired) * 100,
                        )}%`
                      : "100%",
                  }}
                />
              </div>

              <div className={styles.progressBottom}>
                {nextReward ? (
                  <>
                    <span>
                      {gameCoinBalance} / {nextReward.coinsRequired} Coins
                    </span>

                    <span>
                      {Math.max(0, nextReward.coinsRequired - gameCoinBalance)}{" "}
                      more needed
                    </span>
                  </>
                ) : (
                  <span>
                    You have enough Game Coins for the available rewards.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.balanceSideCard}>
            <span className={styles.sectionEyebrow}>START HERE</span>

            <h3>Keep playing. Keep earning.</h3>

            <p>
              Every game gives you a chance to build your Game Coin balance and
              unlock rewards.
            </p>

            <Link to="/" className={styles.playButton}>
              <span>Play Games</span>
              <span aria-hidden="true">→</span>
            </Link>

            <div className={styles.minimumReward}>
              <img src={GAME_COIN_ICON} alt="" />
              <span>
                Rewards start from{" "}
                <strong>{cheapestReward.coinsRequired}</strong> Coins
              </span>
            </div>
          </div>
        </section>

        {/* =========================================
            REWARD VAULT
        ========================================= */}

        <section className={styles.vaultSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>VELOOP REWARDS</span>

              <h2>THE REWARD VAULT</h2>

              <p>Choose a reward and exchange your Game Coins.</p>
            </div>

            <div className={styles.vaultDecoration} aria-hidden="true">
              <span>✦</span>
              <img src={GAME_COIN_ICON} alt="" />
              <span>✦</span>
            </div>
          </div>

          <div className={styles.rewardGrid}>
            {REDEMPTION_OPTIONS.map((option) => {
              const canRedeem = hasEnoughGameCoins(option.coinsRequired);

              const progress = Math.min(
                100,
                Math.round((gameCoinBalance / option.coinsRequired) * 100),
              );

              return (
                <article
                  key={option.id}
                  className={`${styles.card} ${
                    canRedeem ? styles.cardAvailable : styles.cardLocked
                  }`}
                >
                  {canRedeem && (
                    <span className={styles.availableBadge}>AVAILABLE</span>
                  )}

                  {!canRedeem && (
                    <span className={styles.lockedBadge}>
                      {option.coinsRequired - gameCoinBalance} MORE
                    </span>
                  )}

                  <div className={styles.cardGlow} />

                  <div className={styles.cardIconWrap}>
                    <div className={styles.cardIconRing} />

                    <img
                      src={option.icon}
                      alt={option.label}
                      className={styles.cardIcon}
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <span className={styles.cardCategory}>REWARD</span>

                    <h3 className={styles.cardTitle}>
                      {option.rewardAmount} {option.label}
                    </h3>

                    <div className={styles.cardCost}>
                      <img src={GAME_COIN_ICON} alt="" />
                      <strong>{option.coinsRequired}</strong>
                      <span>Game Coins</span>
                    </div>

                    <div className={styles.cardProgress}>
                      <div className={styles.cardProgressTrack}>
                        <div
                          className={styles.cardProgressFill}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span>
                        {canRedeem
                          ? "Ready to redeem"
                          : `${progress}% collected`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.redeemBtn}
                      onClick={() => handleCardClick(option)}
                    >
                      <span>
                        {canRedeem ? "Redeem Reward" : "View Requirement"}
                      </span>

                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =========================================
            REWARD JOURNEY
        ========================================= */}

        <section className={styles.journeySection}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.sectionEyebrow}>THE VELOOP LOOP</span>

            <h2>YOUR REWARD JOURNEY</h2>

            <p>
              Play games, build your balance, and turn your progress into
              rewards.
            </p>
          </div>

          <div className={styles.journey}>
            <div className={styles.journeyStep}>
              <div className={styles.journeyNumber}>01</div>
              <div className={styles.journeyIcon}>▶</div>
              <h3>PLAY</h3>
              <p>Jump into VELOOP games.</p>
            </div>

            <div className={styles.journeyLine} />

            <div className={styles.journeyStep}>
              <div className={styles.journeyNumber}>02</div>
              <div className={styles.journeyIcon}>
                <img src={GAME_COIN_ICON} alt="" />
              </div>
              <h3>EARN</h3>
              <p>Build your Game Coin balance.</p>
            </div>

            <div className={styles.journeyLine} />

            <div className={styles.journeyStep}>
              <div className={styles.journeyNumber}>03</div>
              <div className={styles.journeyIcon}>◆</div>
              <h3>REDEEM</h3>
              <p>Exchange your coins for rewards.</p>
            </div>
          </div>
        </section>

        {/* =========================================
            HISTORY
        ========================================= */}

        {history.length > 0 && (
          <section className={styles.historySection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>YOUR ACTIVITY</span>

                <h2>RECENT REDEMPTIONS</h2>

                <p>Your latest reward exchanges appear here.</p>
              </div>
            </div>

            <div className={styles.historyList}>
              {history.map((h) => (
                <div key={h.id} className={styles.historyItem}>
                  <div className={styles.historyReward}>
                    <div className={styles.historyIcon}>
                      <span>✓</span>
                    </div>

                    <div>
                      <strong>
                        {h.rewardAmount} {h.rewardLabel}
                      </strong>

                      <span>{h.when}</span>
                    </div>
                  </div>

                  <div className={styles.historyCost}>
                    <img src={GAME_COIN_ICON} alt="" />
                    <span>-{h.coinsSpent}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================
            EARN MORE
        ========================================= */}

        <section className={styles.earnSection}>
          <div className={styles.earnCoin} aria-hidden="true">
            <img src={GAME_COIN_ICON} alt="" />
          </div>

          <div className={styles.earnContent}>
            <span className={styles.sectionEyebrow}>WANT MORE REWARDS?</span>

            <h2>KEEP THE COINS COMING</h2>

            <p>
              Head back to the games and keep building your Game Coin balance.
            </p>

            <Link to="/" className={styles.earnButton}>
              <span>Explore Games</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* =========================================
            HOW IT WORKS
        ========================================= */}

        <section className={styles.howSection}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.sectionEyebrow}>SIMPLE & CLEAR</span>

            <h2>HOW REDEMPTION WORKS</h2>
          </div>

          <div className={styles.howGrid}>
            <div className={styles.howCard}>
              <span className={styles.howNumber}>01</span>
              <h3>Choose a Reward</h3>
              <p>Select the reward you want from the Reward Vault.</p>
            </div>

            <div className={styles.howCard}>
              <span className={styles.howNumber}>02</span>
              <h3>Confirm</h3>
              <p>
                Review the Game Coins being spent and your remaining balance.
              </p>
            </div>

            <div className={styles.howCard}>
              <span className={styles.howNumber}>03</span>
              <h3>Unlock</h3>
              <p>Confirm the exchange and receive your selected reward.</p>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================
          CONFIRMATION MODAL
      ========================================= */}

      {confirmOption && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-confirm-title"
        >
          <div className={styles.modal}>
            <div className={styles.modalCoin}>
              <img src={GAME_COIN_ICON} alt="" />
            </div>

            <span className={styles.modalEyebrow}>REWARD VAULT</span>

            <h2 id="redeem-confirm-title" className={styles.modalTitle}>
              Confirm Redemption
            </h2>

            <p className={styles.modalText}>
              You are about to exchange your Game Coins for:
            </p>

            <div className={styles.modalReward}>
              <img src={confirmOption.icon} alt={confirmOption.label} />

              <div>
                <strong>
                  {confirmOption.rewardAmount} {confirmOption.label}
                </strong>

                <span>Selected reward</span>
              </div>
            </div>

            <div className={styles.modalExchange}>
              <div>
                <span>YOU SPEND</span>

                <strong>
                  <img src={GAME_COIN_ICON} alt="" />
                  {confirmOption.coinsRequired}
                </strong>

                <small>Game Coins</small>
              </div>

              <span className={styles.exchangeArrow}>→</span>

              <div>
                <span>YOU RECEIVE</span>

                <strong>{confirmOption.rewardAmount}</strong>

                <small>{confirmOption.label}</small>
              </div>
            </div>

            <div className={styles.remaining}>
              <span>Remaining balance</span>

              <strong>
                {gameCoinBalance - confirmOption.coinsRequired}
                <img src={GAME_COIN_ICON} alt="" />
              </strong>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setConfirmOption(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
              >
                Confirm Redemption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          INSUFFICIENT COINS MODAL
      ========================================= */}

      {insufficientOption && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="insufficient-title"
        >
          <div className={styles.modal}>
            <div className={styles.modalCoinMuted}>
              <img src={GAME_COIN_ICON} alt="" />
            </div>

            <span className={styles.modalEyebrow}>REWARD VAULT</span>

            <h2 id="insufficient-title" className={styles.insufficientTitle}>
              More Coins Needed
            </h2>

            <p className={styles.modalText}>
              You don't have enough Game Coins for this reward yet.
            </p>

            <div className={styles.requirementBox}>
              <div>
                <span>YOUR BALANCE</span>
                <strong>
                  {gameCoinBalance}
                  <img src={GAME_COIN_ICON} alt="" />
                </strong>
              </div>

              <div>
                <span>REQUIRED</span>
                <strong>
                  {insufficientOption.coinsRequired}
                  <img src={GAME_COIN_ICON} alt="" />
                </strong>
              </div>
            </div>

            <div className={styles.missingCoins}>
              <img src={GAME_COIN_ICON} alt="" />

              <span>
                {insufficientOption.coinsRequired - gameCoinBalance} more Game
                Coins needed
              </span>
            </div>

            <p className={styles.hint}>
              Keep playing games to build your balance.
            </p>

            <div className={styles.modalActions}>
              <Link
                to="/"
                className={styles.playGamesBtn}
                onClick={() => setInsufficientOption(null)}
              >
                Play Games
              </Link>

              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setInsufficientOption(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.brandMark}>V</span>
              <span>VELOOP</span>
            </div>

            <p>
              Play. Earn. Redeem.
              <br />
              Your rewards journey starts here.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <Link to="/">Games</Link>
            <Link to="/redeem">Redeem</Link>
          </div>

          <div className={styles.footerCoin}>
            <img src={GAME_COIN_ICON} alt="" />
            <span>{gameCoinBalance} Game Coins</span>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>VELOOP Rewards</span>
          <span>Play • Earn • Redeem</span>
        </div>
      </footer>

      <BottomNav theme="dark" />
    </div>
  );
}

export default Redeem;
