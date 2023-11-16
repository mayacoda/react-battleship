import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { TypedClient } from "@react-battleship/types";

function App() {
  return (
    <div>
      <h1 className="text-4xl mt-8">⚛️⛵️React Battleship</h1>
      <WebSocketComponent />
    </div>
  );
}

const WebSocketComponent = () => {
  const [ws, setWs] = useState<TypedClient>();

  useEffect(() => {
    // Cleanup WebSocket on component unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const connectWebSocket = () => {
    if (ws) {
      console.log("WebSocket already connected");
      return;
    }

    const socket: TypedClient = io("ws://localhost:3000", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("socket connected");
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    setWs(socket);
  };

  return (
    <div>
      <button
        className="border-l-gray-500 border-2 p-8"
        onClick={connectWebSocket}
      >
        Connect to WebSocket
      </button>
    </div>
  );
};

export default App;
