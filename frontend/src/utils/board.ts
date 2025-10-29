import { ZERO_ADDRESS } from "./constants";
import { BoardState, CellState, Bot, GameStatus, GameData } from "./types";

export const removeBot = (oldBot: Bot, board: BoardState) => {
  const newBoard = board.map((row) => [...row]);
  newBoard[oldBot.row][oldBot.col] = 0n;
  return newBoard;
};

export const placeBotOnBoard = (bot: Bot, board: BoardState) => {
  const newBoard = board.map((row) => [...row]);
  newBoard[bot.row][bot.col] = 1n;
  return newBoard;
};

export const getCellContent = (state: CellState) => {
  const normalized = state.toString();
  switch (normalized) {
    case "1":
      return "🤖";
    case "2":
      return "🔥";
    case "3":
      return " 🟦";
    default:
      return null;
  }
};

export function getGameStatus(
  gameData: GameData,
  isPlayerOne: boolean,
  address: `0x${string}`
): GameStatus {
  if (gameData[1] === ZERO_ADDRESS) {
    return "waiting-for-match";
  } else if (
    (isPlayerOne && gameData[2] === false) ||
    (!isPlayerOne && gameData[3] === false)
  ) {
    return "board-not-set";
  } else if (
    (isPlayerOne && gameData[3] === false) ||
    (!isPlayerOne && gameData[2] === false)
  ) {
    return "opponent-board-not-set";
  } else if (gameData[4] === true && gameData[5] !== ZERO_ADDRESS) {
    if (gameData[5] === address) {
      return "win";
    }
    return "loss";
  } else {
    const playerOneTurn = gameData[9] === true;
    const isPlayerTurn = playerOneTurn ? isPlayerOne : !isPlayerOne;
    return isPlayerTurn ? "players-turn" : "opponents-turn";
  }
}
