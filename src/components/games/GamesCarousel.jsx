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
  const [centeredCardIndex, setCenteredCardIndex] = useState(0);

  const intervalRef = useRef(null);
  const snapTimeoutRef = useRef(null);

  // Cached card positions
  const cardPositionsRef = useRef([]);

  // Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // Touch state
  const isTouchingRef = useRef(false);

  // Scroll frame
  const scrollFrameRef = useRef(null);

  // --------------------------------------------------
  // Reduced motion
  // --------------------------------------------------

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --------------------------------------------------
  // Cache actual card positions
  // --------------------------------------------------

  const updateCardPositions = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    cardPositionsRef.current = Array.from(track.children).map(
      (card) => card.offsetLeft,
    );
  }, []);

  // --------------------------------------------------
  // Get card scroll position
  //
  // This positions the card around the visual center
  // of the carousel instead of aligning it to the left.
  // --------------------------------------------------

  const getCardScrollPosition = useCallback(
    (index) => {
      const track = trackRef.current;

      if (!track) return null;

      const card = track.children[index];

      if (!card) return null;

      const target =
        card.offsetLeft -
        (track.clientWidth - card.offsetWidth) / 2;

      const maxScrollLeft =
        track.scrollWidth - track.clientWidth;

      return Math.max(0, Math.min(target, maxScrollLeft));
    },
    [],
  );

  // --------------------------------------------------
  // Get card closest to visual center
  // --------------------------------------------------

  const getCenteredIndex = useCallback(() => {
    const track = trackRef.current;

    if (!track) return 0;

    if (!track.children.length) return 0;

    const viewportCenter =
      track.scrollLeft + track.clientWidth / 2;

    let closestIndex = 0;
    let smallestDistance = Infinity;

    Array.from(track.children).forEach((card, index) => {
      const cardCenter =
        card.offsetLeft + card.offsetWidth / 2;

      const distance = Math.abs(
        viewportCenter - cardCenter,
      );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, []);

  // --------------------------------------------------
  // Keep cached positions correct after layout changes
  // --------------------------------------------------

  useEffect(() => {
    updateCardPositions();

    const handleResize = () => {
      updateCardPositions();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateCardPositions]);

  // --------------------------------------------------
  // Smoothly move to a specific card
  // --------------------------------------------------

  const scrollToCard = useCallback(
    (index, behavior = "smooth") => {
      const track = trackRef.current;

      if (!track) return;

      const position = getCardScrollPosition(index);

      if (position == null) return;

      track.scrollTo({
        left: position,
        behavior: prefersReducedMotion()
          ? "auto"
          : behavior,
      });
    },
    [getCardScrollPosition],
  );

  // --------------------------------------------------
  // Normalize duplicated cards
  // --------------------------------------------------

  const normalizeLoopPosition = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const total = gamesData.length;

    if (!total) return;

    const centered = getCenteredIndex();

    if (centered >= total) {
      const originalIndex = centered - total;
      const originalPosition =
        getCardScrollPosition(originalIndex);

      if (originalPosition != null) {
        track.scrollLeft = originalPosition;
      }
    }
  }, [getCenteredIndex, getCardScrollPosition]);

  // --------------------------------------------------
  // Auto advance
  // --------------------------------------------------

  useEffect(() => {
    const track = trackRef.current;

    if (!track || gamesData.length === 0) return;

    intervalRef.current = setInterval(() => {
      if (prefersReducedMotion()) return;

      if (
        isPaused ||
        isDraggingRef.current ||
        isTouchingRef.current
      ) {
        return;
      }

      const current = getCenteredIndex();
      const nextIndex = current + 1;

      if (nextIndex < track.children.length) {
        scrollToCard(nextIndex);

        clearTimeout(snapTimeoutRef.current);

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
    getCenteredIndex,
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

    startXRef.current =
      e.pageX - track.offsetLeft;

    startScrollLeftRef.current =
      track.scrollLeft;

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

    const x =
      e.pageX - track.offsetLeft;

    const distance =
      (x - startXRef.current) * 1.25;

    dragDistanceRef.current =
      Math.abs(distance);

    track.scrollLeft =
      startScrollLeftRef.current - distance;
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

      const centered =
        getCenteredIndex();

      scrollToCard(centered);

      clearTimeout(snapTimeoutRef.current);

      snapTimeoutRef.current = setTimeout(() => {
        normalizeLoopPosition();
      }, 700);
    }

    setIsPaused(false);
  }, [
    getCenteredIndex,
    scrollToCard,
    normalizeLoopPosition,
  ]);

  // --------------------------------------------------
  // Global mouse move/up
  // --------------------------------------------------

  useEffect(() => {
    window.addEventListener(
      "mousemove",
      handleMouseMove,
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp,
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp,
      );
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

  // --------------------------------------------------
  // Touch end
  // --------------------------------------------------

  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false;

    /*
     * Keep native touch momentum.
     * Do not force scrollToCard here.
     */

    setIsPaused(false);
  }, []);

  // --------------------------------------------------
  // Active card + dot sync
  // --------------------------------------------------

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current) return;

    scrollFrameRef.current =
      requestAnimationFrame(() => {
        scrollFrameRef.current = null;

        if (!gamesData.length) return;

        const centered =
          getCenteredIndex();

        // Physical duplicated-card index
        setCenteredCardIndex((prev) =>
          prev === centered
            ? prev
            : centered,
        );

        // Logical game index
        const normalizedIndex =
          centered % gamesData.length;

        setActiveIndex((prev) =>
          prev === normalizedIndex
            ? prev
            : normalizedIndex,
        );
      });
  }, [getCenteredIndex]);

  // --------------------------------------------------
  // Clean scroll frame
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(
          scrollFrameRef.current,
        );
      }
    };
  }, []);

  // --------------------------------------------------
  // Dot navigation
  // --------------------------------------------------

  const scrollToIndex = useCallback(
    (index) => {
      const track = trackRef.current;

      if (!track) return;

      const total = gamesData.length;

      if (!total) return;

      const current =
        getCenteredIndex();

      const candidates = [
        index,
        index + total,
      ];

      let closest = candidates[0];
      let smallestDistance = Infinity;

      candidates.forEach((candidate) => {
        const distance =
          Math.abs(current - candidate);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closest = candidate;
        }
      });

      setIsPaused(true);

      scrollToCard(closest);

      clearTimeout(snapTimeoutRef.current);

      snapTimeoutRef.current =
        setTimeout(() => {
          normalizeLoopPosition();
          setIsPaused(false);
        }, 700);
    },
    [
      getCenteredIndex,
      scrollToCard,
      normalizeLoopPosition,
    ],
  );

  // --------------------------------------------------
  // Prevent accidental click after dragging
  // --------------------------------------------------

  const handleClickCapture = useCallback((e) => {
    if (
      dragDistanceRef.current >
      DRAG_CLICK_THRESHOLD
    ) {
      e.stopPropagation();
      e.preventDefault();
    }

    dragDistanceRef.current = 0;
  }, []);

  // --------------------------------------------------
  // Keyboard focus
  // --------------------------------------------------

  const handleFocus = useCallback(() => {
    setIsPaused(true);
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

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>
          Games
        </p>

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
        onMouseEnter={() =>
          setIsPaused(true)
        }
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
            className={`${styles.cardWrapper} ${
              i === centeredCardIndex
                ? styles.activeCard
                : ""
            }`}
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