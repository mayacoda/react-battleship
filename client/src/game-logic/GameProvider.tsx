import { createContext, PropsWithChildren } from "react";
import { Player, TypedClient } from "@react-battleship/types";
import { io } from "socket.io-client";

type GameContextType = {
  players: Record<string, Player>;
  currentPlayer: Player | null;
  socket: TypedClient;
};

const defaultContext = {
  players: {},
  currentPlayer: null,
  socket: io("ws://localhost:3000", {
    transports: ["websocket"],
  }),
};
export const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider = ({ children }: PropsWithChildren) => {
  return (
    <GameContext.Provider value={defaultContext}>
      {children}
    </GameContext.Provider>
  );
};
