import { PlayerDTO } from '@dtos';

type ScoreResult = {
  userId: string;
  icon?: string;
  block: number;
  point: number;
};

function getAntidiagonals(grid: string[][]): Map<string, string[]> {
  const antidiagonals = new Map<string, string[]>();
  const rows = grid.length;
  const cols = grid[0].length;

  // from top row, right to left
  for (let start = 0; start < cols; start++) {
    const antidiagonal: string[] = [];
    let x = 0;
    let y = start;
    const key = `(${x},${y})`;
    while (x < rows && y >= 0) {
      antidiagonal.push(grid[x][y]);
      x++;
      y--;
    }
    antidiagonals.set(key, antidiagonal);
  }

  // from right column, top to bottom (skip 0,cols-1 because already counted)
  for (let start = 1; start < rows; start++) {
    const antidiagonal: string[] = [];
    let x = start;
    let y = cols - 1;
    const key = `(${x},${y})`;
    while (x < rows && y >= 0) {
      antidiagonal.push(grid[x][y]);
      x++;
      y--;
    }
    antidiagonals.set(key, antidiagonal);
  }

  return antidiagonals;
}

function getDiagonalsTopRow(grid: string[][]): Map<string, string[]> {
  const diagonals = new Map<string, string[]>();
  const rows = grid.length;
  const cols = grid[0].length;

  // from top row, left to right
  for (let start = 0; start < cols; start++) {
    const diagonal: string[] = [];
    let x = 0;
    let y = start;
    const key = `(${x},${y})`;
    while (x < rows && y < cols) {
      diagonal.push(grid[x][y]);
      x++;
      y++;
    }
    diagonals.set(key, diagonal);
  }

  return diagonals;
}

function getDiagonalsLeftColumn(grid: string[][]): Map<string, string[]> {
  const diagonals = new Map<string, string[]>();
  const rows = grid.length;
  const cols = grid[0].length;

  // from left column, top to bottom
  for (let start = 0; start < rows; start++) {
    const diagonal: string[] = [];
    let x = start;
    let y = 0;
    const key = `(${x},${y})`;
    while (x < rows && y < cols) {
      diagonal.push(grid[x][y]);
      x++;
      y++;
    }
    diagonals.set(key, diagonal);
  }

  return diagonals;
}

function getAllDiagonals(grid: string[][]): Map<string, string[]> {
  const diagonals = new Map<string, string[]>();

  const topRowDiagonals = getDiagonalsTopRow(grid);
  topRowDiagonals.forEach((diagonal, key) => diagonals.set(key, diagonal));

  const leftColumnDiagonals = getDiagonalsLeftColumn(grid);
  leftColumnDiagonals.forEach((diagonal, key) => diagonals.set(key, diagonal));

  return diagonals;
}

// ---- Main scoring function (icon-based) ----

export function calculateScores(
  grid: string[][],
  players: PlayerDTO[],
): ScoreResult[] {
  const gridSize = grid.length;
  const results: ScoreResult[] = [];

  const diagonals = getAllDiagonals(grid);
  const antidiagonals = getAntidiagonals(grid);

  players.forEach((player) => {
    const playerIcon = player.icon;

    // if player has no icon yet, skip scoring
    if (!playerIcon) {
      results.push({
        userId: player.userId.toString(),
        icon: player.icon,
        block: 0,
        point: 0,
      });
      return;
    }

    const completedBlocks = new Set<string>();
    let playerScore = 0;

    // ✅ ROWS
    for (let i = 0; i < gridSize; i++) {
      if (grid[i].every((cell) => cell === playerIcon)) {
        playerScore++;
        for (let j = 0; j < gridSize; j++) {
          completedBlocks.add(`${i},${j}`);
        }
      }
    }

    // ✅ COLUMNS
    for (let j = 0; j < gridSize; j++) {
      let allMatch = true;
      for (let i = 0; i < gridSize; i++) {
        if (grid[i][j] !== playerIcon) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        playerScore++;
        for (let i = 0; i < gridSize; i++) {
          completedBlocks.add(`${i},${j}`);
        }
      }
    }

    // ✅ ALL DIAGONALS
    for (const [key, diagonal] of diagonals) {
      if (diagonal.length > 1) {
        const allMatch = diagonal.every((cell) => cell === playerIcon);
        if (allMatch) {
          playerScore++;
          const [startX, startY] = key.match(/\d+/g)?.map(Number);
          for (let i = 0; i < diagonal.length; i++) {
            const x = startX + i;
            const y = startY + i;
            completedBlocks.add(`${x},${y}`);
          }
        }
      }
    }

    // ✅ ALL ANTI-DIAGONALS
    for (const [key, antidiagonal] of antidiagonals) {
      if (antidiagonal.length > 1) {
        const allMatch = antidiagonal.every((cell) => cell === playerIcon);
        if (allMatch) {
          playerScore++;
          const [startX, startY] = key.match(/\d+/g)?.map(Number);
          for (let i = 0; i < antidiagonal.length; i++) {
            const x = startX + i;
            const y = startY - i;
            completedBlocks.add(`${x},${y}`);
          }
        }
      }
    }

    results.push({
      userId: player.userId.toString(),
      icon: playerIcon,
      block: completedBlocks.size,
      point: playerScore,
    });
  });

  return results;
}
