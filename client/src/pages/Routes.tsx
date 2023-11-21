import { Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "@/pages/Login.tsx";
import LobbyPage from "@/pages/Lobby.tsx";
import GamePage from "@/pages/Game.tsx";
import { useCallback, useEffect, useState } from "react";
import { Player } from "@react-battleship/types";
import { useGameContext } from "@/game-logic/useGameContext.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

export function GameRoutes() {
  const navigate = useNavigate();
  const game = useGameContext();
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [challenger, setChallenger] = useState<Player | null>(null);

  useEffect(() => {
    const onInitPlayer = (player: Player) => {
      console.log("init player", player);
      navigate("/lobby");
    };

    const onUpdatePlayers = (players: Record<string, Player>) => {
      console.log("updating players", players);
      setPlayers(players);
    };

    const onStartGame = () => {
      navigate("/game/123");
    };

    const onChallenged = (playerId: string) => {
      setChallenger(players[playerId]);
    };

    game.socket.on("initPlayer", onInitPlayer);
    game.socket.on("updatePlayers", onUpdatePlayers);
    game.socket.on("startGame", onStartGame);
    game.socket.on("challenge", onChallenged);

    return () => {
      game.socket.off("initPlayer", onInitPlayer);
      game.socket.off("updatePlayers", onUpdatePlayers);
      game.socket.off("startGame", onStartGame);
    };
  }, [game.socket, navigate, players]);

  const onLogin = useCallback(
    (username: string) => {
      console.log("login", username);
      game.socket.emit("login", username, false);
    },
    [game.socket],
  );

  const onChallenge = useCallback(
    (playerId: string) => {
      game.socket.emit("challenge", playerId);
    },
    [game.socket],
  );

  return (
    <>
      <AlertDialog open={!!challenger}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You've been attacked!</AlertDialogTitle>
            <AlertDialogDescription>
              {challenger?.name} has challenged you to a game of Battleship!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setChallenger(null);
              }}
            >
              Flee
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (challenger) {
                  game.socket.emit("accept", challenger.id);
                  setChallenger(null);
                }
              }}
            >
              To battle!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route
          path="/lobby"
          element={
            <LobbyPage
              players={Object.values(players)}
              onChallenge={onChallenge}
            />
          }
        />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
      </Routes>
    </>
  );
}
