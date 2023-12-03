import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ChallengeAlert } from "@/components/ui/ChallengeAlert.tsx";
import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useGameContext } from "@/game-logic/useGameContext.tsx";
import withSocketProtection from "@/pages/withSocketProtection.tsx";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Player } from "@react-battleship/types";
import { Html, OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Group, Mesh, Object3D, Quaternion, Vector3 } from "three";

export const ProtectedLobbyPage = withSocketProtection(LobbyPage);

export function LobbyPage() {
  return (
    <>
      <ChallengeAlert />
      <div className="flex flex-col h-screen">
        {/*<PrototypeLobby />*/}
        <R3FLobbyWrapper />
      </div>
    </>
  );
}

function PrototypeLobby() {
  const game = useGameContext();
  const [show, setShow] = useState(false);
  const onChallenge = useCallback(
    (playerId: string) => {
      game.socket.emit("challenge", playerId);
    },
    [game.socket],
  );
  const players = Object.values(game.players);

  return (
    <>
      <Button onClick={() => setShow((prev) => !prev)}>
        {show ? "hide" : "show"}
      </Button>
      {show && (
        <Table className="fixed z-10">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell>{player.name}</TableCell>
                <TableCell>
                  {player.isPlaying ? (
                    <Badge>Playing</Badge>
                  ) : player.id !== game.currentPlayer?.id ? (
                    <Button size="sm" onClick={() => onChallenge(player.id)}>
                      Challenge
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function R3FLobbyWrapper() {
  return (
    <Canvas>
      <R3FLobby />
    </Canvas>
  );
}

function R3FLobby() {
  const game = useGameContext();
  const [target, setTarget] = useState<Vector3>();
  const [smoothTarget] = useState(() => new Vector3());
  const { raycaster, camera, pointer } = useThree();
  const planeRef = useRef<Mesh>(null);
  const playerRef = useRef<Group>(null);
  const currentPlayer = game.currentPlayer;
  const onChallenge = useCallback(
    (playerId: string) => {
      if (playerId !== currentPlayer?.id) {
        game.socket.emit("challenge", playerId);
      }
    },
    [game.socket, currentPlayer?.id],
  );
  const players = Object.values(game.players).filter(
    (player) => player.id !== currentPlayer?.id,
  );

  const handlePlaneClick = (event: ThreeEvent<MouseEvent>) => {
    if (!planeRef.current || !currentPlayer) return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects([planeRef.current]);
    if (intersects.length > 0) {
      const { x, y, z } = currentPlayer.position;
      const direction = new Vector3().subVectors(
        intersects[0].point,
        new Vector3(x, y, z),
      );
      const distance = direction.length();
      direction.normalize();
      direction.multiplyScalar(Math.min(distance, 3));

      setTarget(direction.add(new Vector3(x, y, z)));
    }
  };

  useFrame((_state, delta) => {
    if (target && playerRef.current) {
      smoothTarget.lerp(target, 5 * delta);
      game.socket.emit("move", smoothTarget);

      const mock = new Object3D();
      mock.position.copy(playerRef.current.position);
      mock.lookAt(smoothTarget);

      const targetQuaternion = mock.quaternion.clone();

      playerRef.current.quaternion.slerp(targetQuaternion, 10 * delta);
      game.socket.emit("rotation", {
        x: playerRef.current.quaternion.x,
        y: playerRef.current.quaternion.y,
        z: playerRef.current.quaternion.z,
        w: playerRef.current.quaternion.w,
      });

      if (new Vector3().subVectors(smoothTarget, target).length() < 0.1) {
        setTarget(undefined);
      }
    }
  });

  return (
    <>
      <Perf />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} />
      <OrbitControls />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        ref={planeRef}
        onClick={handlePlaneClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
      <ControlledPlayerSphere player={currentPlayer!} ref={playerRef} />
      {players.map((player) => (
        <OtherPlayer
          key={player.id}
          player={player}
          onChallenge={onChallenge}
        />
      ))}
    </>
  );
}

const ControlledPlayerSphere = forwardRef<Group, { player: Player }>(
  ({ player }, ref) => {
    const [smoothedCameraPosition] = useState(
      () =>
        new Vector3(player.position.x, player.position.y, player.position.z),
    );
    const [smoothedCameraTarget] = useState(() => new Vector3());
    const playerMesh = useRef<Group>(null);

    useImperativeHandle(ref, () => playerMesh.current!);

    useFrame((state, delta) => {
      if (!playerMesh.current) return;

      const position = playerMesh.current.position;
      const cameraPosition = new Vector3();
      cameraPosition.copy(position);
      cameraPosition.z += 2.25;
      cameraPosition.y += 1.65;

      const cameraTarget = new Vector3();
      cameraTarget.copy(position);
      cameraTarget.y += 0.25;

      smoothedCameraPosition.lerp(cameraPosition, 5 * delta);
      smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

      state.camera.position.copy(smoothedCameraPosition);
      state.camera.lookAt(smoothedCameraTarget);
    });

    const { x, y, z, w } = player.rotation;

    return (
      <PlayerObject
        ref={playerMesh}
        color={"yellow"}
        position={[player.position.x, player.position.y, player.position.z]}
        quaternion={[x, y, z, w]}
      />
    );
  },
);

function OtherPlayer({
  player,
  onChallenge,
}: {
  player: Player;
  onChallenge: (playerId: string) => void;
}) {
  const [showChallengeButton, setShowChallengeButton] = useState(false);

  useEffect(() => {
    if (showChallengeButton) {
      const timer = setTimeout(() => {
        setShowChallengeButton(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [showChallengeButton]);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setShowChallengeButton((prev) => !prev);
      }}
    >
      <PlayerObject
        color={player.isPlaying ? "red" : "green"}
        quaternion={[
          player.rotation.x,
          player.rotation.y,
          player.rotation.z,
          player.rotation.w,
        ]}
        position={[player.position.x, player.position.y, player.position.z]}
      >
        <Html style={{ pointerEvents: "none" }} zIndexRange={[0, 40]}>
          <div
            style={{
              transform: "translate3d(-50%, -70px, 0)",
              width: "120px",
              textAlign: "center",
            }}
          >
            <p>{player.name}</p>
            {showChallengeButton && (
              <Button
                style={{ pointerEvents: "all" }}
                onClick={() => onChallenge(player.id)}
              >
                Challenge
              </Button>
            )}
          </div>
        </Html>
      </PlayerObject>
    </group>
  );
}

const PlayerObject = forwardRef<
  Group,
  {
    color: string;
    quaternion: [number, number, number, number] | Quaternion;
    position: [number, number, number];
    children?: ReactNode;
  }
>(({ color, position, quaternion, children }, ref) => {
  return (
    <group position={position} quaternion={quaternion} ref={ref}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={color} />
        {children}
      </mesh>
    </group>
  );
});
