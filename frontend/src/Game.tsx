import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useEffect, useState } from "react";
import BattleshipBoard from "./components/NewBoard";
import type { GameData, GameStatus } from "./utils/types";
import { getGameStatus } from "./utils/board";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./utils/constants";
import { Status } from "./components/Status";
import { Legend } from "./components/Legend";

export function Game({ address }: { address: `0x${string}` }) {
  const [gameStatus, setGameStatus] = useState<GameStatus>(null);
  const { writeContract, data: hash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: playerGames, refetch: refetchPlayerGames } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getPlayerGames",
    args: [address],
    account: address,
    query: { refetchInterval: 1000 * 10}
  });

  const gameID =
    Array.isArray(playerGames) && playerGames.length > 0
      ? playerGames[playerGames.length - 1]
      : undefined;

  
  const { data: gameData, refetch: refetchGameData } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getGameState",
    args: [gameID],
    query: { refetchInterval: 1000 * 10}
  });

  const { data: playerBoards, refetch: refetchPlayerBoards } = useReadContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getPlayerBoards",
    args: [gameID],
    account: address,
    query: { refetchInterval: 1000 * 10}
  });

  const isPlayerOne = Array.isArray(gameData) && gameData[0] === address;
  const playerBoard =
    Array.isArray(playerBoards) && playerBoards.length > 0
      ? { board: playerBoards[0], bots: [] }
      : undefined;
  const opponentBoard =
    Array.isArray(playerBoards) && playerBoards.length > 1
      ? { board: playerBoards[1], bots: [] }
      : undefined;

  const CANCEL_TIME = 1000 * 60 * 20;
  const timestamp = Array.isArray(gameData) ? gameData[8] : 0;
  const lastBlockMs = Number(timestamp) * 1000;
  const isGameActive = gameStatus && gameStatus !== 'waiting-for-match' && gameStatus !== 'win' && gameStatus !== 'loss' && gameStatus !== 'board-not-set';
  const gameIsInactive = 
    isGameActive && timestamp > 0 ? Date.now() - lastBlockMs > CANCEL_TIME : false;

  useEffect(() => {
    if (gameData && address) {
      const data = gameData as GameData;
      const status = getGameStatus(data, isPlayerOne, address);
      setGameStatus(status);
    }
  }, [gameData, isPlayerOne, address]);

  function refresh() {
    refetchPlayerGames();
    refetchGameData();
    refetchPlayerBoards();
  }

  async function handleStartGame() {
    if (!address) return;
    writeContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "startGame",
      account: address,
    });
  }

  useEffect(() => {
    if (isSuccess) {
      refresh();
    }
  }, [isSuccess]);

  async function handleCancelGame() {
    writeContract({
      abi: CONTRACT_ABI,
      address: CONTRACT_ADDRESS,
      functionName: "cancelInactiveGame",
      args: [gameID],
      account: address,
    });
  }

  function RefreshIcon(){
    return (
      <div onClick={refresh} className="button" style={{padding: '0.1rem 0.2rem'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M4 20v-2h2.75l-.4-.35q-1.225-1.225-1.787-2.662T4 12.05q0-2.775 1.663-4.937T10 4.25v2.1Q8.2 7 7.1 8.563T6 12.05q0 1.125.425 2.188T7.75 16.2l.25.25V14h2v6zm10-.25v-2.1q1.8-.65 2.9-2.212T18 11.95q0-1.125-.425-2.187T16.25 7.8L16 7.55V10h-2V4h6v2h-2.75l.4.35q1.225 1.225 1.788 2.663T20 11.95q0 2.775-1.662 4.938T14 19.75"/></svg>
    </div>
    )
}
  
  return (
    <div>
        
      <div className="info-bar">
        <RefreshIcon  />
        {!gameStatus ? (
          <>
            <button className="button" onClick={handleStartGame}>
              Start Game
            </button>
          </>
        ) : (
          <>
            <p>
              <span className="label">Game ID: </span>
              {gameID?.toString()}
            </p>
          </>
        )}
        <Status gameStatus={gameStatus} />
         {(gameStatus === "win" || gameStatus === "loss") && (
            <button className="button" onClick={handleStartGame}>
              Start New Game
            </button>
          )}
      </div>
      <div className="info-bar">
        {gameIsInactive && (
          <button className="button" onClick={handleCancelGame}>
            Cancel Game
          </button>
        )}
        </div>
      
      <div className="boards-container">
        {playerBoard && playerBoard.board && gameStatus !== "waiting-for-match" && (
          <BattleshipBoard
            boardState={playerBoard}
            gameID={gameID}
            gameStatus={gameStatus}
            refreshGameData={refresh}
          />
        )}
        {(gameStatus === "players-turn" ||
          gameStatus === "opponents-turn" ||
          gameStatus === "win" ||
          gameStatus === "loss") &&
          opponentBoard &&
          opponentBoard.board && (
            <BattleshipBoard
              boardState={opponentBoard}
              gameID={gameID}
              gameStatus={gameStatus}
              refreshGameData={refresh}
              isOpponentBoard
            />
          )}
      </div>
      {playerBoard && playerBoard.board && gameStatus !== "waiting-for-match" && (
     <Legend />
     )}
    </div>
  );
}
