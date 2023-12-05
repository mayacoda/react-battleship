import { createContext, PropsWithChildren, useEffect, useState } from "react";
import {
  EndState,
  Player,
  ResultParams,
  Ship,
  SHIP_SIZE,
  TypedClient,
  Vec3,
} from "@react-battleship/types";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { createEmptyGrid } from "@/game-logic/utils.ts";

type GameContextType = {
  isConnected: boolean;
  players: Record<string, Player>;
  currentPlayer: Player | null;
  challenges: Player[];
  socket: TypedClient;

  gameState: {
    opponent: Player;
    yourTurn: boolean;
    yourShips: number[][];
    opponentGrid: number[][];
    yourGrid: number[][];
    yourShipPositions: Ship[];
  } | null;

  previousGames: EndState[];

  onAcceptChallenge: (playerId: string) => void;
  onDismissChallenge: (playerId: string) => void;
  onCannonFired: (x: number, y: number) => void;
  onForfeit: () => void;
  onGameFinished: () => void;
  onPlayerMoved: (position: Vec3) => void;
};

const defaultContext: GameContextType = {
  isConnected: false,
  players: {},
  challenges: [],
  currentPlayer: null,
  socket: io(`${import.meta.env.BASE_URL}:3000`, {
    transports: ["websocket"],
  }),
  gameState: null,
  previousGames: [],
  onAcceptChallenge: () => {},
  onDismissChallenge: () => {},
  onCannonFired: () => {},
  onForfeit: () => {},
  onGameFinished: () => {},
  onPlayerMoved: () => {},
};
export const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider = ({ children }: PropsWithChildren) => {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [challenges, setChallenges] = useState<Player[]>([]);
  const [onGameFinished, setOnGameFinished] = useState<() => void>(() => {});
  const [socket, setSocket] = useState<TypedClient | null>(null);
  const [gameState, setGameState] =
    useState<GameContextType["gameState"]>(null);
  const [previousGames, setPreviousGames] = useState<EndState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Establish WebSocket connection when the component mounts
    const newSocket: TypedClient = io("ws://localhost:3000", {
      transports: ["websocket"],
    });
    setSocket(newSocket);
    let localPlayers: Record<string, Player> = {};
    let localPlayer: Player | null = null;

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setGameState(null);
      setPlayers({});
      setCurrentPlayer(null);
      setChallenges([]);
      setPreviousGames([]);
      navigate("/");
    });
    newSocket.on("initPlayer", (p: Player) => {
      setIsConnected(true);
      localPlayer = p;
      setCurrentPlayer(localPlayer);
      navigate("/lobby");
    });
    newSocket.on("updatePlayers", (p: Record<string, Player>) => {
      localPlayers = p;
      localPlayer = p[localPlayer?.id || ""];
      setPlayers(p);
      setCurrentPlayer(localPlayer);
    });
    newSocket.on("challenge", (playerId: string) => {
      setChallenges((prev) => [...prev, localPlayers[playerId]]);
    });
    newSocket.on("startGame", ({ attacker, defender }) => {
      const isAttacking = attacker === localPlayer?.id;
      const opponentId = isAttacking ? defender : attacker;
      const opponent = localPlayers[opponentId];
      setGameState({
        opponent,
        yourShips: createEmptyGrid(),
        yourTurn: isAttacking,
        opponentGrid: createEmptyGrid(),
        yourGrid: createEmptyGrid(),
        yourShipPositions: [],
      });

      const initShipsHandler = (ships: Ship[]) => {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            yourShips: calculateGrid(ships),
            yourShipPositions: ships,
          };
        });
        navigate(`/game/${attacker}-${defender}`);
      };
      const yourTurnHandler = () => {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            yourTurn: true,
          };
        });
      };
      const endTurnHandler = () => {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            yourTurn: false,
          };
        });
      };

      const resultHandler = (result: ResultParams) => {
        const resultValue = result.hit ? 1 : 2;
        if (result.firedBy === localPlayer?.id) {
          setGameState((prev) => {
            if (!prev) return prev;
            const { opponentGrid } = prev;
            opponentGrid[result.x][result.y] = resultValue;
            return {
              ...prev,
              opponentGrid,
            };
          });
        } else {
          setGameState((prev) => {
            if (!prev) return prev;
            const { yourGrid } = prev;
            yourGrid[result.x][result.y] = resultValue;
            return {
              ...prev,
              yourGrid,
            };
          });
        }
      };

      newSocket.on("initShips", initShipsHandler);
      newSocket.on("yourTurn", yourTurnHandler);
      newSocket.on("endTurn", endTurnHandler);
      newSocket.on("result", resultHandler);

      newSocket.on("gameOver", (result) => {
        setOnGameFinished(() => () => {
          newSocket.off("initShips", initShipsHandler);
          newSocket.off("yourTurn", yourTurnHandler);
          newSocket.off("endTurn", endTurnHandler);
          newSocket.off("result", resultHandler);
          setPreviousGames((prev) => [result, ...prev]);
          setGameState(null);
          navigate("/lobby");
        });
      });
    });
    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Value provided to the context consumers
  const contextValue = {
    isConnected,
    challenges,
    currentPlayer,
    players,
    socket: socket!,
    gameState,
    previousGames,
    onAcceptChallenge: (playerId: string) => {
      socket?.emit("accept", playerId);
      setChallenges([]);
    },
    onDismissChallenge: (playerId: string) => {
      setChallenges((prev) => prev.filter((p) => p.id !== playerId));
    },
    onCannonFired: (x: number, y: number) => {
      socket?.emit("fire", x, y);
    },
    onForfeit: () => {
      socket?.emit("forfeit");
    },
    onGameFinished,
    onPlayerMoved: (position: Vec3) => {
      socket?.emit("move", position);
    },
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

function calculateGrid(ships: Ship[]) {
  const grid = createEmptyGrid(-1);
  ships.forEach((ship) => {
    const { start } = ship;
    const shipLength = SHIP_SIZE[ship.type];

    if (ship.direction === "horizontal") {
      for (let i = 0; i < shipLength; i++) {
        grid[start.x + i][start.y] = ship.type;
      }
    } else {
      for (let i = 0; i < shipLength; i++) {
        grid[start.x][start.y + i] = ship.type;
      }
    }
  });
  return grid;
}
