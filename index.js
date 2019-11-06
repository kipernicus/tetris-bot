const axios = require('axios')

async function run () {
  const create = process.env.CREATE
  const players = process.env.PLAYERS || 1
  if (create) {
    const gameId = await createGame(players)
    // const state = await getGameState(gameId)
    const state = await joinGame(gameId)
    console.log(JSON.stringify(state, null, 2))
    let gameOver = false
    let nextState = state
    do {
      nextState = await makeMove(gameId, nextState)
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
  return axios.post(`http://393d049b.ngrok.io/${gameId}/moves`, move, {
    headers: {
      'x-turn-token': turnToken
    }
  })
}

function determinePlacement(data) {
  const { current_piece, next_piece, board } = data

  console.log(board)

  switch (current_piece) {
    case 'I':

    case 'J':

    case 'L':

    case 'O':

    case 'S':

    case 'Z':

    case 'T':
  }

  return {
    locations: [
      {}
    ]
  }
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
