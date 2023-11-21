import { useContext } from "react";
import { GameContext } from "@/game-logic/GameProvider.tsx";

export function useGameContext() {
  return useContext(GameContext);
}
