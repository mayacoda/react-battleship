import {
  EndState,
  GameOverReason,
  GRID_SIZE,
  SHIP_NAMES,
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
import { Clone, Float, Html, useAnimations, useGLTF } from "@react-three/drei";
import { MeshStandardMaterial, Vector3 } from "three";
import { animated, useSpring } from "@react-spring/three";
import { WaterPlane } from "@/components/ui/WaterPlane.tsx";

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
          <h1 className="text-2xl flex flex-row justify-between mt-2 px-2 absolute z-10 w-full">
            <Badge
              variant={gameState?.yourTurn ? "default" : "outline"}
              className={"text-white"}
            >
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
  const [cannonStart] = useState(new Vector3());
  const [cannonEnd, setCannonEnd] = useState(new Vector3());
  const [showCannon, setShowCannon] = useState(false);
  const cannonDuration = 500;
  useFrame((state) => {
    state.camera.lookAt(new Vector3(0, 0, 0));
  });

  return (
    <>
      {/*<OrbitControls />*/}
      <ambientLight />
      <directionalLight position={[0, 10, 0]} intensity={1} />
      <OpponentGrid />
      <PlayerGrid />
      {showCannon && (
        <CannonBall
          start={cannonStart}
          end={cannonEnd}
          duration={cannonDuration}
        />
      )}
      <WaterBackground
        onClick={(e: ThreeEvent<MouseEvent>) => {
          const x = e.point.x;
          const z = e.point.z + 3.25;
          const isInOpponentGrid =
            x >= -GRID_WIDTH / 2 &&
            x <= GRID_WIDTH / 2 &&
            z >= -GRID_WIDTH / 2 &&
            z <= GRID_WIDTH / 2;

          if (!isInOpponentGrid || !gameState?.yourTurn || showCannon) {
            return;
          }

          const col = Math.floor((x + GRID_WIDTH / 2) / CELL_SIZE);
          const row = Math.floor((z + GRID_WIDTH / 2) / CELL_SIZE);

          setShowCannon(true);
          setCannonEnd(e.point.clone());

          setTimeout(() => {
            setShowCannon(false);
            onCannonFired(row, col);
            onFired();
          }, cannonDuration + 200);
        }}
      />
    </>
  );
}

function CannonBall({
  start,
  end,
  duration,
}: {
  start: Vector3;
  end: Vector3;
  duration: number;
}) {
  const [state] = useState({
    from: { position: start.toArray() },
    to: async (next: (config: unknown) => Promise<void>) => {
      const peakHeight = 2;

      // Linearly interpolate the x and z positions
      for (let t = 0; t <= 1; t += 0.01) {
        const x = start.x + (end.x - start.x) * t;
        const z = start.z + (end.z - start.z) * t;
        // Calculate the y position for a parabolic trajectory
        const y = start.y + peakHeight * Math.sin(Math.PI * t);
        await next({ position: [x, y, z] });
      }
    },
    reset: false,
    config: { duration: duration / 1000 },
  });

  const { position } = useSpring(state);

  return (
    <animated.mesh position={position}>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color="black" />
    </animated.mesh>
  );
}

function WaterBackground({
  onClick,
}: {
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <WaterPlane
      size={200}
      onClick={onClick}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
    />
  );
}

function OpponentGrid() {
  const { gameState } = useGameContext();
  const [text, setText] = useState("");

  useEffect(() => {
    if (gameState?.yourTurn) {
      setText("Tap on enemy's grid to fire! 💣");
    } else {
      setText("");
    }
  }, [gameState?.yourTurn]);

  return (
    gameState && (
      <>
        <Html
          zIndexRange={[0, 10]}
          transform={true}
          rotation={[-Math.PI / 3, 0, 0]}
          position={[0, 0, -3.5 - GRID_WIDTH / 2]}
        >
          <p className={"text-white"}>{text}</p>
        </Html>
        <Grid grid={gameState.opponentGrid} position={[0, 0, -3.25]} />
      </>
    )
  );
}

function PlayerGrid() {
  const { gameState } = useGameContext();
  const ships = useGLTF("/models/ships.glb");

  // @ts-expect-error exported by blender
  const material: MeshStandardMaterial = ships.materials.ships;

  material.metalness = 0;
  material.roughness = 1;

  return (
    gameState && (
      <>
        <Html
          transform={true}
          rotation={[-Math.PI / 3, 0, 0]}
          zIndexRange={[0, 10]}
        >
          <p className={"text-white"}>Your Ships</p>
        </Html>
        <Grid grid={gameState.yourGrid} position={[0, 0, 3.25]}>
          {gameState.yourShipPositions.map((ship) => {
            const model = ships.scene.children.find(
              (child) => child.name === SHIP_NAMES[ship.type],
            );
            const rotationY =
              ship.direction === "horizontal" ? 0 : -Math.PI / 2;

            let positionZ = -GRID_SIZE / 2;
            let positionX = -GRID_SIZE / 2;

            // offset based on size of ship
            positionZ +=
              ship.direction === "horizontal"
                ? (SHIP_SIZE[ship.type] * CELL_SIZE) / 2
                : 0;
            positionX +=
              ship.direction === "vertical"
                ? (SHIP_SIZE[ship.type] * CELL_SIZE) / 2
                : 0;

            // offset based on start position
            positionZ += ship.start.x * CELL_SIZE;
            positionX += ship.start.y * CELL_SIZE;

            // offset to center of cell based on direction
            positionZ += ship.direction === "vertical" ? CELL_SIZE / 2 : 0;
            positionX += ship.direction === "horizontal" ? CELL_SIZE / 2 : 0;

            const position = new Vector3(positionX, 0.1, positionZ);
            return (
              model && (
                <Float speed={4} rotationIntensity={0.2} key={ship.type}>
                  <Clone
                    object={model}
                    position={position}
                    rotation={[0, rotationY, 0]}
                  />
                </Float>
              )
            );
          })}
        </Grid>
      </>
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
  const fire = useGLTF("/models/fire.glb");
  const animations = useAnimations(fire.animations, fire.scene);

  useEffect(() => {
    const action = animations.actions[animations.names[0]];
    action?.play();
  }, [animations]);

  return (
    <group position={position}>
      <gridHelper
        args={[GRID_WIDTH, GRID_SIZE, "white", "white"]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const position = new Vector3(
            (colIndex / GRID_SIZE) * GRID_WIDTH -
              GRID_WIDTH / 2 +
              CELL_SIZE / 2,
            0.3,
            (rowIndex / GRID_SIZE) * GRID_WIDTH -
              GRID_WIDTH / 2 +
              CELL_SIZE / 2,
          ).toArray();
          return (
            <group key={`${rowIndex}-${colIndex}`} position={position}>
              {cell === 1 && (
                <Clone
                  object={fire.scene}
                  position={[-5.65, -0.1, -3.3]}
                  scale={[2, 1, 2]}
                />
              )}
              {cell === 2 && (
                <Float rotationIntensity={3} speed={3}>
                  <Html
                    transform={true}
                    rotation={[Math.PI / 2, 0, 0]}
                    zIndexRange={[0, 10]}
                  >
                    <div className={"text-blue-300"}>ⓧ</div>
                  </Html>
                </Float>
              )}
            </group>
          );
        }),
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
