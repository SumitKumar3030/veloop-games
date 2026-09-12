import styles from "./GamesCarousel.module.css";

function CarouselDots({ total, activeIndex, onDotClick }) {
  return (
    <div className={styles.dots} role="tablist" aria-label="Games carousel position">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          aria-label={`Go to game ${i + 1}`}
          className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
          onClick={() => onDotClick(i)}
        />
      ))}
    </div>
  );
}

export default CarouselDots;