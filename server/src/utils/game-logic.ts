import { GRID_SIZE, Ship, SHIP_SIZE, SHIP_TYPE } from "@react-battleship/types";

export function placeShip(grid: number[][], type: SHIP_TYPE): Ship {
  const x = Math.floor(Math.random() * (GRID_SIZE - 1));
  const y = Math.floor(Math.random() * (GRID_SIZE - 1));
  const direction = Math.floor(Math.random() * 2);
  const size = SHIP_SIZE[type];
  let valid = true;
  for (let i = 0; i < size; i++) {
    if (direction === 0) {
      if (x + i >= GRID_SIZE || grid[x + i][y] !== 0) {
        valid = false;
      }
    } else {
      if (y + i >= GRID_SIZE || grid[x][y + i] !== 0) {
        valid = false;
      }
    }
  }
  if (valid) {
    for (let i = 0; i < size; i++) {
      if (direction === 0) {
        grid[x + i][y] = size;
      } else {
        grid[x][y + i] = size;
      }
    }
    return {
      start: { x, y },
      direction: direction === 0 ? "horizontal" : "vertical",
      type,
    };
  } else {
    return placeShip(grid, type);
  }
}
