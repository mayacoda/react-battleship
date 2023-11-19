import { GRID_SIZE } from "@react-battleship/types";
import { useParams } from "react-router-dom";

const createEmptyGrid = () =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

const grid = createEmptyGrid();
const cellSize = `${100 / GRID_SIZE}vw`;

const GamePage = () => {
  const { gameId } = useParams();
  // Example function to handle cell click
  const handleCellClick = (row: number, col: number) => {
    console.log("clicked", row, col);
    // Implement logic to make a move
  };

  return (
    <div>
      <h1 className="text-2xl">Game: {gameId}</h1>
      <div
        style={{
          maxWidth: "100vw",
          height: "100vw",
          maxHeight: "100vh",
          width: "100vh",
        }}
        className="grid grid-cols-5 gap-0"
      >
        {grid.map((row, rowIndex) =>
          row.map((_cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{ width: cellSize, height: cellSize }}
              className="bg-blue-200 border border-blue-300"
            >
              {/* Display cell status */}
            </div>
          )),
        )}
      </div>
    </div>
  );
};

export default GamePage;
