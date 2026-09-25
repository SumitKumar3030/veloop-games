import { useRef, useState, useEffect, useCallback } from "react";
import GameCard from "./GameCard";
import CarouselDots from "./CarouselDots";
import gamesData from "../../data/gamesData";
import styles from "./GamesCarousel.module.css";

const CARD_INTERVAL_MS = 3800;
const DRAG_CLICK_THRESHOLD = 6;

// Duplicate array for infinite looping
const loopedGames = [...gamesData, ...gamesData, ...gamesData];

function GamesCarousel({ onPlay }) {
  const trackRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [centeredCardIndex, setCenteredCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const isTouchingRef = useRef(false);

  const prefersReducedMotion = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // --------------------------------------------------
  // Get index of the card closest to screen center
  // --------------------------------------------------
  const getCenteredIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.children.length) return 0;

    const viewportCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(track.children).forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(viewportCenter - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, []);

  // --------------------------------------------------
  // Smooth scroll target card to center
  // --------------------------------------------------
  const scrollToCard = useCallback(
    (index, behavior = "smooth") => {
      const track = trackRef.current;
      if (!track || !track.children[index]) return;

      const card = track.children[index];
      const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;

      track.scrollTo({
        left: Math.max(0, target),
        behavior: prefersReducedMotion() ? "auto" : behavior,
      });
    },
    [prefersReducedMotion]
  );

  // --------------------------------------------------
  // Initial Mount: Center the carousel on the middle card
  // --------------------------------------------------
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !track.children.length) return;

    // Start in the middle section of duplicated array
    const initialIndex = Math.floor(loopedGames.length / 2);
    const card = track.children[initialIndex];

    if (card) {
      const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      track.scrollLeft = Math.max(0, target);
      setCenteredCardIndex(initialIndex);
      setActiveIndex(initialIndex % gamesData.length);
    }
  }, []);

  // --------------------------------------------------
  // Auto-Advance Loop (Left to Right)
  // --------------------------------------------------
  useEffect(() => {
    if (gamesData.length === 0) return;

    intervalRef.current = setInterval(() => {
      if (
        prefersReducedMotion() ||
        isPaused ||
        isDraggingRef.current ||
        isTouchingRef.current
      ) {
        return;
      }

      const current = getCenteredIndex();
      let nextIndex = current + 1;

      // Loop back smoothly when reaching the right boundary
      if (nextIndex >= gamesData.length * 2) {
        const resetIndex = gamesData.length;
        scrollToCard(resetIndex, "auto");
        nextIndex = resetIndex + 1;
      }

      scrollToCard(nextIndex, "smooth");
    }, CARD_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [isPaused, getCenteredIndex, scrollToCard, prefersReducedMotion]);

  // --------------------------------------------------
  // Wheel Handling (Non-passive listener setup)
  // --------------------------------------------------
  const handleWheel = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // --------------------------------------------------
  // Dragging Implementation
  // --------------------------------------------------
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX - track.offsetLeft;
    startScrollLeftRef.current = track.scrollLeft;

    track.classList.add(styles.dragging);
    setIsPaused(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;

    const x = e.pageX - track.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    dragDistanceRef.current = Math.abs(walk);
    track.scrollLeft = startScrollLeftRef.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const track = trackRef.current;
    if (track) {
      track.classList.remove(styles.dragging);
      const centered = getCenteredIndex();
      scrollToCard(centered, "smooth");
    }

    setIsPaused(false);
  }, [getCenteredIndex, scrollToCard]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --------------------------------------------------
  // OnScroll Event Handler
  // --------------------------------------------------
  const handleScroll = useCallback(() => {
    const centered = getCenteredIndex();
    const normalized = centered % gamesData.length;

    setCenteredCardIndex(centered);
    setActiveIndex(normalized);
  }, [getCenteredIndex]);

  // Prevent accidental card clicks while dragging
  const handleClickCapture = useCallback((e) => {
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      e.stopPropagation();
      e.preventDefault();
    }
    dragDistanceRef.current = 0;
  }, []);

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Games</p>
        <h2 className={styles.title}>Explore Games & Earn Rewards</h2>
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        onTouchStart={() => {
          isTouchingRef.current = true;
          setIsPaused(true);
        }}
        onTouchEnd={() => {
          isTouchingRef.current = false;
          setIsPaused(false);
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!isDraggingRef.current) setIsPaused(false);
        }}
        role="region"
        aria-label="Games carousel"
      >
        {loopedGames.map((game, i) => (
          <div
            className={`${styles.cardWrapper} ${
              i === centeredCardIndex ? styles.activeCard : ""
            }`}
            key={`${game.id}-${i}`}
          >
            <GameCard game={game} onPlay={onPlay} />
          </div>
        ))}
      </div>

      <CarouselDots
        total={gamesData.length}
        activeIndex={activeIndex}
        onDotClick={(index) => {
          setIsPaused(true);
          const current = getCenteredIndex();
          const baseOffset = Math.floor(current / gamesData.length) * gamesData.length;
          scrollToCard(baseOffset + index, "smooth");
          setTimeout(() => setIsPaused(false), 800);
        }}
      />
    </section>
  );
}

export default GamesCarousel;