package gow

import (
	"code.google.com/p/go.net/websocket"
)

type Game struct {
	Players          []*Player
	BonusWords       [][]string
	tilesBag         []string
	tilePtr          int
	State            string
	Round            int
	CurrentPlayerIdx int

	register   chan *Player // Register requests from the players.
	unregister chan *Player // Unregister requests from players.

	moveMade chan string

	stateWaiting chan int
	statePlaying chan int
}

type Player struct {
	Id    int
	game  *Game
	Words []string
	Score int
	Tiles []string
	Swaps int
	ws    *websocket.Conn // The websocket connection.
	send  chan *Update    // Buffered channel of outbound messages.
}

type Update struct {
	Action    string
	Value     string
	PlayerIdx int
	GameState interface{} // update message. tells the client what really has changed
}

type PlayerMessage struct {
	Action string
	Word   string
	Tiles  []int
}

// game states
const GS_WAITING = "waiting"
const GS_PLAYING = "playing"

// update strings
const ACT_WELCOME = "welcome"
const ACT_START = "start"
const ACT_PLAYER_JOINED = "player_joined"
const ACT_PLAYER_LEFT = "player_left"
const ACT_GAME_OVER = "game_over"
const ACT_REQUEST_WORD = "request_word"
const ACT_WORD_MADE = "word"
const ACT_SWAP = "swap"
const ACT_INVALID_WORD = "invalid_word"
