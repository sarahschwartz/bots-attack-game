import { GameStatus } from "../utils/types";

export function Status({ gameStatus }: { gameStatus: GameStatus }) {
    if(!gameStatus) return;
  return (
    <p>
      <span className="label">Status: </span>
      {gameStatus === "waiting-for-match" && (
        <span>Waiting for opponent...</span>
      )}
      {gameStatus === "board-not-set" && <span>Set your board!</span>}
      {gameStatus === "opponent-board-not-set" && (
        <span>Opponent is setting their board...</span>
      )}
      {gameStatus === "players-turn" && <span>Your turn!</span>}
      {gameStatus === "opponents-turn" && <span>Waiting for opponent...</span>}
      {gameStatus === "win" && <span>🎉 You won!</span>}
      {gameStatus === "loss" && <span>🫤 You lost.</span>}
    </p>
  );
}
