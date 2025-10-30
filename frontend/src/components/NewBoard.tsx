import { useEffect, useState } from "react";
import type { Bot, GameState, GameStatus } from "../utils/types";
import { placeBotOnBoard, getCellContent, removeBot } from "../utils/board";
import { CONTRACT_ABI, CONTRACT_ADDRESS, TOTAL_BOTS } from "../utils/constants";
import { Labels } from "./Labels";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import Spinner from "./Spinner";

interface BoardProps {
  boardState: GameState | null;
  gameID: bigint | null;
  gameStatus: GameStatus;
  refreshGameData: () => void;
  isOpponentBoard?: boolean;
}

const BotBoard = ({
  boardState,
  gameID,
  gameStatus,
  refreshGameData,
  isOpponentBoard,
}: BoardProps) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(TOTAL_BOTS)
      .fill(null)
      .map(() => Array(TOTAL_BOTS).fill(0n)),
    bots: [],
  });

  useEffect(() => {
    if (boardState) {
      setGameState(boardState);
    }
  }, [boardState]);

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash});

  async function handleSubmitBoard(e: React.MouseEvent) {
    e.preventDefault();
    if (!gameID) return;
    writeContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "placeBots",
      args: [gameID, gameState.board],
      account: address,
    });
  }

  useEffect(() => {
    if (isSuccess) {
      refreshGameData();
    }
  }, [isSuccess]);

  const { address } = useAccount();
  const remainingBots =
    gameState && gameState.bots ? TOTAL_BOTS - gameState.bots.length : 0;

  const onCellClick = async (row: number, col: number) => {
    switch (gameStatus) {
      case "players-turn":
        if (!isOpponentBoard) return;
        await handleAttackingClick(row, col);
        break;
      case "board-not-set":
        handlePlacementClick(row, col);
        break;
      default:
    }
  };

  async function handleAttackingClick(row: number, col: number) {
    writeContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "tryHackingBot",
      args: [gameID, row, col],
      account: address,
    });
  }

  const handlePlacementClick = (row: number, col: number) => {
    if (!gameState.bots || gameState.bots.length > TOTAL_BOTS) return;

    const newBot: Bot = {
      id: Date.now(),
      row: row,
      col: col,
    };
    if (
      gameState.bots?.some(
        (bot) => bot.col === newBot.col && bot.row === newBot.row
      )
    ) {
      const newBots = gameState.bots?.filter((bot) => {
        const sameRow = bot.row === newBot.row;
        const sameCol = bot.col === newBot.col;
        if (sameRow && sameCol) return false;
        return true;
      });
      setGameState({
        board: removeBot(newBot, gameState.board),
        bots: newBots,
      });
    } else {
      setGameState((prevState) => ({
        board: placeBotOnBoard(newBot, gameState.board),
        bots: [...prevState.bots!, newBot],
      }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2 className="board-title">
        {isOpponentBoard ? "Target Board" : "Your Fleet"}
      </h2>
      <div>
        <div className="outer-board-container">
          <Labels xLabels />
          <div className="outer-board">
            <Labels />
            <div className="board">
              {gameState &&
                gameState.board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        className={`cell ${cell === 1n ? "bot-placed" : ""} ${
                          cell === 2n ? "cell-hit" : ""
                        } ${cell === 3n ? "cell-miss" : ""}`}
                      >
                        {getCellContent(cell)}
                      </div>
                    );
                  })
                )}
            </div>
          </div>
        </div>

        {address &&
          !isOpponentBoard &&
          gameState &&
          gameStatus === "board-not-set" && (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
              <span className="label">Remaining Bots: </span>
              {remainingBots}
              </div>
              {remainingBots === 0 && (
                <div>
                  {isPending && (
                    <Spinner/>
                  )} 
                  {!isSuccess && !isPending && (
                  <button
                    className="button"
                    onClick={(e) => handleSubmitBoard(e)}
                  >
                    Submit Board
                  </button>
                  )}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default BotBoard;
