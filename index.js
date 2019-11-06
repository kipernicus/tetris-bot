const axios = require('axios')

async function run () {
  const create = process.env.CREATE
  const players = process.env.PLAYERS || 1
  if (create) {
    const gameId = await createGame(players)
    // const state = await getGameState(gameId)
    const state = await joinGame(gameId)
    let gameOver = false
    let nextState = state
    do {
      // console.log('STATE IS:', JSON.stringify(nextState, null, 2))
      nextState = await makeMove(gameId, nextState)
      console.log('MADE A MOVE')
    } while (!gameOver)
  } else {
    console.log('ERROR: NOT DONE')
  }
}

async function getGameState(gameId) {
  return axios.get(`http://393d049b.ngrok.io/${gameId}`)
}

async function joinGame (gameId) {
  if (gameId) {
    const resp = await axios.post(`http://393d049b.ngrok.io/${gameId}/players`, {
      name: 'KMILLER'
    })
    const turnToken = resp.headers['x-turn-token']
    return { turnToken, data: resp.data }
  }
  console.error('FAILED TO JOIN GAME!!!!')
}

async function createGame (players) {
  const resp = await axios.post('http://393d049b.ngrok.io/', {
    seats: players
  })
  const gameId = resp.headers.location.substr(1)
  return gameId
}

async function makeMove (gameId, state) {
  const { data, turnToken } = state
  const move = determinePlacement(data)
  const resp = await axios.post(`http://393d049b.ngrok.io/${gameId}/moves`, move, {
    headers: {
      'x-turn-token': turnToken
    }
  })
  const nextTurnToken = resp.headers['x-turn-token']
  return { turnToken: nextTurnToken, data: resp.data }
}

function determinePlacement(data) {
  const { current_piece, next_piece, players  } = data
  const { board } = players.find(p => p.name === 'KMILLER')
  console.log('CURRENT STATE', current_piece, board)
  const options = findPlacementOptions(current_piece, board)

  return {
    locations: options[0]
  }
}

function placeS (options, next_piece, board) {
  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ]
}

function placeZ (options, next_piece, board) {
  return [
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ]
}

function placeL (options, next_piece, board) {
  return [
    { row: 2, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]
}

function placeO (options, next_piece, board) {
  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ]
}

function placeT (options, next_piece, board) {
  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
  ]
}

function placeI (options, next_piece, board) {
  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ]
}

function placeJ (options, next_piece, board) {
  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 0 },
  ]
}

function findPlacementOptions (current_piece, board) {

  let positionFunc, placement
  switch (current_piece) {
    case 'S':
      placement = placeS()
      break;
    case 'Z':
      placement = placeZ()
      break;
    case 'L':
      placement = placeL()
      break;
    case 'O':
      positionFunc = oPositions
      break;
    case 'T':
      placement = placeT()
      break;
    case 'I':
      positionFunc = iPositions
      break;
    case 'J':
      placement = placeJ()
      break;
    default: console.error('UNEXPECTED PIECE TYPE')
  }
  let validPlacements = []
  if (!positionFunc) {
    return [placement]
  } else {
    for (let y = 0; y < board.length; y++ ) {
      const row = board[y]
      for (let x = 0; x < row.length; x++) {
        const isEmpty = board[y][x] === null
        if (isEmpty) {
          const options = positionFunc(x, y)
          validPlacements = validPlacements.concat(options.filter(o => isValidPlacement(o, board)))
        }
      }
    }
    console.log('VALID PLACEMENTS ARE', validPlacements)
    return validPlacements
  }
}

function isValidPlacement(placement, board) {
  let valid = true
  for (let i = 0; i < placement.length; i++) {
    const p = placement[i]
    const {row, col} = p
    if (row < 0 || col < 0 || row >= board.length || col >= board[0].length || board[row][col] !== null) {
      valid = false
    }
  }
  return valid
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

run()
