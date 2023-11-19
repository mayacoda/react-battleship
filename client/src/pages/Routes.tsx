import { Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "@/pages/Login.tsx";
import LobbyPage from "@/pages/Lobby.tsx";
import GamePage from "@/pages/Game.tsx";

export function GameRoutes() {
  const navigate = useNavigate();
  const onLogin = (username: string) => {
    console.log("login", username);
    navigate("/lobby");
  };
  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
      <Route
        path="/lobby"
        element={
          <LobbyPage
            players={[
              {
                isPlaying: false,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 0 },
                linkToTwitter: false,
                id: "123",
                name: "test",
              },
            ]}
            onChallenge={() => {
              console.log("challenge");
              navigate("/game/123");
            }}
          />
        }
      />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/" element={<LoginPage onLogin={onLogin} />} />
    </Routes>
  );
}
