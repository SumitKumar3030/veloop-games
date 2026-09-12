import { useRef, useState, useEffect, useCallback } from "react";
import GameCard from "./GameCard";
import CarouselDots from "./CarouselDots";
import gamesData from "../../data/gamesData";
import styles from "./GamesCarousel.module.css";

const CARD_INTERVAL_MS = 3500; // pause duration on each card
const SNAP_BACK_DELAY_MS = 650; // roughly matches the smooth-scroll transition time
const DRAG_CLICK_THRESHOLD = 5;

const loopedGames = [...gamesData, ...gamesData];

function GamesCarousel({ onPlay }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const snapTimeoutRef = useRef(null);

  // Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // --------------------------------------------------
  // Helper: how wide is one card + gap, in px
  // --------------------------------------------------
  const getStep = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.firstChild) return 0;
    const cardWidth = track.firstChild.offsetWidth || 0;
    const gap = 16;
    return cardWidth + gap;
  }, []);

  // --------------------------------------------------
  // Helper: which card index are we currently nearest to
  // --------------------------------------------------
  const getNearestIndex = useCallback(() => {
    const track = trackRef.current;
    const step = getStep();
    if (!track || step === 0) return 0;
    return Math.round(track.scrollLeft / step);
  }, [getStep]);

  // --------------------------------------------------
  // Discrete auto-advance: move one card, pause, repeat
  // --------------------------------------------------
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    intervalRef.current = setInterval(() => {
      if (isPaused || isDraggingRef.current) return;

      const step = getStep();
      if (step === 0) return;

      const current = getNearestIndex();
      const nextIndex = current + 1;
      const nextCard = track.children[nextIndex];
      if (!nextCard) return;

      track.scrollTo({ left: nextCard.offsetLeft, behavior: "smooth" });

      // After the smooth-scroll settles, silently wrap back to the
      // start of set 1 once we've scrolled into set 2 — invisible
      // since set 2 looks identical to set 1.
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = setTimeout(() => {
        if (nextIndex >= gamesData.length) {
          const wrappedIndex = nextIndex - gamesData.length;
          const wrappedCard = track.children[wrappedIndex];
          if (wrappedCard) {
            track.scrollLeft = wrappedCard.offsetLeft; // instant, no animation
          }
        }
      }, SNAP_BACK_DELAY_MS);
    }, CARD_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(snapTimeoutRef.current);
    };
  }, [isPaused, getStep, getNearestIndex]);

  // --------------------------------------------------
  // Mouse wheel — vertical scroll becomes horizontal (manual, instant)
  // --------------------------------------------------
  const handleWheel = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  }, []);

  // --------------------------------------------------
  // Mouse drag start (left click only)
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

  // --------------------------------------------------
  // Mouse dragging
  // --------------------------------------------------
  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;

    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const distance = (x - startXRef.current) * 1.25;
    dragDistanceRef.current = Math.abs(distance);

    track.scrollLeft = startScrollLeftRef.current - distance;
  }, []);

  // --------------------------------------------------
  // Mouse drag end — snap to nearest card, resume auto-advance
  // --------------------------------------------------
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const track = trackRef.current;
    if (track) {
      track.classList.remove(styles.dragging);

      // Wrap if dragged into the duplicated set, then snap-align
      const step = getStep();
      if (step > 0) {
        let nearest = getNearestIndex();
        if (nearest >= gamesData.length) nearest -= gamesData.length;
        if (nearest < 0) nearest = 0;
        const card = track.children[nearest];
        if (card) track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
      }
    }

    setIsPaused(false);
  }, [getStep, getNearestIndex]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --------------------------------------------------
  // Touch support
  // --------------------------------------------------
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => {
    const track = trackRef.current;
    if (track) {
      const step = getStep();
      if (step > 0) {
        let nearest = getNearestIndex();
        if (nearest >= gamesData.length) nearest -= gamesData.length;
        if (nearest < 0) nearest = 0;
        const card = track.children[nearest];
        if (card) track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
      }
    }
    setIsPaused(false);
  };

  // --------------------------------------------------
  // Active dot sync
  // --------------------------------------------------
  const handleScroll = useCallback(() => {
    const nearest = getNearestIndex();
    setActiveIndex(
      ((nearest % gamesData.length) + gamesData.length) % gamesData.length,
    );
  }, [getNearestIndex]);

  // --------------------------------------------------
  // Dot navigation
  // --------------------------------------------------
  const scrollToIndex = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index];
    if (card) {
      track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    }
  };

  const handleClickCapture = (e) => {
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleFocus = (e) => {
    setIsPaused(true); // stop auto-advance while a keyboard user is navigating

    const cardEl = e.target.closest(`.${styles.cardWrapper}`);
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleBlur = (e) => {
    // Only resume auto-advance once focus has actually left the whole track
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsPaused(false);
    }
  };

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
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!isDraggingRef.current) setIsPaused(false);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="region"
        aria-label="Games carousel"
      >
        {loopedGames.map((game, i) => (
          <div className={styles.cardWrapper} key={`${game.id}-${i}`}>
            <GameCard game={game} onPlay={onPlay} />
          </div>
        ))}
      </div>

      <CarouselDots
        total={gamesData.length}
        activeIndex={activeIndex}
        onDotClick={scrollToIndex}
      />
    </section>
  );
}

export default GamesCarousel;
