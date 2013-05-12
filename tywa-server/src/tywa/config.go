package tywa

const TABLE_ID_OFFSET = 100

const NUM_TILES = 98
const PLAYER_IDX_OFFSET = 2001

const MIN_PLAYERS = 2
const MAX_PLAYERS = 4

const NUM_CARDS_PLAYER = 2
const NUM_CARDS_COMMUNITY = 5

const PLAYER_INIT_CASH = 2500
const BLIND_AMOUNT = 50

const DUR_WAIT_GAME_START = 2000 // when the game is starting, we wait for players to join. on production, this should be 0 (in miliseconds)
const DUR_WAIT_GAME_OVER = 8000   // after a game is finished, pause before looping back into the new game (in miliseconds)
const DUR_START_COOLDOWN = 20000  // time before the betting starts at the start of a game
const DUR_REVEAL_COOLDOWN = 15000 // time before the betting starts after card1 / card2 has been revealed

const HANDSETS_FILE = "config/letters.txt"
const LOG_FILE = "/var/log/wordpoker/error.log"
const NUM_HANDSETS = 10000
