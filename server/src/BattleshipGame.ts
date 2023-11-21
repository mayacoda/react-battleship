import { EventEmitter } from "events";
import { placeShip } from "./utils/game-logic.js";
import {
  EndState,
  GRID_SIZE,
  Player,
  Ship,
  SHIP_TYPE,
  TOTAL_SHIPS,
  TypedServer,
  TypedServerSocket,
} from "@react-battleship/types";

type BattleshipPlayer = Player & {
  grid: number[][];
  ships: Ship[];
  shipsSunk: number;
};

type FireParams = {
  receiving: BattleshipPlayer;
  firing: BattleshipPlayer;
  x: number;
  y: number;
};

type Listener = () => void;

export class BattleshipGame extends EventEmitter {
  gameId: string;
  player1: BattleshipPlayer;
  player2: BattleshipPlayer;
  io: TypedServer;

  currentTurn!: string;

  disconnectOffHandlers: Listener[] = [];

  constructor(attacker: Player, defender: Player, io: TypedServer) {
    super();
    this.io = io;

    this.player1 = { ...attacker, shipsSunk: 0, grid: [], ships: [] };
    this.player2 = { ...defender, shipsSunk: 0, grid: [], ships: [] };

    this.gameId = `${attacker.id}-${defender.id}`;

    const player1Socket = this.io.sockets.sockets.get(attacker.id);
    const player2Socket = this.io.sockets.sockets.get(defender.id);

    if (!player1Socket || !player2Socket) {
      return;
    }

    player1Socket.join(this.gameId);
    player2Socket.join(this.gameId);

    this.io
      .to(this.gameId)
      .emit("startGame", { attacker: attacker.id, defender: defender.id });

    this.initGrids();

    player1Socket.emit("initShips", this.player1.ships);
    player2Socket.emit("initShips", this.player2.ships);

    player1Socket.emit("yourTurn");
    this.currentTurn = player1Socket.id;

    this.handleFireEvents(player1Socket, player2Socket);
    this.handleForfeitEvents(player1Socket, player2Socket);
    this.handleDisconnectEvents(player1Socket, player2Socket);
  }

  private handleFireEvents(...sockets: TypedServerSocket[]) {
    for (const socket of sockets) {
      socket.on("fire", (x: number, y: number) => {
        if (this.currentTurn !== socket.id) return; // not your turn

        this.fire({
          receiving: this.findEnemy(socket.id),
          firing: this.findPlayer(socket.id),
          x,
          y,
        });
        // switch turns
        this.currentTurn =
          this.currentTurn === this.player1.id
            ? this.player2.id
            : this.player1.id;
        socket.emit("endTurn");
        socket.to(this.gameId).emit("yourTurn");
      });
    }
  }

  private handleForfeitEvents(...sockets: TypedServerSocket[]) {
    for (const socket of sockets) {
      socket.on("forfeit", () => {
        const endState: EndState = {};
        for (const soc of sockets) {
          endState[soc.id] = soc.id === socket.id ? "forfeit" : "win";
        }
        this.io.to(this.gameId).emit("gameOver", endState);
        this.cleanUp();
      });
    }
  }

  private handleDisconnectEvents(...sockets: TypedServerSocket[]) {
    for (const socket of sockets) {
      const disconnectListener = () => {
        const endState: EndState = {};
        for (const soc of sockets) {
          endState[soc.id] = "disconnect";
        }
        this.io.to(this.gameId).emit("gameOver", endState);
        this.cleanUp();
      };
      this.disconnectOffHandlers.push(() => {
        socket.off("disconnect", disconnectListener);
      });
      socket.on("disconnect", disconnectListener);
    }
  }

  initGrids() {
    // set up 6 x 6 grid for each player
    for (let i = 0; i < GRID_SIZE; i++) {
      this.player1.grid.push([]);
      this.player2.grid.push([]);
      for (let j = 0; j < GRID_SIZE; j++) {
        this.player1.grid[i].push(0);
        this.player2.grid[i].push(0);
      }
    }

    // set up ships randomly for each player
    this.player1.ships.push(placeShip(this.player1.grid, SHIP_TYPE.CARRIER));
    this.player1.ships.push(placeShip(this.player1.grid, SHIP_TYPE.BATTLESHIP));
    this.player1.ships.push(placeShip(this.player1.grid, SHIP_TYPE.CRUISER));
    this.player1.ships.push(placeShip(this.player1.grid, SHIP_TYPE.SUBMARINE));

    this.player2.ships.push(placeShip(this.player2.grid, SHIP_TYPE.CARRIER));
    this.player2.ships.push(placeShip(this.player2.grid, SHIP_TYPE.BATTLESHIP));
    this.player2.ships.push(placeShip(this.player2.grid, SHIP_TYPE.CRUISER));
    this.player2.ships.push(placeShip(this.player2.grid, SHIP_TYPE.SUBMARINE));
  }

  fire({ receiving, firing, x, y }: FireParams) {
    const receivingSocket = this.io.sockets.sockets.get(receiving.id);
    const firingSocket = this.io.sockets.sockets.get(firing.id);

    if (!receivingSocket || !firingSocket) {
      return;
    }

    const result = { firedBy: firing.id, x, y, hit: false };

    if (receiving.grid[x][y] === 0) {
      receiving.grid[x][y] = -1;
      result.hit = false;

      firingSocket.emit("result", result);
      receivingSocket.emit("result", result);
    } else if (receiving.grid[x][y] < 0) {
      // already fired here
      return;
    } else {
      receiving.grid[x][y] = -2;
      result.hit = true;

      receivingSocket.emit("result", result);
      firingSocket.emit("result", result);

      receiving.shipsSunk++;
      if (receiving.shipsSunk === TOTAL_SHIPS) {
        this.io.to(this.gameId).emit("gameOver", {
          [receiving.id]: "lose",
          [firing.id]: "win",
        });
        this.cleanUp();
      }
    }
  }

  findPlayer(socketId: string) {
    return this.player1.id === socketId ? this.player1 : this.player2;
  }

  findEnemy(socketId: string) {
    return this.player1.id === socketId ? this.player2 : this.player1;
  }

  cleanUp() {
    this.io
      .in(this.gameId)
      .allSockets()
      .then((socketIds) => {
        for (const socketId of socketIds) {
          // remove 'forfeit' and 'fire' listeners
          this.io.sockets.sockets.get(socketId)?.removeAllListeners("forfeit");
          this.io.sockets.sockets.get(socketId)?.removeAllListeners("fire");
        }
      });

    // remove disconnect listeners
    for (const offHandler of this.disconnectOffHandlers) {
      offHandler();
    }

    this.io.socketsLeave(this.gameId);
    this.emit("gameOver");
  }
}
