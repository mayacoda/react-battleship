import { Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/Login.tsx";
import { ProtectedLobbyPage } from "@/pages/Lobby.tsx";
import { ProtectedGamePage } from "@/pages/Game.tsx";
import { useCallback } from "react";
import { useGameContext } from "@/game-logic/useGameContext.tsx";

export function GameRoutes() {
  const game = useGameContext();

  const onLogin = useCallback(
    (username: string) => {
      game.socket.emit("login", username, false);
    },
    [game.socket],
  );

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/lobby" element={<ProtectedLobbyPage />} />
        <Route path="/game/:gameId" element={<ProtectedGamePage />} />
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
      </Routes>
    </>
  );
}
