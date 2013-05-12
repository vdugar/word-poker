package tywa

import (
	"code.google.com/p/go.net/websocket"
	log "code.google.com/p/log4go"
	"math/rand"
	"misc"
	"net/http"
	"strconv"
)

var playersMaster = make(map[int]*Player)

func CreateGame(id int, conn_url string, l *Lobby) *Game {
	game := &Game{
		Id:    id,
		lobby: l,
		State: GS_INACTIVE,
	}

	http.Handle(conn_url, websocket.Handler(func(ws *websocket.Conn) {
		game.wsHandler(ws)
	}))

	game.init()

	return game
}

func (g *Game) init() {
	g.register = make(chan *Player)
	g.unregister = make(chan *Player)
	g.Players = make([]*Player, 0, MAX_PLAYERS)
	g.State = GS_WAITING
	g.PotAmount = 0
	g.CommunityCards = make([]string, NUM_CARDS_COMMUNITY)
	g.didRevealCard1 = false
	g.didRevealCard2 = false
	g.CurrentBetAmount = 0
	g.tilesBag = make([]int, 0)
	g.firstBetter = nil
	g.minBet = 0

	g.awaitingPlayerBet = nil
	g.awaitingPlayersWord = make(map[int]int)

	g.playersWord = make(chan *PlayerWord)

	g.stateWaiting = make(chan int)
	g.stateDealing = make(chan int)
	g.stateBetting = make(chan int)
	g.stateRevealingCard1 = make(chan int)
	g.stateRevealingCard2 = make(chan int)
	g.stateFetchingWords = make(chan int)
	g.stateFinishing = make(chan int)

	go g.processRegistration()

	go g.GameStateWaiting()
	go g.GameStateDealing()
	go g.GameStateBetting()
	go g.GameStateRevealingCard1()
	go g.GameStateRevealingCard2()
	go g.GameStateFetchingWords()
	go g.GameStateWaitingForWords()
	go g.GameStateFinishing()

	g.stateWaiting <- 1

	log.Debug("Game %d initialised...", g.Id)
}

func (g *Game) cleanup() {

	if g.register != nil {
		close(g.register)
		g.register = nil
	}
	if g.unregister != nil {
		close(g.unregister)
		g.unregister = nil
	}
	if g.playersWord != nil {
		close(g.playersWord)
		g.playersWord = nil
	}
	if g.stateWaiting != nil {
		close(g.stateWaiting)
		g.stateWaiting = nil
	}
	if g.stateDealing != nil {
		close(g.stateDealing)
		g.stateDealing = nil
	}
	if g.stateBetting != nil {
		close(g.stateBetting)
		g.stateBetting = nil
	}
	if g.stateRevealingCard1 != nil {
		close(g.stateRevealingCard1)
		g.stateRevealingCard1 = nil
	}
	if g.stateRevealingCard2 != nil {
		close(g.stateRevealingCard2)
		g.stateRevealingCard2 = nil
	}
	if g.stateFetchingWords != nil {
		close(g.stateFetchingWords)
		g.stateFetchingWords = nil
	}
	if g.stateFinishing != nil {
		close(g.stateFinishing)
		g.stateFinishing = nil
	}
	log.Debug("GAME: cleanup")
	g.State = GS_INACTIVE
}

func (g *Game) ResetGame() {
	g.PotAmount = 0
	g.CommunityCards = make([]string, NUM_CARDS_COMMUNITY)
	g.didRevealCard1 = false
	g.didRevealCard2 = false
	g.CurrentBetAmount = 0
	g.tilesBag = rand.Perm(NUM_TILES)
	g.minBet = BLIND_AMOUNT

	g.resetBet(true)
}

func (g *Game) wsHandler(ws *websocket.Conn) {
	id, err := strconv.Atoi(misc.GetCookie(ws.Request(), "playerId"))
	name := misc.GetCookie(ws.Request(), "playerName")

	if err == nil {
		p := g.lobby.Players[id]
		if p != nil {
			p.Init(id, name, ws)

			g.register <- p
			defer func() {
				recover()
				g.unregister <- p
				p.cleanup()
			}()

			go p.writer()
			p.reader(g)
		} else {
			log.Debug("Player not in players list. Send him to lobby.")
		}
	} else {
		log.Debug("Player ID not found in cookie.")
	}
}

func (g *Game) sendUpdate(action string, playerIdx string, minBet int, p *Player) {
	u := &Update{}
	u.Action = action
	u.PlayerIdx = playerIdx
	u.MinBet = minBet
	u.GameState = g

	if p != nil {
		p.send <- u
	} else {
		for _, p := range g.Players {
			if p != nil && p.BetAction != BET_LEFT {
				p.send <- u
			}
		}
	}
}

func (g *Game) processRegistration() {
	defer func() {
		recover()
	}()

	for {
		select {
		case p := <-g.register:
			// first check if the player has cash. If not, he cant play.
			if p.Cash <= 0 {
				log.Debug("Player %d has no cash. Sending him back to lobby", p.Id)
				g.sendUpdate(ACT_BYE, strconv.Itoa(p.Id), 0, p)
			} else {
				seatedPlayer := false
				for i, c := range g.Players {
					if c == nil { // empty seat found. Seat the player here
						g.sendUpdate(ACT_WELCOME, strconv.Itoa(p.Id), 0, p)
						g.Players[i] = p

						g.sendUpdate(ACT_PLAYER_JOINED, strconv.Itoa(p.Id), 0, nil)

						log.Debug("Player %d joined game %d.", p.Id, g.Id)
						seatedPlayer = true
						break
					}
				}

				if !seatedPlayer {
					if len(g.Players) < MAX_PLAYERS {
						g.sendUpdate(ACT_WELCOME, strconv.Itoa(p.Id), 0, p)
						g.Players = append(g.Players, p)

						g.sendUpdate(ACT_PLAYER_JOINED, strconv.Itoa(p.Id), 0, nil)

						log.Debug("Player %d joined game %d.", p.Id, g.Id)
					} else {
						log.Debug("Game %d is full. Player %d can't join now.", g.Id, p.Id)
						g.sendUpdate(ACT_BYE, strconv.Itoa(p.Id), 0, p)
					}
				}
			}

		case p := <-g.unregister:
			log.Debug("Player %d left game %d.", p.Id, g.Id)
			p.BetAction = BET_LEFT

			for i, pl := range g.Players {
				if pl != nil {
					if pl.Id == p.Id {
						g.Players[i] = nil // set the player position to NIL
						break
					}
				}
			}
			g.sendUpdate(ACT_PLAYER_LEFT, strconv.Itoa(p.Id), 0, nil)

			// check if min players are on the table otherwise send everyone a BYE message and return to waiting state
			numPlayers := 0
			for _, p := range g.Players {
				if p != nil && p.BetAction != BET_WAITING {
					numPlayers++
				}
			}
			if numPlayers < MIN_PLAYERS && g.State != GS_WAITING {
				g.AbortGame()
			}

		}
	}
}

func (g *Game) AbortGame() {
	numSentToLobby := 0
	for i, p := range g.Players {
		if p != nil {
			g.sendUpdate(ACT_BYE, strconv.Itoa(p.Id), 0, p)
			g.Players[i] = nil
			numSentToLobby++
		}
	}

	log.Debug("Insufficient players on the table. Sending %d players to the lobby.", numSentToLobby)
	log.Debug("---- end of game (GAME ABORTED) ----")
	g.State = GS_WAITING
	g.stateWaiting <- 1
}

func (g *Game) computeWinner() []*Player {
	winners := make([]*Player, 0)

	// first check if everyone, execpt for one player have folded. in that case, he is the winner
	allFolded, standingPlayer := g.checkAllFolded()
	if allFolded { // all except 1 have folded. betting over
		winners = append(winners, standingPlayer)
		return winners
	}

	// process and dump the word validity into each player's object.
	for _, p := range g.Players {
		if WordExists(p.Word) {
			p.WordValidity = true
		} else {
			p.WordValidity = false
		}
	}

	for _, p := range g.Players {
		if p.WordValidity == false {
			continue
		}

		if len(winners) > 0 {
			p0wordScore := WordScore(winners[0].Word)
			wordScore := WordScore(p.Word)

			if wordScore == p0wordScore {
				winners = append(winners, p)
			} else if wordScore > p0wordScore {
				winners = make([]*Player, 0) // remove all players
				winners = append(winners, p)
			}
		} else {
			winners = append(winners, p)
		}
	}

	if len(winners) > 0 { // we have winners
		return winners
	}

	// we have no winners
	return nil
}
