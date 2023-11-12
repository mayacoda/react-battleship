import fastify from "fastify";
import fastifyWebsocket, { SocketStream } from "@fastify/websocket";
import fastifyCors from "@fastify/cors";

const server = fastify({ logger: true });

// Register the WebSocket plugin
server.register(fastifyWebsocket);

// Configure CORS
server.register(fastifyCors, {
  origin: ["http://localhost:5173"],
});

// WebSocket route
server.register(async () =>
  server.get("/ws", { websocket: true }, (connection: SocketStream) => {
    connection.socket.on("message", (message: Buffer) => {
      server.log.info("Received message:", message.toString());

      // Echo the message back to the client
      connection.socket.send(`Echo: ${message}`);
    });

    connection.socket.on("open", () => {
      server.log.info("Client connected.");
    });

    connection.socket.on("close", () => {
      server.log.info("Client disconnected.");
    });

    connection.socket.on("error", (error: Error) => {
      server.log.error(error);
    });
  }),
);

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    let address = server.server.address();
    console.log(
      `Server listening on port ${
        typeof address !== "string" ? address?.port ?? "unknown" : address
      }`,
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();
