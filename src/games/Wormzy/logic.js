// Wormzy puzzle game logic

export const ROWS = 8;
export const COLS = 10;

export const DIRECTIONS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

export const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

const LEVELS = [
  {
    name: "First Bite",
    description: "Eat the apple and find the exit hole.",
    worm: [
      { row: 6, col: 2 },
      { row: 6, col: 1 },
    ],
    apple: { row: 6, col: 5 },
    hole: { row: 1, col: 8 },
    blocks: [],
    targets: [],
    walls: [
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 3, col: 6 },
    ],
  },
  {
    name: "Stone Path",
    description: "Push the stone onto the glowing target.",
    worm: [
      { row: 6, col: 1 },
      { row: 6, col: 0 },
    ],
    apple: { row: 2, col: 7 },
    hole: { row: 1, col: 8 },
    blocks: [{ row: 4, col: 4 }],
    targets: [{ row: 4, col: 6 }],
    walls: [
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
      { row: 5, col: 2 },
    ],
  },
  {
    name: "The Crossing",
    description: "Move the stone down to open your route.",
    worm: [
      { row: 6, col: 1 },
      { row: 6, col: 0 },
    ],
    apple: { row: 2, col: 8 },
    hole: { row: 1, col: 8 },
    blocks: [{ row: 3, col: 4 }],
    targets: [{ row: 5, col: 4 }],
    walls: [
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 4, col: 3 },
      { row: 5, col: 3 },
    ],
  },
  {
    name: "Double Trouble",
    description: "Place both stones correctly before leaving.",
    worm: [
      { row: 6, col: 1 },
      { row: 6, col: 0 },
    ],
    apple: { row: 2, col: 8 },
    hole: { row: 1, col: 8 },
    blocks: [
      { row: 4, col: 3 },
      { row: 4, col: 6 },
    ],
    targets: [
      { row: 4, col: 5 },
      { row: 4, col: 8 },
    ],
    walls: [
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
      { row: 5, col: 2 },
      { row: 5, col: 7 },
    ],
  },
  {
    name: "Final Garden",
    description: "Solve the garden and reach the mysterious hole.",
    worm: [
      { row: 6, col: 1 },
      { row: 6, col: 0 },
    ],
    apple: { row: 1, col: 8 },
    hole: { row: 0, col: 8 },
    blocks: [
      { row: 5, col: 4 },
      { row: 3, col: 6 },
    ],
    targets: [
      { row: 5, col: 7 },
      { row: 3, col: 8 },
    ],
    walls: [
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
      { row: 5, col: 2 },
      { row: 2, col: 5 },
      { row: 3, col: 5 },
      { row: 4, col: 5 },
    ],
  },
];

function samePosition(first, second) {
  return first?.row === second?.row && first?.col === second?.col;
}

function positionKey(position) {
  return `${position.row}-${position.col}`;
}

function clonePosition(position) {
  return {
    row: position.row,
    col: position.col,
  };
}

function isInsideBoard(position) {
  return (
    position.row >= 0 &&
    position.row < ROWS &&
    position.col >= 0 &&
    position.col < COLS
  );
}

function containsPosition(collection, position) {
  return collection.some((item) => samePosition(item, position));
}

function getLevelData(levelIndex) {
  return LEVELS[levelIndex % LEVELS.length];
}

export function getTotalLevels() {
  return LEVELS.length;
}

export function getLevelInfo(levelIndex) {
  return getLevelData(levelIndex);
}

export function createLevelState(levelIndex = 0) {
  const level = getLevelData(levelIndex);

  return {
    levelIndex,
    levelName: level.name,
    description: level.description,
    worm: level.worm.map(clonePosition),
    apple: level.apple ? clonePosition(level.apple) : null,
    hole: clonePosition(level.hole),
    blocks: level.blocks.map(clonePosition),
    targets: level.targets.map(clonePosition),
    walls: level.walls.map(clonePosition),
    appleEaten: false,
    moves: 0,
    completed: false,
    invalidMove: false,
    lastDirection: null,
  };
}

function isWall(state, position) {
  return containsPosition(state.walls, position);
}

function getBlockIndex(state, position) {
  return state.blocks.findIndex((block) => samePosition(block, position));
}

function isWormPosition(state, position, ignoreTail = false) {
  const worm = ignoreTail ? state.worm.slice(0, -1) : state.worm;

  return containsPosition(worm, position);
}

function isTarget(state, position) {
  return containsPosition(state.targets, position);
}

function allBlocksAreOnTargets(state) {
  if (state.blocks.length === 0) {
    return true;
  }

  return state.blocks.every((block) => isTarget(state, block));
}

function canOccupyBlockDestination(state, destination) {
  if (!isInsideBoard(destination)) {
    return false;
  }

  if (isWall(state, destination)) {
    return false;
  }

  if (getBlockIndex(state, destination) !== -1) {
    return false;
  }

  if (isWormPosition(state, destination)) {
    return false;
  }

  if (state.apple && samePosition(state.apple, destination)) {
    return false;
  }

  if (samePosition(state.hole, destination)) {
    return false;
  }

  return true;
}

export function moveWorm(state, directionName) {
  if (state.completed) {
    return state;
  }

  const direction = DIRECTIONS[directionName];

  if (!direction) {
    return state;
  }

  const head = state.worm[0];

  const nextHead = {
    row: head.row + direction.row,
    col: head.col + direction.col,
  };

  if (!isInsideBoard(nextHead) || isWall(state, nextHead)) {
    return {
      ...state,
      invalidMove: true,
    };
  }

  const blockIndex = getBlockIndex(state, nextHead);
  let nextBlocks = state.blocks.map(clonePosition);

  // If the worm moves into a stone, attempt to push it.
  if (blockIndex !== -1) {
    const block = state.blocks[blockIndex];

    const pushedBlockPosition = {
      row: block.row + direction.row,
      col: block.col + direction.col,
    };

    if (!canOccupyBlockDestination(state, pushedBlockPosition)) {
      return {
        ...state,
        invalidMove: true,
      };
    }

    nextBlocks[blockIndex] = pushedBlockPosition;
  }

  // The worm cannot move into its own body.
  // Its current tail can be ignored because it moves away during a normal move.
  const hitsWorm = isWormPosition(
    {
      ...state,
      blocks: nextBlocks,
    },
    nextHead,
    true,
  );

  if (hitsWorm) {
    return {
      ...state,
      invalidMove: true,
    };
  }

  const ateApple =
    !state.appleEaten &&
    state.apple &&
    samePosition(nextHead, state.apple);

  let nextWorm;

  if (ateApple) {
    // Add a segment when eating the apple.
    nextWorm = [nextHead, ...state.worm.map(clonePosition)];
  } else {
    // Normal movement: remove the tail.
    nextWorm = [nextHead, ...state.worm.slice(0, -1).map(clonePosition)];
  }

  const nextState = {
    ...state,
    worm: nextWorm,
    blocks: nextBlocks,
    apple: ateApple ? null : state.apple,
    appleEaten: state.appleEaten || Boolean(ateApple),
    moves: state.moves + 1,
    invalidMove: false,
    lastDirection: directionName,
  };

  const completed =
    nextState.appleEaten &&
    samePosition(nextHead, nextState.hole) &&
    allBlocksAreOnTargets(nextState);

  return {
    ...nextState,
    completed,
  };
}

export function calculateStars(state, elapsedSeconds) {
  if (!state.completed) {
    return 0;
  }

  const levelNumber = state.levelIndex + 1;

  const moveLimit = 25 + levelNumber * 8;
  const timeLimit = 30 + levelNumber * 15;

  if (state.moves <= moveLimit && elapsedSeconds <= timeLimit) {
    return 3;
  }

  if (
    state.moves <= moveLimit + 15 &&
    elapsedSeconds <= timeLimit + 25
  ) {
    return 2;
  }

  return 1;
}

export function calculateScore(state, elapsedSeconds) {
  const stars = calculateStars(state, elapsedSeconds);

  if (!state.completed) {
    return 0;
  }

  const levelBonus = (state.levelIndex + 1) * 100;
  const appleBonus = 100;
  const moveBonus = Math.max(0, 200 - state.moves * 5);
  const timeBonus = Math.max(0, 300 - elapsedSeconds * 3);
  const starBonus = stars * 100;

  return (
    levelBonus +
    appleBonus +
    moveBonus +
    timeBonus +
    starBonus
  );
}

export function isPositionOnTarget(state, position) {
  return isTarget(state, position);
}

export function getCellType(state, row, col) {
  const position = { row, col };

  if (isWall(state, position)) {
    return "wall";
  }

  if (samePosition(state.hole, position)) {
    return "hole";
  }

  if (state.apple && samePosition(state.apple, position)) {
    return "apple";
  }

  const blockIndex = getBlockIndex(state, position);

  if (blockIndex !== -1) {
    return isTarget(state, state.blocks[blockIndex])
      ? "blockOnTarget"
      : "block";
  }

  const wormIndex = state.worm.findIndex((part) =>
    samePosition(part, position),
  );

  if (wormIndex !== -1) {
    return wormIndex === 0 ? "wormHead" : "wormBody";
  }

  if (isTarget(state, position)) {
    return "target";
  }

  return "empty";
}

export function getCellKey(row, col) {
  return positionKey({ row, col });
}