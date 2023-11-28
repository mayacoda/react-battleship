import {
  EndState,
  GameOverReason,
  GRID_SIZE,
  SHIP_TYPE,
} from "@react-battleship/types";
import { useGameContext } from "@/game-logic/useGameContext.tsx";
import { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import withSocketProtection from "@/pages/withSocketProtection.tsx";
import { Button } from "@/components/ui/button.tsx";

const cellSize = `${100 / GRID_SIZE}vw`;

export const ProtectedGamePage = withSocketProtection(GamePage);

export function GamePage() {
  const { gameState, socket, currentPlayer, onGameFinished, onForfeit } =
    useGameContext();
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>();

  socket?.on("gameOver", (result: EndState) => {
    if (currentPlayer) {
      const reason = result[currentPlayer.id];
      setGameOverReason(reason);
    }
  });

  return (
    <>
      {gameOverReason && (
        <GameOverAlert
          gameOverReason={gameOverReason}
          onConfirm={onGameFinished}
        />
      )}
      {gameState && (
        <div>
          <h1 className="text-2xl">
            Playing against {gameState?.opponent.name}
          </h1>
          <Button onClick={onForfeit}>Forfeit</Button>
          <p>It's {gameState?.yourTurn ? "your" : "opponent's"} turn</p>
          <p>{gameState?.opponent.name}'s Ships</p>
          <OpponentGrid />
          <p>Your Ships</p>
          <PlayerGrid />
        </div>
      )}
    </>
  );
}

function OpponentGrid() {
  const { onCannonFired, gameState } = useGameContext();
  const handleCellClick = (row: number, col: number) => {
    onCannonFired(row, col);
  };

  return (
    gameState && (
      <Grid handleCellClick={handleCellClick} grid={gameState.opponentGrid} />
    )
  );
}

function PlayerGrid() {
  const { gameState } = useGameContext();

  const getCell = (row: number, col: number) => {
    switch (gameState?.yourShips[row][col]) {
      case SHIP_TYPE.BATTLESHIP:
        return "B";
      case SHIP_TYPE.CRUISER:
        return "C";
      case SHIP_TYPE.SUBMARINE:
        return "S";
      case SHIP_TYPE.CARRIER:
        return "A";
      default:
        return null;
    }
  };

  return gameState && <Grid grid={gameState.yourGrid} getCell={getCell} />;
}

function Grid({
  handleCellClick,
  getCell,
  grid,
}: {
  handleCellClick?: (row: number, col: number) => void;
  getCell?: (row: number, col: number) => ReactNode;
  grid: number[][];
}) {
  return (
    <div
      style={{
        maxWidth: "100vw",
        height: "100vw",
        maxHeight: "100vh",
        width: "100vh",
      }}
      className={`grid grid-cols-6 gap-0`}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleCellClick?.(rowIndex, colIndex)}
            style={{
              width: cellSize,
              height: cellSize,
            }}
            className={`${
              cell === 1
                ? "bg-red-400"
                : cell === 2
                ? "bg-gray-300"
                : "bg-blue-200"
            } border border-blue-300 flex justify-center items-center`}
          >
            {getCell?.(rowIndex, colIndex)}
          </div>
        )),
      )}
    </div>
  );
}

function GameOverAlert({
  gameOverReason,
  onConfirm,
}: {
  gameOverReason: GameOverReason;
  onConfirm: () => void;
}) {
  let text = "";
  switch (gameOverReason) {
    case "win":
      text = `You won! ✨`;
      break;
    case "lose":
      text = `You lost! 😢`;
      break;
    case "forfeit":
      text = `You forfeited! 😱`;
      break;
    case "disconnect":
      text = `Your opponent disconnected! 💔`;
      break;
  }

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogTitle>Game Over</AlertDialogTitle>
        <AlertDialogDescription>{text}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>Okay</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
