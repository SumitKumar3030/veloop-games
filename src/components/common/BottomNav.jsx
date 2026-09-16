import { Link, useLocation, useParams } from "react-router-dom";
import styles from "./BottomNav.module.css";

function HomeIcon({ active }) {
  return (
    <svg
      className={`${styles.icon} ${active ? styles.iconActive : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 10.8 12 3.8l8.5 7" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

function GiftIcon({ active }) {
  return (
    <svg
      className={`${styles.icon} ${active ? styles.iconActive : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="9" width="17" height="11.5" rx="1.8" />
      <path d="M12 9v11.5" />
      <path d="M3.5 13h17" />
      <path d="M12 9H8.2a2.4 2.4 0 1 1 2.4-2.4C10.6 8 12 9 12 9Z" />
      <path d="M12 9h3.8a2.4 2.4 0 1 0-2.4-2.4C13.4 8 12 9 12 9Z" />
    </svg>
  );
}

function BottomNav({ theme = "light" }) {
  const location = useLocation();
  const { slug } = useParams();

  const gameHomePath = slug ? `/games/${slug}` : "/";
  const isHomeActive = location.pathname === gameHomePath;
  const isRedeemActive = location.pathname === "/redeem";

  return (
    <nav
      className={`${styles.nav} ${
        theme === "dark" ? styles.dark : styles.light
      }`}
      aria-label="Game navigation"
    >
      <Link
        to={gameHomePath}
        className={`${styles.navItem} ${
          isHomeActive ? styles.active : ""
        }`}
        aria-current={isHomeActive ? "page" : undefined}
      >
        <span className={styles.iconWrap}>
          <HomeIcon active={isHomeActive} />
        </span>
        <span className={styles.label}>Home</span>
      </Link>

      <Link
        to="/redeem"
        className={`${styles.navItem} ${
          isRedeemActive ? styles.active : ""
        }`}
        aria-current={isRedeemActive ? "page" : undefined}
      >
        <span className={styles.iconWrap}>
          <GiftIcon active={isRedeemActive} />
        </span>
        <span className={styles.label}>Redeem</span>
      </Link>
    </nav>
  );
}

export default BottomNav;