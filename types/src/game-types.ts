export type GameOverReason = "win" | "lose" | "forfeit" | "disconnect";

export type EndState = Record<string, GameOverReason>;
