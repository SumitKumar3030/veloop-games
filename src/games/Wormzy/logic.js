export const BOARD_SIZE = 15; // 15x15 grid
export const TICK_MS = 150; // game speed — lower = faster
export const COUNTDOWN_SECONDS = 3;

export function createInitialSnake() {
  const mid = Math.floor(BOARD_SIZE / 2);
  // 3 segments, head first, moving right
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function randomEmptyCell(snake, portals = []) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  portals.forEach((p) => occupied.add(`${p.x},${p.y}`));
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (occupied.has(`${cell.x},${cell.y}`));
  return cell;
}

// Spawns a linked pair of portal tiles in empty cells — echoes the
// glowing warp hole shown in the block puzzle artwork.
export function createPortals(snake, food) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  occupied.add(`${food.x},${food.y}`);

  const pickCell = () => {
    let cell;
    do {
      cell = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (occupied.has(`${cell.x},${cell.y}`));
    occupied.add(`${cell.x},${cell.y}`);
    return cell;
  };

  return [pickCell(), pickCell()];
}

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(dirA, dirB) {
  const a = DIRECTIONS[dirA];
  const b = DIRECTIONS[dirB];
  return a.x === -b.x && a.y === -b.y;
}

// Advances the snake one tick.
// Returns { snake, ate, crashed }
export function tick(snake, direction, food, portals = []) {
  const delta = DIRECTIONS[direction];
  const head = snake[0];
  let newHead = { x: head.x + delta.x, y: head.y + delta.y };

  // Wall collision
  if (
    newHead.x < 0 ||
    newHead.x >= BOARD_SIZE ||
    newHead.y < 0 ||
    newHead.y >= BOARD_SIZE
  ) {
    return { snake, ate: false, crashed: true };
  }

  // Portal warp — stepping on one portal exits at its linked pair
  if (portals.length === 2) {
    const [a, b] = portals;
    if (newHead.x === a.x && newHead.y === a.y) {
      newHead = { x: b.x, y: b.y };
    } else if (newHead.x === b.x && newHead.y === b.y) {
      newHead = { x: a.x, y: a.y };
    }
  }

  // Self collision (check against body, excluding the tail which will move away)
  const bodyToCheck = snake.slice(0, -1);
  const hitSelf = bodyToCheck.some(
    (s) => s.x === newHead.x && s.y === newHead.y
  );
  if (hitSelf) {
    return { snake, ate: false, crashed: true };
  }

  const ate = newHead.x === food.x && newHead.y === food.y;
  const newSnake = [newHead, ...snake];
  if (!ate) newSnake.pop(); // only grow if food was eaten

  return { snake: newSnake, ate, crashed: false };
}

// Revive: shrink the snake back to 3 segments centered safely,
// keep the score, let the player continue.
export function reviveSnake() {
  return createInitialSnake();
}

// Score-to-reward conversion for Wormzy
export function calculateReward(score) {
  return Math.max(5, Math.round(score / 2));
}