import {
  EndState,
  GameOverReason,
  GRID_SIZE,
  SHIP_SIZE,
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
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, Vector3 } from "three";

const GRID_WIDTH = 6;
const CELL_SIZE = GRID_WIDTH / GRID_SIZE;

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
        <div className="h-full">
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
          <Canvas
            className="flex flex-col items-center"
            camera={{ position: [0, 10, 0] }}
          >
            <R3FGame onFired={() => setTurnTimer(TURN_DURATION)} />
          </Canvas>
        </div>
      )}
    </>
  );
}

function R3FGame({ onFired }: { onFired: () => void }) {
  const { gameState, onCannonFired } = useGameContext();
  useFrame((state) => {
    state.camera.lookAt(new Vector3(0, 0, 0));
  });

  return (
    <>
      <ambientLight />
      <OrbitControls />
      <OpponentGrid />
      <PlayerGrid />
      <WaterBackground
        onClick={(e: ThreeEvent<MouseEvent>) => {
          const x = e.point.x;
          const z = e.point.z + 3.25;
          const isInOpponentGrid =
            x >= -GRID_WIDTH / 2 &&
            x <= GRID_WIDTH / 2 &&
            z >= -GRID_WIDTH / 2 &&
            z <= GRID_WIDTH / 2;

          if (!isInOpponentGrid || !gameState?.yourTurn) {
            return;
          }

          const col = Math.floor((x + GRID_WIDTH / 2) / CELL_SIZE);
          const row = Math.floor((z + GRID_WIDTH / 2) / CELL_SIZE);

          onCannonFired(row, col);
          onFired();
        }}
      />
    </>
  );
}

function WaterBackground({
  onClick,
}: {
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <mesh
      onClick={onClick}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={new Color("#91f8ec")} />
    </mesh>
  );
}

function OpponentGrid() {
  const { gameState } = useGameContext();

  return (
    gameState && <Grid grid={gameState.opponentGrid} position={[0, 0, -3.25]} />
  );
}

function PlayerGrid() {
  const { gameState } = useGameContext();

  return (
    gameState && (
      <Grid grid={gameState.yourGrid} position={[0, 0, 3.25]}>
        {gameState.yourShipPositions.map((ship) => {
          const rotationY = ship.direction === "horizontal" ? 0 : -Math.PI / 2;

          let positionX = -GRID_SIZE / 2;
          let positionZ = -GRID_SIZE / 2;

          // offset based on size of ship
          positionX +=
            ship.direction === "horizontal"
              ? (SHIP_SIZE[ship.type] * CELL_SIZE) / 2
              : 0;
          positionZ +=
            ship.direction === "vertical"
              ? (SHIP_SIZE[ship.type] * CELL_SIZE) / 2
              : 0;

          // offset based on start position
          positionX += ship.start.x * CELL_SIZE;
          positionZ += ship.start.y * CELL_SIZE;

          // offset to center of cell based on direction
          positionX += ship.direction === "vertical" ? CELL_SIZE / 2 : 0;
          positionZ += ship.direction === "horizontal" ? CELL_SIZE / 2 : 0;

          const position = new Vector3(positionX, 0, positionZ);
          return (
            <mesh
              position={position}
              rotation={[0, rotationY, -Math.PI / 2]}
              key={ship.type}
            >
              <cylinderGeometry args={[0.2, 0.2, SHIP_SIZE[ship.type], 32]} />
              <meshStandardMaterial color="purple" />
            </mesh>
          );
        })}
      </Grid>
    )
  );
}

const Grid = ({
  position = [0, 0, 0],
  children,
  grid,
}: {
  position?: [number, number, number];
  children?: ReactNode;
  grid: number[][];
}) => {
  return (
    <group position={position}>
      <gridHelper
        args={[GRID_WIDTH, GRID_SIZE, "black", "black"]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <mesh
            key={`${rowIndex}-${colIndex}`}
            position={[
              (colIndex / GRID_SIZE) * GRID_WIDTH -
                GRID_WIDTH / 2 +
                CELL_SIZE / 2,
              0,
              (rowIndex / GRID_SIZE) * GRID_WIDTH -
                GRID_WIDTH / 2 +
                CELL_SIZE / 2,
            ]}
          >
            <sphereGeometry args={[0.2, 32, 16]} />
            <meshStandardMaterial
              color={
                cell === 1 ? "red" : cell === 2 ? "gray" : new Color("#91f8ec")
              }
            />
          </mesh>
        )),
      )}
      {children}
    </group>
  );
};

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
