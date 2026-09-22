import { useRef, useState, useEffect, useCallback } from "react";
import GameCard from "./GameCard";
import CarouselDots from "./CarouselDots";
import gamesData from "../../data/gamesData";
import styles from "./GamesCarousel.module.css";

const CARD_INTERVAL_MS = 3500;
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

  // Touch state
  const isTouchingRef = useRef(false);

  // --------------------------------------------------
  // Reduced motion
  // --------------------------------------------------
  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --------------------------------------------------
  // Get card + gap width
  // --------------------------------------------------

  // --------------------------------------------------
  // Get nearest card based on actual card positions
  // --------------------------------------------------
  const getNearestIndex = useCallback(() => {
    const track = trackRef.current;

    if (!track) return 0;

    const cards = Array.from(track.children);

    if (!cards.length) return 0;

    let nearestIndex = 0;
    let smallestDistance = Infinity;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        track.scrollLeft - card.offsetLeft,
      );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, []);

  // --------------------------------------------------
  // Smoothly move to a specific card
  // --------------------------------------------------
  const scrollToCard = useCallback(
    (index, behavior = "smooth") => {
      const track = trackRef.current;

      if (!track) return;

      const card = track.children[index];

      if (!card) return;

      track.scrollTo({
        left: card.offsetLeft,
        behavior: prefersReducedMotion() ? "auto" : behavior,
      });
    },
    [],
  );

  // --------------------------------------------------
  // Normalize duplicated cards
  // --------------------------------------------------
  const normalizeLoopPosition = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const total = gamesData.length;

    if (!total) return;

    const nearest = getNearestIndex();

    // We are inside the duplicated second set.
    if (nearest >= total) {
      const originalIndex = nearest - total;
      const originalCard = track.children[originalIndex];

      if (originalCard) {
        track.scrollLeft = originalCard.offsetLeft;
      }
    }
  }, [getNearestIndex]);

  // --------------------------------------------------
  // Auto advance
  // --------------------------------------------------
  useEffect(() => {
    const track = trackRef.current;

    if (!track || gamesData.length === 0) return;

    intervalRef.current = setInterval(() => {
      if (prefersReducedMotion()) return;

      if (isPaused || isDraggingRef.current || isTouchingRef.current) {
        return;
      }

      const current = getNearestIndex();
      const nextIndex = current + 1;

      // Move normally to next card.
      if (nextIndex < track.children.length) {
        scrollToCard(nextIndex);

        clearTimeout(snapTimeoutRef.current);

        // When entering the duplicated set,
        // silently jump back to the original set
        // after the animation finishes.
        if (nextIndex >= gamesData.length) {
          snapTimeoutRef.current = setTimeout(() => {
            normalizeLoopPosition();
          }, 700);
        }
      }
    }, CARD_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(snapTimeoutRef.current);
    };
  }, [
    isPaused,
    getNearestIndex,
    scrollToCard,
    normalizeLoopPosition,
  ]);

  // --------------------------------------------------
  // Mouse wheel
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
  // Mouse drag start
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
  // Mouse drag end
  // --------------------------------------------------
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    const track = trackRef.current;

    if (track) {
      track.classList.remove(styles.dragging);

      const nearest = getNearestIndex();

      // Snap exactly once after dragging.
      scrollToCard(nearest);

      // Normalize only if necessary.
      clearTimeout(snapTimeoutRef.current);

      snapTimeoutRef.current = setTimeout(() => {
        normalizeLoopPosition();
      }, 700);
    }

    setIsPaused(false);
  }, [
    getNearestIndex,
    scrollToCard,
    normalizeLoopPosition,
  ]);

  // --------------------------------------------------
  // Global mouse move/up
  // --------------------------------------------------
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --------------------------------------------------
  // Touch start
  // --------------------------------------------------
  const handleTouchStart = useCallback(() => {
  isTouchingRef.current = true;
  dragDistanceRef.current = 0;
  setIsPaused(true);
}, []);

const handleTouchEnd = useCallback(() => {
  isTouchingRef.current = false;

  /*
   * Do NOT call scrollTo() here.
   *
   * The browser's native touch momentum should finish
   * the swipe naturally. Calling scrollTo() on touchend
   * causes the small forward/backward correction.
   */
  setIsPaused(false);
}, []);

  // --------------------------------------------------
  // Active dot sync
  // --------------------------------------------------
  const handleScroll = useCallback(() => {
  if (!gamesData.length) return;

  const nearest = getNearestIndex();
  const normalizedIndex = nearest % gamesData.length;

  setActiveIndex((prev) =>
    prev === normalizedIndex ? prev : normalizedIndex,
  );
}, [getNearestIndex]);

  // --------------------------------------------------
  // Dot navigation
  // --------------------------------------------------
  const scrollToIndex = useCallback(
    (index) => {
      const track = trackRef.current;

      if (!track) return;

      const total = gamesData.length;

      if (!total) return;

      const current = getNearestIndex();

      /*
       * Choose whichever duplicate of the target
       * is closest to the currently visible position.
       *
       * This prevents dots from unnecessarily jumping
       * from the second set back to the first set.
       */
      const candidates = [
        index,
        index + total,
      ];

      let closest = candidates[0];
      let smallestDistance = Infinity;

      candidates.forEach((candidate) => {
        const card = track.children[candidate];

        if (!card) return;

        const distance = Math.abs(
          current - candidate,
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closest = candidate;
        }
      });

      setIsPaused(true);

      scrollToCard(closest);

      clearTimeout(snapTimeoutRef.current);

      snapTimeoutRef.current = setTimeout(() => {
        normalizeLoopPosition();
        setIsPaused(false);
      }, 700);
    },
    [
      getNearestIndex,
      scrollToCard,
      normalizeLoopPosition,
    ],
  );

  // --------------------------------------------------
  // Prevent accidental click after dragging
  // --------------------------------------------------
  const handleClickCapture = useCallback((e) => {
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Reset after the interaction.
    dragDistanceRef.current = 0;
  }, []);

  // --------------------------------------------------
  // Keyboard focus
  // --------------------------------------------------
  const handleFocus = useCallback(() => {
    // Pause auto-scroll while keyboard navigation is active.
    setIsPaused(true);

    /*
     * IMPORTANT:
     * Do NOT call scrollIntoView().
     *
     * The browser can naturally keep the focused button
     * visible. Calling scrollIntoView here was causing
     * unnecessary carousel jumps.
     */
  }, []);

  // --------------------------------------------------
  // Keyboard focus leaves carousel
  // --------------------------------------------------
  const handleBlur = useCallback((e) => {
    const track = trackRef.current;

    if (!track) return;

    if (!track.contains(e.relatedTarget)) {
      setIsPaused(false);
    }
  }, []);

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Games</p>

        <h2 className={styles.title}>
          Explore Games & Earn Rewards
        </h2>
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
          if (!isDraggingRef.current) {
            setIsPaused(false);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="region"
        aria-label="Games carousel"
      >
        {loopedGames.map((game, i) => (
          <div
            className={styles.cardWrapper}
            key={`${game.id}-${i}`}
          >
            <GameCard
              game={game}
              onPlay={onPlay}
            />
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