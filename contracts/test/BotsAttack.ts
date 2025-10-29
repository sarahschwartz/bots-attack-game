import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { network } from "hardhat";
import { Abi, getAddress } from "viem";

type BotLocationsArray = [
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number],
  [number, number, number, number, number]
];

interface ContractData { address: `0x${string}`; abi: Abi };

const botLocations1: BotLocationsArray = [
  [0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 0, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0],
];
const botLocations2: BotLocationsArray = [
  [0, 1, 1, 0, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0],
];

describe("BotsAttack", async function () {
  const { viem, networkHelpers } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2, wallet3] = await viem.getWalletClients();
  const wallet1Address = getAddress(wallet1.account.address);
  const wallet2Address = getAddress(wallet2.account.address);
  const wallet3Address = getAddress(wallet3.account.address);
  const deployBotsAttack = () => viem.deployContract("BotsAttack");
  type BotsAttack = Awaited<ReturnType<typeof deployBotsAttack>>;

  let game: BotsAttack;
  let contractData: ContractData;
  beforeEach(async () => {
    game = await deployBotsAttack();
    contractData = {
      address: game.address,
      abi: game.abi,
    };
  })

  it("Should start a new game", async function () {
    await viem.assertions.emitWithArgs(
      game.write.startGame(),
      game,
      "GameCreated",
      [1n, wallet1Address]
    );

    const gameNumber = await game.read.getPlayerGames([wallet1Address]);
    assert(gameNumber[0] === 1n, "game ID incorrect");
  });

  it("Should start a game with two players", async function () {
    await wallet2.writeContract({
      ...contractData,
      functionName: "startGame",
      args: [],
    });

    await viem.assertions.emitWithArgs(
      game.write.startGame(),
      game,
      "PlayerJoined",
      [1n, wallet1Address]
    );
  });

  it("Should allow a player to place bots", async function () {
    await startGame(contractData, wallet1, wallet2);

    await viem.assertions.emitWithArgs(
      game.write.placeBots([1n, botLocations1]),
      game,
      "BotsPlaced",
      [1n, wallet1Address]
    );
  });

  it("Should allow a player to hit a bot and miss a bot", async function () {
    await startGame(contractData, wallet1, wallet2);

    await placeBots(contractData, wallet1, wallet2);

    let x = 0;
    const y = 1;

    await viem.assertions.emitWithArgs(
      game.write.tryHackingBot([1n, x, y]),
      game,
      "HackAttempt",
      [1n, wallet1Address, x, y, true]
    );

    await wallet2.writeContract({
      ...contractData,
      functionName: "tryHackingBot",
      args: [1n, 0, 0],
    });

    x = 1;

    await viem.assertions.emitWithArgs(
      game.write.tryHackingBot([1n, x, y]),
      game,
      "HackAttempt",
      [1n, wallet1Address, x, y, false]
    );

    const player1Boards = await publicClient.readContract({
      ...contractData,
      functionName: "getPlayerBoards",
      account: wallet1Address,
      args: [1n],
    }) as number[][][];

    const playerBoard = player1Boards[0];
    const attackBoard = player1Boards[1];

    assert(playerBoard[0][0] === 3, "player 1 board didn' get hit");
    assert(attackBoard[0][1] === 2, "player 1 board didn't miss opponent");
    assert(attackBoard[1][1] === 3, "player 1 board didn't hit opponent");
  });

  it("Should let player 2 win", async function () {
    await startGame(contractData, wallet1, wallet2);
    await placeBots(contractData, wallet1, wallet2);

    const player1Attacks = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ];

    const player2Attacks = [
      { x: 0, y: 2 },
      { x: 2, y: 0 },
      { x: 3, y: 1 },
      { x: 4, y: 2 },
      { x: 2, y: 3 },
    ];

    const turns = Math.min(player1Attacks.length, player2Attacks.length);

    for (let i = 0; i < turns; i++) {
      const p1 = player1Attacks[i];
      const hash1 = await wallet1.writeContract({
        ...contractData,
        functionName: "tryHackingBot",
        args: [1n, p1.x, p1.y],
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const p2 = player2Attacks[i];
      const hash2 = await wallet2.writeContract({
        ...contractData,
        functionName: "tryHackingBot",
        args: [1n, p2.x, p2.y],
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });
    }

    const gameState = await game.read.getGameState([1n]);
    assert(gameState[4] === true, "game not over");
    assert(gameState[5] === wallet2Address, "player 2 address not winner");

  });

  it("Should fail when someone requests a board that isn't theirs", async function () {
    await startGame(contractData, wallet1, wallet2);
    await placeBots(contractData, wallet1, wallet2);

    await viem.assertions.revert(
      game.read.getPlayerBoards([1n], { account: wallet3.account}))

  });

  it("Should start a second game", async function () {
    await startGame(contractData, wallet1, wallet2);
    await viem.assertions.emitWithArgs(
      game.write.startGame({ account: wallet3.account }),
      game,
      "GameCreated",
      [2n, wallet3Address]
    );

    const gameNumber = await game.read.getPlayerGames([wallet3Address]);
    assert(gameNumber[0] === 2n, "game ID incorrect");
    
  });

  it("Shouldn't allow a player to start a second game when one is already active", async function () {
 await startGame(contractData, wallet1, wallet2);
  await viem.assertions.revert(game.write.startGame())
  });

  it("Should cancel an inactive game", async function () {
    await startGame(contractData, wallet1, wallet2);
    await placeBots(contractData, wallet1, wallet2);
    await networkHelpers.time.increase(60 * 60 * 25);
    await viem.assertions.emitWithArgs(
      game.write.cancelInactiveGame([1n]),
      game,
      "GameOver",
      [1n, wallet2Address]
    )
  });


  it("Shouldn't let player cancel the game", async function () {
    await startGame(contractData, wallet1, wallet2);
    await placeBots(contractData, wallet1, wallet2);
    await viem.assertions.revert(
      game.write.cancelInactiveGame([1n])
    )
  });
});

async function startGame(
  contractData: ContractData,
  wallet1: any,
  wallet2: any
) {
  await wallet1.writeContract({
    ...contractData,
    functionName: "startGame",
    args: [],
  });

  await wallet2.writeContract({
    ...contractData,
    functionName: "startGame",
    args: [],
  });
}

async function placeBots(
  contractData: ContractData,
  wallet1: any,
  wallet2: any
) {
  await wallet1.writeContract({
    ...contractData,
    functionName: "placeBots",
    args: [1n, botLocations1],
  });

  await wallet2.writeContract({
    ...contractData,
    functionName: "placeBots",
    args: [1n, botLocations2],
  });
}
