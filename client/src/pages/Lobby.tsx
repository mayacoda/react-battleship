import { Player } from "@react-battleship/types";
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

type Props = {
  players: Player[];
  onChallenge: (playerId: string) => void;
};
const LobbyPage = ({ players, onChallenge }: Props) => {
  return (
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
                ) : (
                  <Button size="sm" onClick={() => onChallenge(player.id)}>
                    Challenge
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LobbyPage;
