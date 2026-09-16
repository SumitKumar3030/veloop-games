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
// platforms: solid ground the snake/stones rest ON TOP of
// spikes: instant level restart on contact
// stones: pushable blocks (fall through gaps like everything else)
// targets: glowing spots stones must land on
// apples: exactly 2 per level
// hole: exit — position + optional requiresLength (min snake length to safely cross the gap beneath it)
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
      // gap at col 4 — nothing at row 4 there
      { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 },
    ],
    spikes: [],
    stones: [{ row: 3, col: 3 }], // player pushes this right, into the gap at col 4
    targets: [{ row: 4, col: 4 }], // glowing target sits IN the gap — filling it makes it walkable
    apples: [{ row: 3, col: 2 }, { row: 3, col: 8 }],
    hole: { row: 3, col: 9 },
  },
    {
    name: "Twin Stones",
    description: "Bridge both gaps by pushing a stone into each.",
    worm: [{ row: 4, col: 1 }, { row: 4, col: 0 }],
    platforms: [
      { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
      // gap at col 3
      { row: 5, col: 4 }, { row: 5, col: 5 },
      // gap at col 6
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
      // gap at col 3 — first drop
      { row: 6, col: 3 }, { row: 6, col: 4 },
      // gap at col 5 — second drop
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
      // no platform at col 9 — the hole sits over open air
    ],
    spikes: [],
    stones: [],
    targets: [],
    apples: [{ row: 4, col: 3 }, { row: 4, col: 6 }],
    hole: { row: 4, col: 9, requiresLength: 4 },
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

// A cell counts as "solid ground to stand on" if it's a platform,
// a settled stone, or the hole itself (you can stand at the hole's
// mouth before stepping in — it only completes the level once both
// apples are eaten).
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

// Stones behave slightly differently from the worm when falling: they
// stop the moment they reach a target cell (the target marks the floor
// of a gap), rather than needing an actual platform directly beneath.
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
// Drops a single position straight down until it lands on solid ground,
// hits a spike (returns hitSpike:true), or falls off the board bottom
// (returns fellOff:true). Used for the ONE-TIME initial settle of
// apples/stones when a level loads, and for the snake's fall-check
// after every move.
function dropUntilSupported(state, startPos) {
  let pos = clone(startPos);

  // Already resting on something? No fall needed.
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

  // Settle stones to their resting position ONCE at level start
  // (this is what makes an apple/stone "fall into place" when the
  // level loads, per the reference — not on every move).
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
    failed: false, // spike hit or fell off — level needs restart
    failReason: null, // "spike" | "fell"
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

  // Pushing a stone
  let nextStones = state.stones.map(clone);
  const stoneIdx = findIn(state.stones, nextHead);
  if (stoneIdx !== -1) {
  const pushedTo = { row: nextHead.row + direction.row, col: nextHead.col + direction.col };
  const blocked =
    !inBounds(pushedTo) ||
    findIn(state.stones, pushedTo) !== -1 ||
    findIn(state.worm, pushedTo) !== -1 ||
    same(state.hole, pushedTo);
  if (blocked) return { ...state, invalidMove: true };

  // Let the pushed stone fall into place (settles on the target if it's
  // pushed over a gap, otherwise rests on whatever's directly below it)
  const stonesWithoutThisOne = state.stones.filter((_, i) => i !== stoneIdx);
  const tempState = { ...state, stones: stonesWithoutThisOne };
  const settled = dropStoneUntilSupported(tempState, pushedTo);

  if (settled.fellOff || settled.hitSpike) {
    return { ...state, invalidMove: true }; // pushing it here would be a bad move — block it
  }

  nextStones[stoneIdx] = settled.pos;
}

  // Can't move into own body (ignore current tail — it moves away)
  const bodyWithoutTail = state.worm.slice(0, -1);
  if (findIn(bodyWithoutTail, nextHead) !== -1) {
    return { ...state, invalidMove: true };
  }

  // Eating an apple
  const appleIdx = findIn(state.apples, nextHead);
  const ateApple = appleIdx !== -1;
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

  // Spike check on the new head position
  if (isSpike(workingState, nextHead)) {
    return { ...workingState, failed: true, failReason: "spike" };
  }

  // Gravity: does the snake's head have support beneath it now?
  // Special case — the gap right under the hole is crossable if the
  // snake has grown long enough (simplified length-gate, no physics sim).
  const belowHead = { row: nextHead.row + 1, col: nextHead.col };
  const standingOverHoleGap =
    same(nextHead, workingState.hole) && workingState.worm.length >= workingState.requiresLength;

  const needsFall = inBounds(belowHead) && !isSolidGround(workingState, belowHead) && !standingOverHoleGap;

  if (needsFall) {
    const fallResult = dropUntilSupported(workingState, nextHead);
    if (fallResult.fellOff) {
      return { ...workingState, failed: true, failReason: "fell" };
    }
    if (fallResult.hitSpike) {
      return { ...workingState, failed: true, failReason: "spike" };
    }
    // Shift the whole snake down by however far the head fell
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

  return "sky"; // open air — this is what makes it fall-through
}

export function getCellKey(row, col) {
  return key({ row, col });
}