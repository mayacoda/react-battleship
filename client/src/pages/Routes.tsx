import { Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/Login.tsx";
import { LobbyPage } from "@/pages/Lobby.tsx";
import { GamePage } from "@/pages/Game.tsx";
import { useCallback } from "react";
import { useGameContext } from "@/game-logic/useGameContext.tsx";

export function GameRoutes() {
  const game = useGameContext();

  const onLogin = useCallback(
    (username: string) => {
      console.log("login", username);
      game.socket.emit("login", username, false);
    },
    [game.socket],
  );

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
      </Routes>
    </>
  );
}
