import Fastify from "fastify";
import { Server } from "socket.io";
import { TypedServer } from "@react-battleship/types";
import { PlayerManager } from "./PlayerManager.js";
import FastifyStatic from "@fastify/static";
import path from "path";

const fastify = Fastify({ logger: true });
const io: TypedServer = new Server(fastify.server, {});

void fastify.listen({ port: 3000 });

fastify.register(FastifyStatic, {
  root: path.join(process.cwd(), "..", "client/dist"),
});

fastify.ready().then(() => {
  const playerManger = new PlayerManager(io);

  io.on("connection", (socket) => {
    playerManger.initPlayerCommunication(socket);
  });
});

const externalPort = parseInt(process.env.PORT!);
const port: number = isNaN(externalPort) ? 3000 : externalPort;

fastify.listen(
  {
    port,
    host: "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`server listening on ${address}`);
  },
);
