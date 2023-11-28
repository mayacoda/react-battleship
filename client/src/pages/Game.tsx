import {
  EndState,
  GameOverReason,
  GRID_SIZE,
  SHIP_TYPE,
} from "@react-battleship/types";
import { useGameContext } from "@/game-logic/useGameContext.tsx";
import { ReactNode, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge.tsx";

const GRID_WIDTH = 90;
const CELL_SIZE = `${GRID_WIDTH / GRID_SIZE}vw`;
const TURN_DURATION = 7;

export const ProtectedGamePage = withSocketProtection(GamePage);

export function GamePage() {
  const {
    gameState,
    socket,
    currentPlayer,
    onGameFinished,
    onForfeit,
    onCannonFired,
  } = useGameContext();
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>();
  const [turnTimer, setTurnTimer] = useState(TURN_DURATION);

  socket?.on("gameOver", (result: EndState) => {
    if (currentPlayer) {
      const reason = result[currentPlayer.id];
      setGameOverReason(reason);
    }
  });

  useEffect(() => {
    if (gameState?.yourTurn) {
      const interval = setInterval(() => {
        setTurnTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState?.yourTurn]);

  useEffect(() => {
    if (turnTimer === 0) {
      // random x and y on the grid
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      onCannonFired(x, y);
      setTurnTimer(TURN_DURATION);
    }
  }, [gameState?.yourTurn, onCannonFired, turnTimer]);

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
          <h1 className="text-2xl flex flex-row justify-between mt-2 px-2">
            <Badge variant={gameState?.yourTurn ? "default" : "outline"}>
              {gameState?.yourTurn
                ? `Turn ends in ${turnTimer}`
                : "Opponent's turn"}
            </Badge>
            <Button variant="destructive" onClick={onForfeit}>
              Forfeit
            </Button>
          </h1>

          <div className="flex flex-col items-center">
            <p>{gameState?.opponent.name}'s Ships</p>
            <OpponentGrid onFired={() => setTurnTimer(TURN_DURATION)} />
            <p className="mt-4">Your Ships</p>
            <PlayerGrid />
          </div>
        </div>
      )}
    </>
  );
}

function OpponentGrid({ onFired }: { onFired: () => void }) {
  const { onCannonFired, gameState } = useGameContext();
  const handleCellClick = (row: number, col: number) => {
    onCannonFired(row, col);
    onFired();
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
        width: GRID_WIDTH + "vw",
        maxWidth: GRID_WIDTH + "vw",
        height: GRID_WIDTH + "vw",
        maxHeight: GRID_WIDTH + "vw",
      }}
      className={`grid grid-cols-6 gap-0`}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleCellClick?.(rowIndex, colIndex)}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
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
