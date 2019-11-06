const axios = require("axios");

async function run() {
  try {
    const create = process.env.CREATE;
    const players = process.env.PLAYERS || 2;
    if (create) {
      const gameId = await createGame(players);
      console.log('GAMEID', gameId)
      // const state = await getGameState(gameId)
      const state = await joinGame(gameId);
      let gameOver = false;
      let nextState = state;
      try {
        do {
          // console.log('STATE IS:', JSON.stringify(nextState, null, 2))
          nextState = await makeMove(gameId, nextState);
          console.log("MADE A MOVE", nextState);
        } while (nextState.data.state !== 'completed');
      } catch (err) {
        if (err.response) {
          console.log('DEATH!!!', err.response.data)
        } else {
          throw err
        }
      }
    } else {
      console.log("ERROR: NOT DONE");
    }

  } catch(err) {
    console.log('UNEXPECTED ERROR', err)
  }
}

async function getGameState(gameId) {
  return axios.get(`http://393d049b.ngrok.io/${gameId}`);
}

async function joinGame(gameId) {
  if (gameId) {
    const resp = await axios.post(
      `http://393d049b.ngrok.io/${gameId}/players`,
      {
        name: "KMILLER"
      }
    );
    const turnToken = resp.headers["x-turn-token"];
    return { turnToken, data: resp.data };
  }
  console.error("FAILED TO JOIN GAME!!!!");
}

async function createGame(players) {
  const resp = await axios.post("http://393d049b.ngrok.io/", {
    seats: players
  });
  const gameId = resp.headers.location.substr(1);
  return gameId;
}

async function makeMove(gameId, state) {
  const { data, turnToken } = state;
  const { current_piece, next_piece, players } = data;
  const { board } = players.find(p => p.name === "KMILLER");
  const move = determinePlacement(current_piece, board);
  const resp = await axios.post(
    `http://393d049b.ngrok.io/${gameId}/moves`,
    move,
    {
      headers: {
        "x-turn-token": turnToken
      }
    }
  );
  const nextTurnToken = resp.headers["x-turn-token"];
  return { turnToken: nextTurnToken, data: resp.data };
}

function printBoard(board) {
  console.log('BOARD IS:')
  for(let y = board.length-1; y >= 0; y--) {
    const row = board[y]
    const cleanRow = row.map(v => v === null ? '-' : v)
    console.log(cleanRow)
  }
}

function determinePlacement(current_piece, board) {
  const options = findPlacementOptions(current_piece, board);
  const bestOption = findBestOption(options, board)
  console.log(`PLACING ${current_piece} AT`, bestOption)
  const newBoard = simulateMove(bestOption, board)
  printBoard(newBoard)
  return {
    locations: bestOption
  };
}

function findBestOption(options, board) {
  if (options.length === 0) throw new Error('NO MORE VALID OPTIONS - GAME OVER')
  let best = options[0]
  let bestScore = -10000
  for (let i=0; i < options.length; i++) {
    const option = options[i]
    const newBoard = simulateMove(option, board)
    // const newBoard = board
    const score = scoreBoard(newBoard)
    if (score > bestScore) {
      bestScore = score
      best = option
    }
  }
  return best
}

function scoreBoard(board) {
  let score = 0
  const baseRowScore = 10
  for(let y = 0; y < board.length; y++) {
    const row = board[y]
    const rowScore = (baseRowScore - y) * 3
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== null) score += rowScore
      if (board[y][x] === null && (y < board.length-1 && board[y+1][x] !== null)) { // is this a hole?
        console.log('HOLE AT', `(${x},${y}`)
        score -= 10
      }
    }
    if (row.indexOf(null) === -1) score += 50
  }
  console.log('SCORE IS', score)
  return score
}

function simulateMove (move, board) {
  const newBoard = []
  for (let y = 0; y < board.length; y++) {
    const row = board[y]
    newBoard.push(row.slice(0))
  }
  for (let i = 0; i < move.length; i++) {
    const coord = move[i]
    newBoard[coord.row][coord.col] = '#'
    console.log('UPDATING', coord)
  }
  return newBoard
}

function findPlacementOptions(current_piece, board) {
  let positionFunc, placement;
  switch (current_piece) {
    case "S":
      positionFunc = sPositions;
      break;
    case "Z":
      positionFunc = zPositions;
      break;
    case "L":
      positionFunc = lPositions;
      break;
    case "O":
      positionFunc = oPositions;
      break;
    case "T":
      positionFunc = tPositions;
      break;
    case "I":
      positionFunc = iPositions;
      break;
    case "J":
      positionFunc = jPositions;
      break;
    default:
      console.error("UNEXPECTED PIECE TYPE");
  }
  let validPlacements = [];
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    for (let x = 0; x < row.length; x++) {
      const isEmpty = board[y][x] === null;
      const hasBelow = y === 0 || board[y - 1][x] !== null;
      if (isEmpty && hasBelow) {
        const options = positionFunc(y, x);
        validPlacements = validPlacements.concat(
          options.filter(o => isValidPlacement(o, board))
        );
      }
    }
  }
  // console.log(`VALID PLACEMENTS FOR ${current_piece} ARE`, validPlacements);
  return validPlacements;
}

function isValidPlacement(placement, board) {
  let valid = true;
  for (let i = 0; i < placement.length; i++) {
    const p = placement[i];
    const { row, col } = p;
    if (
      row < 0 ||
      col < 0 ||
      row >= board.length ||
      col >= board[0].length ||
      board[row][col] !== null ||
      hasObstructions(board, row, col)
    ) {
      valid = false;
    }
  }
  return valid;
}

function hasObstructions(board, row, col) {
  let obstructions = false
  for (let y = row; y < board.length; y++) {
    if (board[y][col] !== null) {
      obstructions = true
    }
  }
  return obstructions
}

const iPositions = (row, col) => [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3]
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-3, 0]
  ],
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [0, -3]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const oPositions = (row, col) => [
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, 1]
  ],
  [
    [0, 0],
    [0, -1],
    [-1, 0],
    [-1, -1]
  ],
  [
    [0, 0],
    [0, 1],
    [-1, 0],
    [-1, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const tPositions = (row, col) => [
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [-1, 1]
  ],
  [
    [0, 0],
    [-1, -1],
    [-1, 0],
    [-2, 0]
  ],
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [-1, -1]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const sPositions = (row, col) => [
  [
    [0, 0],
    [0, -1],
    [-1, -1],
    [-1, -2]
  ],
  [
    [0, 0],
    [1, 0],
    [1, -1],
    [2, -1]
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [-2, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const zPositions = (row, col) => [
  [
    [0, 0],
    [0, 1],
    [-1, 1],
    [-1, 2]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [-2, -1]
  ],
  [
    [0, 0],
    [0, -1],
    [1, -1],
    [1, -2]
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const jPositions = (row, col) => [
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [-1, 0]
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-2, -1]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1]
  ],
  [
    [0, 0],
    [1, 0],
    [1, -1],
    [1, -2]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const lPositions = (row, col) => [
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-2, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, -1]
  ],
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [-1, -2]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

run();
