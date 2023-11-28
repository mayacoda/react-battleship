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
import { useEffect, useState } from "react";

export function ChallengeAlert() {
  const game = useGameContext();
  const challenger = game.challenges[0];
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (challenger) {
      const interval = setInterval(() => {
        setCounter((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [challenger]);

  useEffect(() => {
    if (counter >= 15) {
      setCounter(0);
      game.onDismissChallenge(challenger?.id);
    }
  }, [game, counter, challenger?.id]);

  return (
    <AlertDialog open={!!challenger}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You've been attacked!</AlertDialogTitle>
          <AlertDialogDescription>
            {challenger?.name} has challenged you to a game of Battleship! You
            have {15 - counter} seconds to accept.
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
