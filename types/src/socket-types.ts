import { SHIP_TYPE } from "./ships.js";
import { Player } from "./player-types.js";
import { EndState } from "./game-types.js";
import { Server, Socket as ServerSocket } from "socket.io";
import { Socket as ClientSocket } from "socket.io-client";

export type Ship = {
  type: SHIP_TYPE;
  start: { x: number; y: number };
  direction: "horizontal" | "vertical";
};

export type ServerToClientEvents = {
  updatePlayers: (players: Record<string, Player>) => void;
  initPlayer: (player: Player) => void;
  challenge: (attacker: string) => void;
  startGame: (param: { attacker: string; defender: string }) => void;
  initShips: (ships: Ship[]) => void;
  yourTurn: () => void;
  endTurn: () => void;
  result: (result: {
    firedBy: string;
    x: number;
    y: number;
    hit: boolean;
  }) => void;
  gameOver: (endState: EndState) => void;
};

export type ClientToServerEvents = {
  login: (name: string, linkToTwitter: boolean) => void;
  challenge: (playerId: string) => void;
  accept: (playerId: string) => void;
  forfeit: () => void;
  fire: (x: number, y: number) => void;
  move: (position: { x: number; y: number; z: number }) => void;
  rotation: (quaternion: {
    x: number;
    y: number;
    z: number;
    w: number;
  }) => void;
};

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export type TypedClient = ClientSocket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type TypedServerSocket = ServerSocket<
  ClientToServerEvents,
  ServerToClientEvents
>;
