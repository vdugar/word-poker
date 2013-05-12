package gow

import (
	"code.google.com/p/go.net/websocket"
	log "code.google.com/p/log4go"
	"html/template"
	"misc"
	"net/http"
	"strings"
)

var playersMaster = make(map[int]*Player)

func CreateGame() *Game {
	game := &Game{}

	game.register = make(chan *Player)
	game.unregister = make(chan *Player)
	game.moveMade = make(chan string)

	http.Handle("/ws/", websocket.Handler(func(ws *websocket.Conn) {
		game.wsHandler(ws)
	}))

	game.init()

	return game
}

func (g *Game) init() {
	g.register = make(chan *Player)
	g.unregister = make(chan *Player)
	g.Players = make([]*Player, 0, MAX_PLAYERS)

	g.tilesBag = make([]string, 0, NUM_TILES)

	g.stateWaiting = make(chan int)
	g.statePlaying = make(chan int)

	go g.processRegistration()

	go g.GameStateWaiting()
	go g.GameStatePlaying()

	g.stateWaiting <- 1
	g.State = GS_WAITING

	log.Debug("Game initialised...")
}

func (g *Game) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.URL.Path == "/":
		http.Redirect(w, r, "/lobby/", http.StatusFound)
	case strings.HasPrefix(r.URL.Path, "/console/"):
		g.consoleInterface(w, r)
	case strings.HasPrefix(r.URL.Path, "/game/"):
		g.gameInterface(w, r)
	}
}

func (g *Game) ResetGame() {
	g.BonusWords = getBonusWords()
	log.Debug(g.BonusWords)
	g.tilesBag = shuffleLetters(NUM_TILES)
	log.Debug(g.tilesBag)
	g.tilePtr = 0
	g.Round = 1
	g.CurrentPlayerIdx = -1
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

	log.Debug("GAME: cleanup")
}

func (g *Game) wsHandler(ws *websocket.Conn) {

	pid := 0
	if len(g.Players) > 0 {
		pid = g.Players[len(g.Players)-1].Id + 1
	} else {
		pid = 1
	}
	p := CreatePlayer(ws, pid, g)
	g.register <- p
	defer func() {
		recover()
		g.unregister <- p
		p.cleanup()
	}()

	go p.writer()
	p.reader(g)
}

func (g *Game) sendUpdate(action string, value string, playerIdx int, p *Player) {
	u := &Update{}
	u.Action = action
	u.Value = value
	u.PlayerIdx = playerIdx
	u.GameState = g

	if p != nil {
		p.send <- u
	} else {
		for _, p := range g.Players {
			if p != nil {
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
			seatedPlayer := false
			for i, c := range g.Players {
				if c == nil { // empty seat found. Seat the player here
					g.sendUpdate(ACT_WELCOME, "", p.Id, p)
					g.Players[i] = p
					g.sendUpdate(ACT_PLAYER_JOINED, "", p.Id, nil)

					log.Debug("Player %d joined game.", p.Id)
					seatedPlayer = true
					break
				}
			}

			if !seatedPlayer {
				if len(g.Players) < MAX_PLAYERS {
					g.sendUpdate(ACT_WELCOME, "", p.Id, p)
					g.Players = append(g.Players, p)
					g.sendUpdate(ACT_PLAYER_JOINED, "", p.Id, nil)

					log.Debug("Player %d joined game.", p.Id)
				}
			}

		case p := <-g.unregister:
			log.Debug("Player %d left game.", p.Id)
			pid := p.Id
			for i, pl := range g.Players {
				if pl.Id == p.Id {
					g.Players = append(g.Players[:i], g.Players[i+1:]...)
					break
				}
			}
			g.sendUpdate(ACT_PLAYER_LEFT, "", pid, nil)
		}
	}
}

func (g *Game) getTiles(numTiles int) []string {
	var resp []string

	if g.tilePtr+numTiles < len(g.tilesBag) {
		resp = g.tilesBag[g.tilePtr : g.tilePtr+numTiles]
		g.tilePtr = g.tilePtr + numTiles
	} else {
		resp = g.tilesBag[g.tilePtr:]
		g.tilePtr = len(g.tilesBag)
	}
	log.Debug("Tiles Ptr = %d", g.tilePtr)
	return resp
}

func (g *Game) consoleInterface(w http.ResponseWriter, r *http.Request) {
	var consoleTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "gamble-server/templates/console.html"))

	data := map[string]interface{}{}
	data["host"] = r.Host
	consoleTempl.Execute(w, data)
}

func (g *Game) gameInterface(w http.ResponseWriter, r *http.Request) {
	var gameTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "gamble-server/templates/wrapper.html"))

	data := map[string]interface{}{}
	data["host"] = r.Host
	gameTempl.Execute(w, data)
}

func (g *Game) isBonusWord(word string) (bool, int) {
	for i, bWords := range g.BonusWords {
		for _, w := range bWords {
			if w == word {
				return true, g.bonusPoints(i)
			}
		}
	}
	return false, 0
}

func (g *Game) bonusPoints(lvl int) int {
	switch lvl {
	case 0:
		return BONUS_POINTS_0
	case 1:
		return BONUS_POINTS_1
	}
	return 0
}
