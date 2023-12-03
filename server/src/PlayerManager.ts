import {
  Player,
  TypedServer,
  TypedServerSocket,
} from "@react-battleship/types";
import { BattleshipGame } from "./BattleshipGame.js";
import { randomVec3 } from "./utils/math.js";

export class PlayerManager {
  players: Record<string, Player> = {};
  io: TypedServer;
  games: Record<string, BattleshipGame> = {};

  constructor(io: TypedServer) {
    this.io = io;
    console.log("creating a player manager");
  }

  initPlayerCommunication(socket: TypedServerSocket) {
    socket.on("disconnect", () => {
      this.removePlayer(socket.id);
    });
    socket.on("login", (name, linkToTwitter) => {
      const player: Player = {
        id: socket.id,
        name: name,
        isPlaying: false,
        position: randomVec3(),
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        linkToTwitter,
      };
      this.addPlayer(player);
      console.log("player", player);

      socket.emit("initPlayer", player);
    });
    socket.on("challenge", (playerId) => {
      if (!this.players[playerId] || this.players[playerId].isPlaying) return;
      this.challengePlayer(socket.id, playerId);
    });
    socket.on("accept", (playerId) => {
      this.startGame(playerId, socket.id);
    });
    socket.on("move", (position) => {
      const player = this.players[socket.id];
      if (player) {
        player.position = position;
        this.io.emit("updatePlayers", this.players);
      }
    });
    socket.on("rotation", (quaternion) => {
      const player = this.players[socket.id];
      if (player) {
        player.rotation = quaternion;
        this.io.emit("updatePlayers", this.players);
      }
    });
  }

  addPlayer(player: Player) {
    this.players[player.id] = player;
    this.io.emit("updatePlayers", this.players);
  }

  removePlayer(playerId: string) {
    delete this.players[playerId];
    this.io.emit("updatePlayers", this.players);
  }

  challengePlayer(attacker: string, defender: string) {
    this.io.to(defender).emit("challenge", attacker);
  }

  startGame(attacker: string, defender: string) {
    const player1 = this.players[attacker];
    const player2 = this.players[defender];
    if (!player1) return console.error(`Attacker ${attacker} not found`);
    if (!player2) return console.error(`Defender ${defender} not found`);

    player1.isPlaying = true;
    player2.isPlaying = true;
    this.io.emit("updatePlayers", this.players);

    const game = new BattleshipGame(player1, player2, this.io);
    this.games[game.gameId] = game;
    game.on("gameOver", () => {
      player1.isPlaying = false;
      player2.isPlaying = false;
      this.io.emit("updatePlayers", this.players);
      delete this.games[game.gameId];
    });
  }
}
