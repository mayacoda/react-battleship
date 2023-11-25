import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ChallengeAlert } from "@/components/ui/ChallengeAlert.tsx";
import { useCallback } from "react";
import { useGameContext } from "@/game-logic/useGameContext.tsx";

export function LobbyPage() {
  const game = useGameContext();
  const onChallenge = useCallback(
    (playerId: string) => {
      game.socket.emit("challenge", playerId);
    },
    [game.socket],
  );
  const players = Object.values(game.players);

  return (
    <>
      <ChallengeAlert />
      <div className="flex flex-col h-screen">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell>{player.name}</TableCell>
                <TableCell>
                  {player.isPlaying ? (
                    <Badge>Playing</Badge>
                  ) : player.id !== game.currentPlayer?.id ? (
                    <Button size="sm" onClick={() => onChallenge(player.id)}>
                      Challenge
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
