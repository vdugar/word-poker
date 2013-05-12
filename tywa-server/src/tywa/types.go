package tywa

import (
	"code.google.com/p/go.net/websocket"
)

type Lobby struct {
	Games        map[int]*Game
	Players      map[int]*Player
	gameIdOffset int
	handSets     []*HandSet
}

type Game struct {
	Id             int
	lobby          *Lobby
	Players        []*Player
	State          string
	PotAmount      int
	CommunityCards []string
	didRevealCard1 bool
	didRevealCard2 bool
	tilesBag       []int
	firstBetter    *Player
	minBet         int

	CurrentBetAmount    int // when a user calls match, this is the amount we need to match to
	awaitingPlayerBet   *Player
	awaitingPlayersWord map[int]int // list of players who need to send their word. the value is redundant. we only need the key

	register    chan *Player // Register requests from the players.
	unregister  chan *Player // Unregister requests from players.
	playersWord chan *PlayerWord

	stateWaiting        chan int
	stateDealing        chan int
	stateBetting        chan int
	stateRevealingCard1 chan int
	stateRevealingCard2 chan int
	stateFetchingWords  chan int
	stateFinishing      chan int
}

type Player struct {
	Id                  int
	Name                string
	Cash                int
	Hand                []string
	BetAction           string
	CumulativeBetAmount int
	Word                string
	WordValidity        bool
	Picture             string

	ws   *websocket.Conn // The websocket connection.
	send chan *Update    // Buffered channel of outbound messages.
	bet  chan *PlayerBet // contains the move by the player
}

/*
 *	Update - Message wrapper that is sent to the client from the server
 */
type Update struct {
	Action    string // game_state / player_move
	PlayerIdx string
	MinBet    int
	GameState interface{} // update message. tells the client what really has changed
}

type PlayerMessage struct {
	BetAction string
	BetAmount int
	Word      string
}

type PlayerBet struct {
	betAction string
	betAmount int
}

type PlayerWord struct {
	player *Player
	word   string
}

type WordScoreTuple struct {
	word     string
	score    int
	validity bool
}

type HandSet struct {
	community []string
	players   []([]string)
}

// game states
const GS_INACTIVE = "inactive"
const GS_WAITING = "waiting"
const GS_DEALING = "dealing"
const GS_BETTING = "betting"
const GS_REVEALING_CARD1 = "revealing_card1"
const GS_REVEALING_CARD2 = "revealing_card2"
const GS_FETCHING_WORDS = "fetching_words"
const GS_FINISHING = "finishing"

// bet actions
const BET_WAITING = "waiting"
const BET_WAITING_TURN = "waiting_turn"
const BET_RAISE = "raise"
const BET_CHECK = "check"
const BET_CALL = "call"
const BET_ALLIN = "allin"
const BET_FOLD = "fold"
const BET_LEFT = "left"

// update strings
const ACT_WELCOME = "welcome"
const ACT_BYE = "bye"
const ACT_START = "start"
const ACT_REQUEST_BET = "request_bet"
const ACT_PLAYER_BET = "player_bet"
const ACT_PLAYER_JOINED = "player_joined"
const ACT_PLAYER_LEFT = "player_left"
const ACT_REVEAL_CARD1 = "reveal_card1"
const ACT_REVEAL_CARD2 = "reveal_card2"
const ACT_REQUEST_WORD = "request_word"
const ACT_GAME_OVER = "game_over"

// bet completion status
const BS_INCOMPLETE = "incomplete"
const BS_BETS_EVEN = "bets_even"
const BS_ALL_FOLDED = "all_folded"
const BS_NO_CASH = "no_cash"
