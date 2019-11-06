const axios = require("axios");

async function run() {
  const create = process.env.CREATE;
  const players = process.env.PLAYERS || 1;
  if (create) {
    const gameId = await createGame(players);
    // const state = await getGameState(gameId)
    const state = await joinGame(gameId);
    let gameOver = false;
    let nextState = state;
    try {
      do {
        // console.log('STATE IS:', JSON.stringify(nextState, null, 2))
        nextState = await makeMove(gameId, nextState);
        console.log("MADE A MOVE");
      } while (!gameOver);
    } catch (err) {
      console.log('DEATH!!!', err.response.data)
    }
  } else {
    console.log("ERROR: NOT DONE");
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
  const move = determinePlacement(data);
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

function determinePlacement(data) {
  const { current_piece, next_piece, players } = data;
  const { board } = players.find(p => p.name === "KMILLER");
  const options = findPlacementOptions(current_piece, board);
  const bestOption = findBestOption(options, board)
  return {
    locations: bestOption
  };
}

function findBestOption(options, board) {
  return options[0]
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
        const options = positionFunc(x, y);
        validPlacements = validPlacements.concat(
          options.filter(o => isValidPlacement(o, board))
        );
      }
    }
  }
  console.log(`VALID PLACEMENTS FOR ${current_piece} ARE`, validPlacements);
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
      board[row][col] !== null
    ) {
      valid = false;
    }
  }
  return valid;
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
    [0, -1],
    [0, -2],
    [-1, -1]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [-2, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1]
  ],
  [
    [0, 0],
    [1, -1],
    [1, 0],
    [2, 0]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const sPositions = (row, col) => [
  [
    [0, 0],
    [0, -1],
    [1, -1],
    [1, -2]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [-2, -1]
  ],
  [
    [0, 0],
    [0, 1],
    [-1, 1],
    [-1, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const zPositions = (row, col) => [
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [1, -1],
    [2, -1]
  ],
  [
    [0, 0],
    [0, -1],
    [-1, -1],
    [-1, -2]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [-2, 1]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const jPositions = (row, col) => [
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [-1, -2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, -1]
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-2, 1]
  ],
  [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [-1, -2]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

const lPositions = (row, col) => [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [-1, 2]
  ],
  [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-2, -1]
  ],
  [
    [0, 0],
    [0, -1],
    [0, -2],
    [1, -2]
  ]
].map(positions => positions.map(([x, y]) => ({ row: row + x, col: col + y })))

run();
