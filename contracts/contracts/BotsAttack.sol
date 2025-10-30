// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

contract BotsAttack {
    uint8 constant BOARD_SIZE = 5;
    uint8 constant BOT_COUNT = 5;
    uint8 constant EMPTY = 0;
    uint8 constant BOT = 1;
    uint8 constant INFECTED = 2;
    uint8 constant MISS = 3;

    struct Score {
        address player;
        uint256 totalWins;
    }

    struct Game {
        address player1;
        address player2;
        uint8[BOARD_SIZE][BOARD_SIZE] player1Board;
        uint8[BOARD_SIZE][BOARD_SIZE] player2Board;
        uint8[BOARD_SIZE][BOARD_SIZE] player1Hacks;
        uint8[BOARD_SIZE][BOARD_SIZE] player2Hacks;
        bool player1Ready;
        bool player2Ready;
        bool gameOver;
        address winner;
        uint8 player1BotsRemaining;
        uint8 player2BotsRemaining;
        uint256 lastMoveTime;
        bool player1Turn;
    }

    uint8[BOARD_SIZE][BOARD_SIZE] EMPTY_BOARD = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // Mapping of game ID to game state
    mapping(uint256 => Game) private games;
    // Counter for game IDs
    uint256 private gameCounter;
    // Mapping of player addresses to game IDs
    mapping(address => uint256[]) private playerGames;

    // Array to store top scores
    Score[] public topScores;
    uint256 private constant MAX_TOP_SCORES = 10;

    // Mapping of player address to their personal best score
    mapping(address => uint256) public playerWins;

    // Events
    event GameCreated(uint256 gameId, address player1);
    event PlayerJoined(uint256 gameId, address player2);
    event BotsPlaced(uint256 gameId, address player);
    event HackAttempt(
        uint256 gameId,
        address player,
        uint8 x,
        uint8 y,
        bool hit
    );
    event GameOver(uint256 gameId, address winner);

    // Modifiers
    modifier validGame(uint256 gameId) {
        require(gameId <= gameCounter, "Invalid game ID");
        _;
    }

    modifier playersTurn(uint256 gameId) {
        Game storage game = games[gameId];
        require(
            msg.sender == game.player1 || msg.sender == game.player2,
            "Not a player in this game"
        );
        require(!game.gameOver, "Game is over");
        require(
            (msg.sender == game.player1 && game.player1Turn) ||
                (msg.sender == game.player2 && !game.player1Turn) ||
                (!game.player1Ready || !game.player2Ready),
            "Not your turn"
        );
        _;
    }

    function startGame() external returns (uint256) {
        bool isFirstGame = games[gameCounter].player1 == address(0);
        bool isLastGameOpen = games[gameCounter].player2 == address(0);

        uint256[] memory existingGames = getPlayerGames(msg.sender);
        if (existingGames.length > 0) {
            uint256 existingGame = existingGames[existingGames.length - 1];
            Game memory lastGame = games[existingGame];
            if (lastGame.player1 != address(0)) {
                require(
                    lastGame.gameOver == true,
                    "existing game is still active"
                );
            }
        }

        if (isFirstGame || !isLastGameOpen) {
            gameCounter++;
            Game memory newGame = Game({
                player1: msg.sender,
                player2: address(0),
                player1Board: EMPTY_BOARD,
                player2Board: EMPTY_BOARD,
                player1Hacks: EMPTY_BOARD,
                player2Hacks: EMPTY_BOARD,
                player1Ready: false,
                player2Ready: false,
                gameOver: false,
                winner: address(0),
                player1BotsRemaining: BOT_COUNT,
                player2BotsRemaining: BOT_COUNT,
                lastMoveTime: block.timestamp,
                player1Turn: true
            });
            games[gameCounter] = newGame;
            playerGames[msg.sender].push(gameCounter);
            emit GameCreated(gameCounter, msg.sender);
        } else {
            games[gameCounter].player2 = msg.sender;
            playerGames[msg.sender].push(gameCounter);
            emit PlayerJoined(gameCounter, msg.sender);
        }

        return gameCounter;
    }

    // Place bots on the board
    function placeBots(
        uint256 gameId,
        uint8[BOARD_SIZE][BOARD_SIZE] calldata botLocations
    ) external validGame(gameId) playersTurn(gameId) {
        Game storage game = games[gameId];
        require(
            !game.player1Ready || !game.player2Ready,
            "Bots already placed"
        );

        bool isPlayer1 = msg.sender == game.player1;

        uint8[BOARD_SIZE][BOARD_SIZE] storage board = isPlayer1
            ? game.player1Board
            : game.player2Board;

        uint8 botCount = 0;
        // Set the player's board
        for (uint8 i = 0; i < BOARD_SIZE; i++) {
            for (uint8 j = 0; j < BOARD_SIZE; j++) {
                require(
                    board[i][j] == EMPTY || board[i][j] == BOT,
                    "Invalid board"
                );

                board[i][j] = botLocations[i][j];
                if (board[i][j] == BOT) {
                    botCount++;
                }
            }
        }

        require(botCount == BOT_COUNT, "Invalid number of bots");

        if (isPlayer1) {
            game.player1Ready = true;
        } else {
            game.player2Ready = true;
        }

        game.lastMoveTime = block.timestamp;

        emit BotsPlaced(gameId, msg.sender);
    }

    // Try hacking a bot on the opponent's bots
    function tryHackingBot(
        uint256 gameId,
        uint8 x,
        uint8 y
    ) external validGame(gameId) playersTurn(gameId) {
        Game storage game = games[gameId];
        require(
            game.player1Ready && game.player2Ready,
            "Both players must place bots"
        );
        require(x < BOARD_SIZE && y < BOARD_SIZE, "Invalid coordinates");

        bool isPlayer1 = msg.sender == game.player1;
        uint8[BOARD_SIZE][BOARD_SIZE] storage targetBoard = isPlayer1
            ? game.player2Board
            : game.player1Board;
        uint8[BOARD_SIZE][BOARD_SIZE] storage hacksBoard = isPlayer1
            ? game.player1Hacks
            : game.player2Hacks;

        require(hacksBoard[x][y] == EMPTY, "Position already hacked");

        bool isHit = targetBoard[x][y] == BOT;
        hacksBoard[x][y] = isHit ? INFECTED : MISS;
        targetBoard[x][y] = isHit ? INFECTED : MISS;

        if (isHit) {
            if (isPlayer1) {
                game.player2BotsRemaining--;
                if (game.player2BotsRemaining == 0) {
                    game.gameOver = true;
                    game.winner = game.player1;
                    _submitScore(game.winner);
                    emit GameOver(gameId, game.winner);
                }
            } else {
                game.player1BotsRemaining--;
                if (game.player1BotsRemaining == 0) {
                    game.gameOver = true;
                    game.winner = game.player2;
                    _submitScore(game.winner);
                    emit GameOver(gameId, game.winner);
                }
            }
        }

        game.lastMoveTime = block.timestamp;
        game.player1Turn = !game.player1Turn;
        emit HackAttempt(gameId, msg.sender, x, y, isHit);
    }

    // Get the public game state
    function getGameState(
        uint256 gameId
    )
        external
        view
        validGame(gameId)
        returns (
            address player1,
            address player2,
            bool player1Ready,
            bool player2Ready,
            bool gameOver,
            address winner,
            uint8 player1BotsRemaining,
            uint8 player2BotsRemaining,
            uint256 lastMoveTime,
            bool player1Turn
        )
    {
        Game storage game = games[gameId];

        return (
            game.player1,
            game.player2,
            game.player1Ready,
            game.player2Ready,
            game.gameOver,
            game.winner,
            game.player1BotsRemaining,
            game.player2BotsRemaining,
            game.lastMoveTime,
            game.player1Turn
        );
    }

    // Get the player boards
    // includes the initial locations they set,
    // the hacks they've made
    // and the hack the opponent made
    function getPlayerBoards(
        uint256 gameId
    )
        external
        view
        validGame(gameId)
        returns (
            uint8[BOARD_SIZE][BOARD_SIZE] memory,
            uint8[BOARD_SIZE][BOARD_SIZE] memory
        )
    {
        Game storage game = games[gameId];
        require(
            msg.sender == game.player1 || msg.sender == game.player2,
            "Not a player in this game"
        );
        return
            msg.sender == game.player1
                ? (game.player1Board, game.player1Hacks)
                : (game.player2Board, game.player2Hacks);
    }

    // get player games
    function getPlayerGames(
        address player
    ) public view returns (uint256[] memory) {
        return playerGames[player];
    }

    // cancels a game where the last move was more than 20 minutes ago
    // last player to make a move forfeits
    function cancelInactiveGame(uint256 gameId) external validGame(gameId) {
        Game storage game = games[gameId];
        require(game.player2 != address(0), "no player 2");
        require(game.gameOver == false, "game is already over");
        require(game.player1Ready || game.player2Ready, "neither board is set");
        // check if more than 20 minutes has passed
        require(
            block.timestamp >= game.lastMoveTime + 20 minutes,
            "20 minutes have not passed"
        );
        // last player to play wins
        game.gameOver = true;
        if (game.player1Turn) {
            game.winner = game.player2;
            emit GameOver(gameId, game.player2);
        } else {
            game.winner = game.player1;
            emit GameOver(gameId, game.player1);
        }
        _submitScore(game.winner);
    }

    function _submitScore(address _player) internal {
        playerWins[_player]++;

        // Create new score
        Score memory newScore = Score({player: _player, totalWins: playerWins[_player]});

        // Update top scores
        _updateTopScores(newScore);
    }

    // returns true if score1 is higher than score2
    function _isScoreHigher(
        Score memory score1,
        Score memory score2
    ) internal pure returns (bool) {
        if (score1.totalWins == 0) return false; // Handle empty scores
        if (score2.totalWins == 0) return true; // Handle empty scores

        if (score1.totalWins > score2.totalWins) {
            return true;
        }
        return false;
    }

    function _updateTopScores(Score memory newScore) internal {
        // Find where the new score should be inserted
        uint256 insertIndex = topScores.length;
        for (uint256 i = 0; i < topScores.length; i++) {
            if (!_isScoreHigher(topScores[i], newScore)) {
                insertIndex = i;
                break;
            }
        }

        // If the score qualifies for top scores
        if (insertIndex < MAX_TOP_SCORES) {
            // If not at capacity, extend the array
            if (topScores.length < MAX_TOP_SCORES) {
                topScores.push(newScore);
            }

            // Shift existing scores down
            for (uint256 i = topScores.length - 1; i > insertIndex; i--) {
                topScores[i] = topScores[i - 1];
            }

            // Insert the new score
            topScores[insertIndex] = newScore;
        }
    }

    function getTopScores() external view returns (Score[] memory) {
        return topScores;
    }

    function getPlayerWins(address _player) external view returns (uint256) {
        return playerWins[_player];
    }
}
