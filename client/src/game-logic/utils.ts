import { GRID_SIZE } from "@react-battleship/types";

export function createEmptyGrid<T>(seed?: T): T[][] {
  return Array(GRID_SIZE)
    .fill(seed)
    .map(() => Array(GRID_SIZE).fill(seed));
}
