export const GRID_SIZE = 5;

export const BOMB = "bomb";

// ---------------------------------------------------------
// EMPTY GRID
// ---------------------------------------------------------

export function createEmptyGrid() {
  return Array.from(
    { length: GRID_SIZE },
    () => Array.from({ length: GRID_SIZE }, () => 0),
  );
}

// ---------------------------------------------------------
// EMPTY CELLS
// ---------------------------------------------------------

function getEmptyCells(grid) {
  const cells = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) {
        cells.push([r, c]);
      }
    }
  }

  return cells;
}

// ---------------------------------------------------------
// RANDOM TILE
// ---------------------------------------------------------

export function addRandomTile(grid) {
  const empty = getEmptyCells(grid);

  if (empty.length === 0) {
    return grid;
  }

  const [r, c] =
    empty[Math.floor(Math.random() * empty.length)];

  const newGrid = grid.map((row) => [...row]);

  newGrid[r][c] =
    Math.random() < 0.9 ? 2 : 4;

  return newGrid;
}

// ---------------------------------------------------------
// BOMB
// ---------------------------------------------------------

export function addBombTile(grid) {
  const empty = getEmptyCells(grid);

  if (empty.length === 0) {
    return grid;
  }

  const [r, c] =
    empty[Math.floor(Math.random() * empty.length)];

  const newGrid = grid.map((row) => [...row]);

  newGrid[r][c] = BOMB;

  return newGrid;
}

// ---------------------------------------------------------
// DETONATE BOMB
// ---------------------------------------------------------

export function detonateBomb(
  grid,
  row,
  col,
  clearCount = 2,
) {
  const newGrid = grid.map((r) => [...r]);

  let bonus = 25;

  // Remove bomb.
  newGrid[row][col] = 0;

  const candidates = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (
        !(r === row && c === col) &&
        newGrid[r][c] !== 0 &&
        newGrid[r][c] !== BOMB
      ) {
        candidates.push([r, c]);
      }
    }
  }

  // Shuffle candidates.
  for (
    let i = candidates.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [candidates[i], candidates[j]] = [
      candidates[j],
      candidates[i],
    ];
  }

  // Remove selected tiles.
  candidates
    .slice(0, clearCount)
    .forEach(([r, c]) => {
      bonus += newGrid[r][c];
      newGrid[r][c] = 0;
    });

  return {
    grid: newGrid,
    bonus,
  };
}

// ---------------------------------------------------------
// INITIAL GRID
// ---------------------------------------------------------

export function createInitialGrid() {
  let grid = createEmptyGrid();

  grid = addRandomTile(grid);
  grid = addRandomTile(grid);

  return grid;
}

// ---------------------------------------------------------
// SLIDE + MERGE
// ---------------------------------------------------------

function slideRowLeft(row, rowIndex) {
  const filtered = row
    .map((value, index) => ({
      value,
      index,
    }))
    .filter(
      (item) => item.value !== 0,
    );

  const result = [];
  const merges = [];

  let scoreGained = 0;

  for (
    let i = 0;
    i < filtered.length;
    i++
  ) {
    const current = filtered[i];
    const next = filtered[i + 1];

    if (
      next &&
      current.value === next.value &&
      current.value !== BOMB
    ) {
      const mergedValue =
        current.value * 2;

      const destinationCol =
        result.length;

      result.push(mergedValue);

      scoreGained += mergedValue;

      merges.push({
        row: rowIndex,
        col: destinationCol,
        value: mergedValue,

        sources: [
          {
            row: rowIndex,
            col: current.index,
            value: current.value,
          },
          {
            row: rowIndex,
            col: next.index,
            value: next.value,
          },
        ],
      });

      i++;
    } else {
      result.push(current.value);
    }
  }

  while (result.length < GRID_SIZE) {
    result.push(0);
  }

  const moved = row.some(
    (value, index) =>
      value !== result[index],
  );

  return {
    row: result,
    scoreGained,
    moved,
    merges,
  };
}

// ---------------------------------------------------------
// ROTATION
// ---------------------------------------------------------

function rotateGridClockwise(grid) {
  const newGrid = createEmptyGrid();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][
        GRID_SIZE - 1 - r
      ] = grid[r][c];
    }
  }

  return newGrid;
}

// ---------------------------------------------------------
// ROTATE POSITION BACK
// ---------------------------------------------------------

function rotatePositionCounterClockwise(
  row,
  col,
  steps,
) {
  let r = row;
  let c = col;

  for (let i = 0; i < steps; i++) {
    const newR =
      GRID_SIZE - 1 - c;

    const newC = r;

    r = newR;
    c = newC;
  }

  return {
    row: r,
    col: c,
  };
}

// ---------------------------------------------------------
// MOVE
// ---------------------------------------------------------

export function move(grid, direction) {
  const rotations = {
    left: 0,
    up: 1,
    right: 2,
    down: 3,
  };

  const steps = rotations[direction];

  let rotated = grid;

  // Rotate into left-slide orientation.
  for (let i = 0; i < steps; i++) {
    rotated =
      rotateGridClockwise(rotated);
  }

  let totalScore = 0;
  let anyMoved = false;

  const allMerges = [];

  const slidGrid = rotated.map(
    (row, rowIndex) => {
      const result = slideRowLeft(
        row,
        rowIndex,
      );

      totalScore +=
        result.scoreGained;

      if (result.moved) {
        anyMoved = true;
      }

      result.merges.forEach(
        (merge) => {
          const target =
            rotatePositionCounterClockwise(
              merge.row,
              merge.col,
              steps,
            );

          const sources =
            merge.sources.map(
              (source) => {
                const position =
                  rotatePositionCounterClockwise(
                    source.row,
                    source.col,
                    steps,
                  );

                return {
                  row: position.row,
                  col: position.col,
                  value: source.value,
                };
              },
            );

          allMerges.push({
            row: target.row,
            col: target.col,
            value: merge.value,
            sources,
          });
        },
      );

      return result.row;
    },
  );

  let result = slidGrid;

  // Rotate back.
  for (
    let i = 0;
    i < (4 - steps) % 4;
    i++
  ) {
    result =
      rotateGridClockwise(result);
  }

  return {
    grid: result,
    scoreGained: totalScore,
    moved: anyMoved,
    merges: allMerges,
  };
}

// ---------------------------------------------------------
// GAME OVER
// ---------------------------------------------------------

export function isGameOver(grid) {
  // Any empty cell means the player can still continue.
  if (getEmptyCells(grid).length > 0) {
    return false;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = grid[r][c];

      // A bomb is always a possible action.
      if (value === BOMB) {
        return false;
      }

      if (c < GRID_SIZE - 1) {
        const right = grid[r][c + 1];

        if (
          right !== BOMB &&
          right === value
        ) {
          return false;
        }
      }

      if (r < GRID_SIZE - 1) {
        const down = grid[r + 1][c];

        if (
          down !== BOMB &&
          down === value
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

// ---------------------------------------------------------
// REVIVE
// ---------------------------------------------------------

export function reviveGrid(
  grid,
  tilesToClear = 4,
) {
  const numeric = (value) =>
    value === BOMB ? -1 : value;

  const positions = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== 0) {
        positions.push({
          r,
          c,
          v: grid[r][c],
        });
      }
    }
  }

  positions.sort(
    (a, b) =>
      numeric(a.v) - numeric(b.v),
  );

  const newGrid = grid.map(
    (row) => [...row],
  );

  positions
    .slice(0, tilesToClear)
    .forEach(({ r, c }) => {
      newGrid[r][c] = 0;
    });

  return newGrid;
}

// ---------------------------------------------------------
// REWARD
// ---------------------------------------------------------

export function calculateReward(score) {
  return Math.max(
    5,
    Math.round(score / 25),
  );
}