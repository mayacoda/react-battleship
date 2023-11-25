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
import { useGameContext } from "@/game-logic/useGameContext.tsx";

export function ChallengeAlert() {
  const game = useGameContext();
  const challenger = game.challenges[0];

  return (
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
              game.onDismissChallenge(challenger?.id);
            }}
          >
            Flee
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              game.onAcceptChallenge(challenger?.id);
            }}
          >
            To battle!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
