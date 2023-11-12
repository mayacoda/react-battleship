import { useState, useEffect } from "react";

function App() {
  return (
    <div>
      <h1 className="text-4xl mt-8">⚛️⛵️React Battleship</h1>
      <WebSocketComponent />
    </div>
  );
}

const WebSocketComponent = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);

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
    const websocket = new WebSocket("ws://localhost:3000/ws");

    console.log(websocket);

    websocket.onopen = () => {
      console.log("WebSocket Connected");

      websocket.send("message from client");
    };

    websocket.onmessage = (event) => {
      console.log("Message from server:", event.data);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = (event) => {
      console.log("WebSocket closed:", event);
    };

    setWs(websocket);
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
