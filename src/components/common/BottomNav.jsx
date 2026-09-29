import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./BottomNav.module.css";

/* --------------------------------
   ICONS
-------------------------------- */

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

function GamesIcon({ active }) {
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
      <path d="M7.5 8h9a5 5 0 0 1 4.7 6.7l-1.2 3.2a2.4 2.4 0 0 1-4.4.2l-.9-1.8H9.3l-.9 1.8a2.4 2.4 0 0 1-4.4-.2l-1.2-3.2A5 5 0 0 1 7.5 8Z" />
      <path d="M8 11v4" />
      <path d="M6 13h4" />
      <circle cx="16.5" cy="12.5" r=".8" fill="currentColor" />
      <circle cx="18.5" cy="14.5" r=".8" fill="currentColor" />
    </svg>
  );
}

function RewardsIcon({ active }) {
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
      <path d="M5 8.5h14v11H5z" />
      <path d="M3.5 8.5h17v4H3.5z" />
      <path d="M12 8.5v11" />
      <path d="M12 8.5H8.7a2.3 2.3 0 1 1 2.3-2.3C11 7.4 12 8.5 12 8.5Z" />
      <path d="M12 8.5h3.3a2.3 2.3 0 1 0-2.3-2.3C13 7.4 12 8.5 12 8.5Z" />
    </svg>
  );
}

function ProfileIcon({ active }) {
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
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.2 20c.7-3.4 3.2-5.3 6.8-5.3s6.1 1.9 6.8 5.3" />
    </svg>
  );
}

/* --------------------------------
   BOTTOM NAV
-------------------------------- */

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeActive =
    location.pathname === "/" && location.hash !== "#games";

  const isGamesActive =
    location.hash === "#games" ||
    location.pathname.startsWith("/games/");

  const isRewardsActive = location.pathname === "/redeem";

  const isProfileActive = location.pathname === "/profile";

  const scrollToGames = useCallback(() => {
    const scroll = () => {
      const gamesSection = document.getElementById("games-section");

      if (gamesSection) {
        gamesSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    if (location.pathname !== "/") {
      navigate("/#games");

      window.setTimeout(scroll, 100);
      return;
    }

    window.history.replaceState(null, "", "/#games");
    scroll();
  }, [location.pathname, navigate]);

  const goHome = useCallback(() => {
    if (location.pathname === "/") {
      window.history.replaceState(null, "", "/");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    navigate("/");
  }, [location.pathname, navigate]);

  return (
    <nav
      className={styles.nav}
      aria-label="VEloop navigation"
    >
      <div className={styles.navInner}>
        {/* HOME */}
        <button
          type="button"
          className={`${styles.navItem} ${
            isHomeActive ? styles.active : ""
          }`}
          onClick={goHome}
          aria-label="Home"
          aria-current={isHomeActive ? "page" : undefined}
        >
          <span className={styles.iconWrap}>
            <HomeIcon active={isHomeActive} />
          </span>

          <span className={styles.label}>Home</span>
        </button>

        {/* GAMES */}
        <button
          type="button"
          className={`${styles.navItem} ${
            isGamesActive ? styles.active : ""
          }`}
          onClick={scrollToGames}
          aria-label="Games"
          aria-current={isGamesActive ? "page" : undefined}
        >
          <span className={styles.iconWrap}>
            <GamesIcon active={isGamesActive} />
          </span>

          <span className={styles.label}>Games</span>
        </button>

        {/* REWARDS */}
        <Link
          to="/redeem"
          className={`${styles.navItem} ${
            isRewardsActive ? styles.active : ""
          }`}
          aria-label="Rewards"
          aria-current={isRewardsActive ? "page" : undefined}
        >
          <span className={styles.iconWrap}>
            <RewardsIcon active={isRewardsActive} />
          </span>

          <span className={styles.label}>Rewards</span>
        </Link>

        {/* PROFILE */}
        <Link
          to="/profile"
          className={`${styles.navItem} ${
            isProfileActive ? styles.active : ""
          }`}
          aria-label="Profile"
          aria-current={isProfileActive ? "page" : undefined}
        >
          <span className={styles.iconWrap}>
            <ProfileIcon active={isProfileActive} />

            <span className={styles.profileStatus} />
          </span>

          <span className={styles.label}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNav;