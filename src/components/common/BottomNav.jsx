import { Link, useLocation, useParams } from "react-router-dom";
import styles from "./BottomNav.module.css";

function BottomNav() {
  const location = useLocation();
  const { slug } = useParams();

  // "Home" means the current GAME's home page, not the main carousel
  // (per task brief 55.28 — Home returns to that game's home screen)
  const gameHomePath = slug ? `/games/${slug}` : "/";
  const isHomeActive = location.pathname === gameHomePath;
  const isRedeemActive = location.pathname === "/redeem";

  return (
    <nav className={styles.nav} aria-label="Game navigation">
      <Link
        to={gameHomePath}
        className={`${styles.navItem} ${isHomeActive ? styles.active : ""}`}
      >
        <span aria-hidden="true">🏠</span>
        <span>Home</span>
      </Link>
      <Link
        to="/redeem"
        className={`${styles.navItem} ${isRedeemActive ? styles.active : ""}`}
      >
        <span aria-hidden="true">🎁</span>
        <span>Redeem</span>
      </Link>
    </nav>
  );
}

export default BottomNav;