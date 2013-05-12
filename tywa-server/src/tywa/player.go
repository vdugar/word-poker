package tywa

import (
	"code.google.com/p/go.net/websocket"
	log "code.google.com/p/log4go"
)

func CreatePlayer(id int, name string, cash int) *Player {
	p := &Player{
		Id:      id,
		Name:    name,
		Cash:    cash,
		Picture: "",
	}

	return p
}

func (p *Player) Init(playerIdx int, name string, ws *websocket.Conn) {
	p.send = make(chan *Update)
	p.bet = make(chan *PlayerBet)
	p.Hand = make([]string, NUM_CARDS_PLAYER)
	p.BetAction = BET_WAITING
	p.CumulativeBetAmount = 0
	p.ws = ws
	p.BetAction = BET_WAITING
	p.CumulativeBetAmount = 0
	p.Word = ""
	p.WordValidity = false
}

func (p *Player) cleanup() {
	if p.ws != nil {
		p.ws.Close()
		p.ws = nil
	}
	if p.send != nil {
		close(p.send)
		p.send = nil
	}
	if p.bet != nil {
		close(p.bet)
		p.bet = nil
	}
}

func (p *Player) reader(game *Game) {
	var pm PlayerMessage

	defer func() {
		if game.awaitingPlayerBet == p {
			pb := &PlayerBet{betAction: BET_LEFT, betAmount: 0}
			p.bet <- pb
		} else if _, ok := game.awaitingPlayersWord[p.Id]; ok {
			pw := &PlayerWord{player: p, word: pm.Word}
			delete(game.awaitingPlayersWord, p.Id) // user can send the word only once. remove him from the waiting-for-word list
			game.playersWord <- pw
		}
	}()

	for {
		err := websocket.JSON.Receive(p.ws, &pm)
		if err != nil {
			p.ws.Close()
			break
		}
		if game.awaitingPlayerBet == p {
			pb := &PlayerBet{betAction: pm.BetAction, betAmount: pm.BetAmount}
			p.bet <- pb
		} else if _, ok := game.awaitingPlayersWord[p.Id]; ok {
			pw := &PlayerWord{player: p, word: pm.Word}
			delete(game.awaitingPlayersWord, p.Id) // user can send the word only once. remove him from the waiting-for-word list
			game.playersWord <- pw
		} else {
			log.Debug("Incoming message from player %d ignored.", p.Id)
		}
	}
}

func (p *Player) writer() {
	defer func() {
		if err := recover(); err != nil {
			p.ws.Close()
		}
	}()

	for u := range p.send {
		err := websocket.JSON.Send(p.ws, u)
		if err != nil {
			p.ws.Close()
			break
		}
	}
}
