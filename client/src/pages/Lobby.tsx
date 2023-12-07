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
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Player } from "@react-battleship/types";
import { Clone, Float, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { WaterPlane } from "@/components/ui/WaterPlane.tsx";
import { Badge } from "@/components/ui/badge.tsx";

export const ProtectedLobbyPage = withSocketProtection(LobbyPage);

export function LobbyPage() {
  return (
    <>
      <ChallengeAlert />
      <div className="flex flex-col h-screen">
        <R3FLobbyWrapper />
      </div>
    </>
  );
}

function R3FLobbyWrapper() {
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: `
        linear-gradient(
  0deg,
  hsl(306deg 100% 83%) 0%,
  hsl(294deg 100% 83%) 11%,
  hsl(282deg 100% 83%) 22%,
  hsl(270deg 100% 83%) 33%,
  hsl(258deg 100% 82%) 44%,
  hsl(247deg 100% 82%) 56%,
  hsl(235deg 100% 82%) 67%,
  hsl(223deg 100% 82%) 78%,
  hsl(211deg 100% 82%) 89%,
  hsl(199deg 100% 81%) 100%
)`,
      }}
    >
      <Canvas>
        <R3FLobby />
      </Canvas>
    </div>
  );
}

function R3FLobby() {
  const game = useGameContext();
  const [target, setTarget] = useState<Vector3>();
  const [smoothTarget] = useState(() => new Vector3());
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

    const { x, y, z } = currentPlayer.position;
    const direction = new Vector3().subVectors(
      event.point,
      new Vector3(x, y, z),
    );
    const distance = direction.length();
    direction.normalize();
    direction.multiplyScalar(Math.min(distance, 3));

    setTarget(direction.add(new Vector3(x, y, z)));
    // }
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
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={3.5} castShadow />
      <OrbitControls />
      <WaterPlane
        ref={planeRef}
        size={100}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        onClick={handlePlaneClick}
      />
      <ControlledPlayer player={currentPlayer!} ref={playerRef} />
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

const ControlledPlayer = forwardRef<Group, { player: Player }>(
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
        if (!player.isPlaying) {
          setShowChallengeButton((prev) => !prev);
        }
      }}
    >
      <PlayerObject
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
            className="flex flex-col gap-2"
            style={{
              transform: "translate3d(-50%, -70px, 0)",
              width: "120px",
              textAlign: "center",
            }}
          >
            <Badge
              className="text-center justify-evenly"
              variant={player.isPlaying ? "secondary" : "default"}
            >
              {player.name}
            </Badge>
            {showChallengeButton && (
              <button
                className="text-4xl bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                style={{
                  pointerEvents: "all",
                  borderRadius: "50%",
                  padding: "15px",
                  width: "70px",
                  height: "70px",
                }}
                onClick={() => {
                  if (!player.isPlaying) {
                    onChallenge(player.id);
                  }
                }}
              >
                💣
              </button>
            )}
          </div>
        </Html>
      </PlayerObject>
    </group>
  );
}

export const PlayerObject = forwardRef<
  Group,
  {
    quaternion: [number, number, number, number] | Quaternion;
    position: [number, number, number];
    rotation?: [number, number, number];
    children?: ReactNode;
  }
>(({ position, quaternion, rotation, children }, ref) => {
  const model = useGLTF("/models/rowboat.glb");

  // @ts-expect-error exported by blender
  const material: MeshStandardMaterial = model.materials.rowboat;

  material.metalness = 0;
  material.roughness = 1;
  material.map!.minFilter = LinearFilter;
  material.map!.magFilter = LinearFilter;

  return (
    <group
      position={position}
      quaternion={quaternion}
      rotation={rotation}
      ref={ref}
      castShadow
      receiveShadow
    >
      <Float>
        <Clone object={model.scene} scale={0.4} position={[0, 0.1, 0]} />
      </Float>

      {children}
    </group>
  );
});
