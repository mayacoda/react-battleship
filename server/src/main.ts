import Fastify from "fastify";
import { Server, Socket } from "socket.io";
import { TypedServer } from "@react-battleship/types";

const fastify = Fastify({ logger: true });
const io: TypedServer = new Server(fastify.server, {});

void fastify.listen({ port: 3000 });

// fastify.register(FastifyStatic, {
//   root: path.join(process.cwd(), "..", "client/dist"),
// });

fastify.get("/", function (_req, reply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET");
  reply.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Cache-Control",
  );

  reply.type("text/html").send("index.html");
});

// registering the socket.io plugin

fastify.ready().then(() => {
  io.on("connection", (socket: Socket) => {
    console.log("got a connection", socket);
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
