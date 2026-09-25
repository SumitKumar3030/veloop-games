// Wormzy — platformer-puzzle engine (v2)
// Snake stands on platforms, falls through gaps, dies on spikes,
// pushes stones onto glowing targets, eats 2 apples, then exits via the hole.

export const ROWS = 9;
export const COLS = 10;

export const DIRECTIONS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

export const KEY_TO_DIRECTION = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", W: "up", s: "down", S: "down", a: "left", A: "left", d: "right", D: "right",
};

// ---------- Level data ----------
const LEVELS = [
  {
    name: "First Steps",
    description: "Eat both apples, then reach the hole.",
    worm: [{ row: 3, col: 1 }, { row: 3, col: 0 }],
    platforms: [
      { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
      { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 },
      { row: 4, col: 8 }, { row: 4, col: 9 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 3, col: 4 }, { row: 3, col: 7 }],
    hole: { row: 3, col: 9 },
  },
  {
    name: "Gap Ahead",
    description: "Push the stone into the gap to cross safely.",
    worm: [{ row: 3, col: 1 }, { row: 3, col: 0 }],
    platforms: [
      { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
      { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 },
    ],
    spikes: [],
    stones: [{ row: 3, col: 3 }],
    targets: [{ row: 4, col: 4 }],
    apples: [{ row: 3, col: 2 }, { row: 3, col: 8 }],
    hole: { row: 3, col: 9 },
  },
    {
    name: "Twin Stones",
    description: "Bridge both gaps by pushing a stone into each.",
    worm: [{ row: 4, col: 1 }, { row: 4, col: 0 }],
    platforms: [
      { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
      { row: 5, col: 4 }, { row: 5, col: 5 },
      { row: 5, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 },
    ],
    spikes: [],
    stones: [{ row: 4, col: 2 }, { row: 4, col: 5 }],
    targets: [{ row: 5, col: 3 }, { row: 5, col: 6 }],
    apples: [{ row: 4, col: 4 }, { row: 4, col: 8 }],
    hole: { row: 4, col: 9 },
  },
    {
    name: "Double Drop",
    description: "Trust the fall — let the gaps carry you down to the hole.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
      { row: 6, col: 3 }, { row: 6, col: 4 },
      { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }, { row: 8, col: 8 }, { row: 8, col: 9 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 2, col: 2 }, { row: 7, col: 7 }],
    hole: { row: 7, col: 9 },
  },
  {
    name: "The Long Reach",
    description: "Grow long enough by eating both apples to cross the final gap.",
    worm: [{ row: 4, col: 1 }, { row: 4, col: 0 }],
    platforms: [
      { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 },
      { row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 }, { row: 5, col: 7 }, { row: 5, col: 8 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 4, col: 3 }, { row: 4, col: 6 }],
    hole: { row: 4, col: 9, requiresLength: 4 },
  },
    {
    name: "Chain Reaction",
    description: "Two stones, two gaps — bridge them both in order.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
      { row: 3, col: 4 }, { row: 3, col: 5 },
      { row: 3, col: 7 }, { row: 3, col: 8 },
    ],
    spikes: [],
    stones: [{ row: 2, col: 2 }, { row: 2, col: 5 }],
    targets: [{ row: 3, col: 3 }, { row: 3, col: 6 }],
    apples: [{ row: 2, col: 1 }, { row: 2, col: 8 }],
    hole: { row: 3, col: 9 },
  },
  {
    name: "Warning Ledge",
    description: "A gap forces the fall before the spike can ever reach you.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 },
      { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 },
      { row: 6, col: 5 }, { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 6, col: 8 }, { row: 6, col: 9 },
    ],
    spikes: [{ row: 3, col: 3 }],
    stones: [],
    targets: [],
    apples: [{ row: 2, col: 1 }, { row: 5, col: 6 }],
    hole: { row: 5, col: 9 },
  },
  {
    name: "Triple Stones",
    description: "Three gaps in a row — keep your pushes precise.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 },
      { row: 3, col: 3 },
      { row: 3, col: 5 },
      { row: 3, col: 7 }, { row: 3, col: 8 },
    ],
    spikes: [],
    stones: [{ row: 2, col: 1 }, { row: 2, col: 3 }, { row: 2, col: 5 }],
    targets: [{ row: 3, col: 2 }, { row: 3, col: 4 }, { row: 3, col: 6 }],
    apples: [{ row: 2, col: 0 }, { row: 2, col: 8 }],
    hole: { row: 3, col: 9 },
  },
  {
    name: "Grow to Cross",
    description: "Eat early, grow long, and reach further than before.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
      { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 },
      // was missing col 7 and 8 — the platform stopped 3 cells short of the
      // hole, so the snake fell into that gap before ever reaching it. Only
      // the final cell (the hole itself) should be the length-gated gap.
      { row: 3, col: 7 }, { row: 3, col: 8 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 2, col: 2 }, { row: 2, col: 4 }],
    hole: { row: 2, col: 9, requiresLength: 4 }, // was 5 — impossible: only 2 apples exist, so max length is 4
  },
  {
    name: "Double Drop II",
    description: "Two long falls test your nerve — trust the path.",
    worm: [{ row: 1, col: 1 }, { row: 1, col: 0 }],
    platforms: [
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
      { row: 5, col: 2 }, { row: 5, col: 3 },
      { row: 8, col: 3 }, { row: 8, col: 4 }, { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }, { row: 8, col: 8 }, { row: 8, col: 9 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 1, col: 1 }, { row: 7, col: 7 }],
    hole: { row: 7, col: 9 },
  },
  {
    name: "Stone and Spike",
    description: "Bridge the gap early — the spike ahead is already behind you.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 },
      // was a 2-wide gap (col 2 AND col 3) with only one stone/target to
      // bridge it — added col 3 as solid ground so the single stone/target
      // at col 2 is actually enough to cross.
      { row: 3, col: 3 },
      { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 },
    ],
    spikes: [{ row: 3, col: 6 }],
    stones: [{ row: 2, col: 1 }],
    targets: [{ row: 3, col: 2 }],
    // was { row: 2, col: 0 } — that's the snake's own starting tail cell,
    // which (correctly) can never be re-entered, so that apple was uneatable.
    apples: [{ row: 2, col: 4 }, { row: 2, col: 7 }],
    hole: { row: 3, col: 9, requiresLength: 3 },
  },
  {
    name: "Long Ledges",
    description: "A winding, three-stage descent to the exit.",
    worm: [{ row: 1, col: 1 }, { row: 1, col: 0 }],
    platforms: [
      { row: 2, col: 0 }, { row: 2, col: 1 },
      { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
      { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
      { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }, { row: 8, col: 8 }, { row: 8, col: 9 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 1, col: 1 }, { row: 7, col: 8 }],
    hole: { row: 7, col: 9 },
  },
  {
    name: "Four Gaps",
    description: "The hardest bridge run yet — four stones, four gaps.",
    worm: [{ row: 2, col: 1 }, { row: 2, col: 0 }],
    platforms: [
      { row: 3, col: 0 }, { row: 3, col: 1 },
      { row: 3, col: 3 }, { row: 3, col: 5 }, { row: 3, col: 7 },
      // the { row: 3, col: 9 } platform used to duplicate the hole's own
      // coordinate — since ANY platform tile permanently blocks movement
      // onto it, that made the hole itself unenterable. The hole already
      // counts as solid ground on its own, so no platform entry is needed here.
    ],
    spikes: [],
    stones: [{ row: 2, col: 1 }, { row: 2, col: 3 }, { row: 2, col: 5 }, { row: 2, col: 7 }],
    targets: [{ row: 3, col: 2 }, { row: 3, col: 4 }, { row: 3, col: 6 }, { row: 3, col: 8 }],
    apples: [{ row: 2, col: 0 }, { row: 2, col: 9 }],
    hole: { row: 3, col: 9 },
  },
  {
    name: "Deep Reach",
    description: "A far drop, then grow long enough to finish the job.",
    worm: [{ row: 1, col: 1 }, { row: 1, col: 0 }],
    platforms: [
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
      // extended col 6–8 so there's continuous ground all the way up to the
      // hole (previously stopped at col 5, so the snake fell into the gap
      // 3 cells before reaching the hole — only the hole cell itself should
      // be the length-gated gap).
      { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 },
      { row: 7, col: 6 }, { row: 7, col: 7 }, { row: 7, col: 8 },
    ],
    spikes: [],
    stones: [],
    targets: [],
    // Apple 1 was on the snake's own starting head cell (uneatable — see
    // "Stone and Spike" note). Apple 2 was at (6,3), which is exactly where
    // the snake lands after its big fall — landing on a cell doesn't count
    // as eating it (only a deliberate step onto it does), and the corridor
    // is too narrow to double back without hitting its own body. Moved it
    // further along the ledge so it's picked up by a normal step instead.
    apples: [{ row: 1, col: 2 }, { row: 6, col: 6 }],
    hole: { row: 6, col: 9, requiresLength: 4 },
  },
  {
    name: "Final Gauntlet",
    description: "Every mechanic, one last time. Good luck.",
    worm: [{ row: 1, col: 1 }, { row: 1, col: 0 }],
    platforms: [
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
      { row: 4, col: 3 },
      // extended col 7–8 so the ledge is continuous right up to the hole.
      { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 },
      { row: 7, col: 7 }, { row: 7, col: 8 },
    ],
    // The old layout had no legal path down to the stone at all: the only
    // column off the starting ledge that wasn't supported dropped straight
    // off the bottom of the board. Redesigned so col 3 carries the snake
    // down onto the stone, which now bridges a real gap (col 4/row 4) on
    // its way to the target.
    spikes: [{ row: 7, col: 6 }],
    stones: [{ row: 3, col: 4 }],
    targets: [{ row: 4, col: 5 }],
    // Apple 1 was on the snake's own starting head cell (uneatable). Apple 2
    // was at the exact spot the snake lands after falling — same
    // landing-doesn't-count issue as "Deep Reach" — moved further along the
    // ledge so it's picked up with a normal step.
    apples: [{ row: 1, col: 2 }, { row: 6, col: 7 }],
    hole: { row: 6, col: 9, requiresLength: 4 },
  },
];

// ---------- Helpers ----------
function same(a, b) {
  return a?.row === b?.row && a?.col === b?.col;
}
function key(pos) {
  return `${pos.row}-${pos.col}`;
}
function clone(pos) {
  return { row: pos.row, col: pos.col };
}
function inBounds(pos) {
  return pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS;
}
function findIn(list, pos) {
  return list.findIndex((p) => same(p, pos));
}
function getLevel(index) {
  return LEVELS[index % LEVELS.length];
}
export function getTotalLevels() {
  return LEVELS.length;
}
export function getLevelInfo(index) {
  return getLevel(index);
}

function isSolidGround(state, pos) {
  if (findIn(state.platforms, pos) !== -1) return true;
  if (findIn(state.stones, pos) !== -1) return true;
  if (same(state.hole, pos)) return true;
  return false;
}

function isSpike(state, pos) {
  return findIn(state.spikes, pos) !== -1;
}

function isTarget(state, pos) {
  return findIn(state.targets, pos) !== -1;
}

function dropStoneUntilSupported(state, startPos) {
  let pos = clone(startPos);

  while (true) {
    if (isTarget(state, pos)) {
      return { pos, hitSpike: isSpike(state, pos), fellOff: false };
    }

    const below = { row: pos.row + 1, col: pos.col };
    if (!inBounds(below)) {
      return { pos, hitSpike: false, fellOff: true };
    }
    if (isSpike(state, below)) {
      return { pos: below, hitSpike: true, fellOff: false };
    }
    if (isSolidGround(state, below)) {
      return { pos, hitSpike: false, fellOff: false };
    }
    pos = below;
  }
}

function dropUntilSupported(state, startPos) {
  let pos = clone(startPos);

  const below = { row: pos.row + 1, col: pos.col };
  if (!inBounds(below) || isSolidGround(state, below)) {
    return { pos, hitSpike: isSpike(state, pos), fellOff: false };
  }

  while (true) {
    const next = { row: pos.row + 1, col: pos.col };
    if (!inBounds(next)) {
      return { pos, hitSpike: false, fellOff: true };
    }
    if (isSpike(state, next)) {
      return { pos: next, hitSpike: true, fellOff: false };
    }
    pos = next;
    const nextBelow = { row: pos.row + 1, col: pos.col };
    if (!inBounds(nextBelow) || isSolidGround(state, nextBelow)) {
      return { pos, hitSpike: false, fellOff: false };
    }
  }
}

// ---------- Level setup ----------
export function createLevelState(levelIndex = 0) {
  const level = getLevel(levelIndex);

  const rawState = {
    platforms: level.platforms.map(clone),
    spikes: level.spikes.map(clone),
    targets: level.targets.map(clone),
    hole: clone(level.hole),
    stones: [],
    worm: level.worm.map(clone),
  };

  const settledStones = level.stones.map((s) => dropStoneUntilSupported(rawState, s).pos);
  rawState.stones = settledStones;

  const settledApples = level.apples.map((a) => dropUntilSupported(rawState, a).pos);

  return {
    levelIndex,
    levelName: level.name,
    description: level.description,
    worm: level.worm.map(clone),
    platforms: level.platforms.map(clone),
    spikes: level.spikes.map(clone),
    targets: level.targets.map(clone),
    stones: settledStones,
    apples: settledApples,
    applesEaten: 0,
    hole: clone(level.hole),
    requiresLength: level.hole.requiresLength || 0,
    moves: 0,
    completed: false,
    failed: false,
    failReason: null,
    invalidMove: false,
    lastDirection: null,
  };
}

// ---------- Movement ----------
export function moveWorm(state, directionName) {
  if (state.completed || state.failed) return state;

  const direction = DIRECTIONS[directionName];
  if (!direction) return state;

  const head = state.worm[0];
  const nextHead = { row: head.row + direction.row, col: head.col + direction.col };

  if (!inBounds(nextHead)) {
    return { ...state, invalidMove: true };
  }

  if (findIn(state.platforms, nextHead) !== -1) {
    return { ...state, invalidMove: true };
  }

  // Figure out apple-eating up front, since it changes whether the tail
  // is safe to move into (see body-collision check below) and whether a
  // stone can be pushed onto an apple tile.
  const appleIdx = findIn(state.apples, nextHead);
  const ateApple = appleIdx !== -1;

  // Pushing a stone
  let nextStones = state.stones.map(clone);
  const stoneIdx = findIn(state.stones, nextHead);
  if (stoneIdx !== -1) {
    const pushedTo = { row: nextHead.row + direction.row, col: nextHead.col + direction.col };
    const pushBodyToCheck = ateApple ? state.worm : state.worm.slice(0, -1);
    const blocked =
      !inBounds(pushedTo) ||
      findIn(state.stones, pushedTo) !== -1 ||
      findIn(pushBodyToCheck, pushedTo) !== -1 ||
      findIn(state.apples, pushedTo) !== -1 ||
      same(state.hole, pushedTo);
    if (blocked) return { ...state, invalidMove: true };

    const stonesWithoutThisOne = state.stones.filter((_, i) => i !== stoneIdx);
    const tempState = { ...state, stones: stonesWithoutThisOne };
    const settled = dropStoneUntilSupported(tempState, pushedTo);

    if (settled.fellOff || settled.hitSpike) {
      return { ...state, invalidMove: true };
    }

    nextStones[stoneIdx] = settled.pos;
  }

  // Can't move into own body. The tail is only safe to step into when it's
  // about to vacate that cell this move — which is every move EXCEPT when
  // the snake just ate an apple (growing keeps the tail segment in place).
  const bodyToCheck = ateApple ? state.worm : state.worm.slice(0, -1);
  if (findIn(bodyToCheck, nextHead) !== -1) {
    return { ...state, invalidMove: true };
  }

  let nextApples = state.apples;
  let nextWorm;

  if (ateApple) {
    nextApples = state.apples.filter((_, i) => i !== appleIdx);
    nextWorm = [nextHead, ...state.worm.map(clone)]; // grows
  } else {
    nextWorm = [nextHead, ...state.worm.slice(0, -1).map(clone)];
  }

  let workingState = {
    ...state,
    worm: nextWorm,
    stones: nextStones,
    apples: nextApples,
    applesEaten: state.applesEaten + (ateApple ? 1 : 0),
    moves: state.moves + 1,
    invalidMove: false,
    lastDirection: directionName,
  };

  if (isSpike(workingState, nextHead)) {
    return { ...workingState, failed: true, failReason: "spike" };
  }

  const standingOverHoleGap =
    same(nextHead, workingState.hole) && workingState.worm.length >= workingState.requiresLength;

  // The worm only falls once its ENTIRE body has left solid ground — as
  // long as at least one segment anywhere along its length still has a
  // platform/stone directly beneath it, the worm bridges the gap safely,
  // with the rest of its body hanging in open air. It only drops the
  // moment the last segment (the tail) also clears the edge. Previously
  // this only checked the head, so the whole snake fell the instant the
  // head stepped off a platform even with the tail still firmly anchored.
  const anySegmentAnchored = workingState.worm.some((segment) => {
    const below = { row: segment.row + 1, col: segment.col };
    return inBounds(below) && isSolidGround(workingState, below);
  });

  const needsFall = !standingOverHoleGap && !anySegmentAnchored;

  if (needsFall) {
    const fallResult = dropUntilSupported(workingState, nextHead);
    if (fallResult.fellOff) {
      return { ...workingState, failed: true, failReason: "fell" };
    }
    if (fallResult.hitSpike) {
      return { ...workingState, failed: true, failReason: "spike" };
    }
    const dropAmount = fallResult.pos.row - nextHead.row;
    workingState = {
      ...workingState,
      worm: workingState.worm.map((seg) => ({ ...seg, row: seg.row + dropAmount })),
    };
  }

  const completed =
    workingState.applesEaten >= 2 &&
    same(workingState.worm[0], workingState.hole);

  return { ...workingState, completed };
}

// ---------- Scoring ----------
export function calculateStars(state, elapsedSeconds) {
  if (!state.completed) return 0;
  const levelNumber = state.levelIndex + 1;
  const moveLimit = 25 + levelNumber * 8;
  const timeLimit = 30 + levelNumber * 15;

  if (state.moves <= moveLimit && elapsedSeconds <= timeLimit) return 3;
  if (state.moves <= moveLimit + 15 && elapsedSeconds <= timeLimit + 25) return 2;
  return 1;
}

export function calculateScore(state, elapsedSeconds) {
  if (!state.completed) return 0;
  const stars = calculateStars(state, elapsedSeconds);
  const levelBonus = (state.levelIndex + 1) * 100;
  const appleBonus = 100;
  const moveBonus = Math.max(0, 200 - state.moves * 5);
  const timeBonus = Math.max(0, 300 - elapsedSeconds * 3);
  const starBonus = stars * 100;
  return levelBonus + appleBonus + moveBonus + timeBonus + starBonus;
}

// ---------- Rendering helpers ----------
export function getCellType(state, row, col) {
  const pos = { row, col };

  if (findIn(state.spikes, pos) !== -1) return "spike";
  if (same(state.hole, pos)) return "hole";

  const appleIdx = findIn(state.apples, pos);
  if (appleIdx !== -1) return "apple";

  const stoneIdx = findIn(state.stones, pos);
  if (stoneIdx !== -1) {
    return isTarget(state, pos) ? "stoneOnTarget" : "stone";
  }

  const wormIdx = state.worm.findIndex((p) => same(p, pos));
  if (wormIdx !== -1) return wormIdx === 0 ? "wormHead" : "wormBody";

  if (isTarget(state, pos)) return "target";
  if (findIn(state.platforms, pos) !== -1) return "platform";

  return "sky";
}

export function getCellKey(row, col) {
  return key({ row, col });
}
