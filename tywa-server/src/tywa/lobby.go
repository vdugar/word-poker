package tywa

import (
	log "code.google.com/p/log4go"
	"html/template"
	"math/rand"
	"misc"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func CreateLobby(numGames int) *Lobby {
	lobby := &Lobby{
		Games:        make(map[int]*Game),
		Players:      make(map[int]*Player),
		gameIdOffset: TABLE_ID_OFFSET,
		handSets:     make([]*HandSet, 0, NUM_HANDSETS),
	}

	lobby.handSets = InitHandSets(lobby.handSets)
	log.Debug("Loaded up %d sets into memory.", len(lobby.handSets))

	for i := 0; i < numGames; i++ {
		lobby.AddGame()
	}

	return lobby
}

func (l *Lobby) AddGame() {
	l.gameIdOffset = l.gameIdOffset + 1
	gameId := l.gameIdOffset
	conn_url := "/ws/" + strconv.Itoa(l.gameIdOffset) + "/"
	g := CreateGame(gameId, conn_url, l)

	l.Games[g.Id] = g
}

func (l *Lobby) RemoveGame(gameId int) {
	log.Debug("Removing game %d from lobby.", gameId)
	l.Games[gameId].cleanup()
}

func (l *Lobby) GetGames() map[int]*Game {
	return l.Games
}

func (l *Lobby) GetPlayers() map[int]*Player {
	return l.Players
}

func (l *Lobby) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.URL.Path == "/":
		http.Redirect(w, r, "/lobby/", http.StatusFound)
	case strings.HasPrefix(r.URL.Path, "/lobby/"):
		l.lobbyInterface(w, r)
	case strings.HasPrefix(r.URL.Path, "/verify/"):
		l.handleLogin(w, r)
	case strings.HasPrefix(r.URL.Path, "/logout/"):
		l.handleLogout(w, r)
	case strings.HasPrefix(r.URL.Path, "/login/"):
		l.loginInterface(w, r)
	case strings.HasPrefix(r.URL.Path, "/console/"):
		l.consoleInterface(w, r)
	case strings.HasPrefix(r.URL.Path, "/table/"):
		l.tableInterface(w, r)
	case strings.HasPrefix(r.URL.Path, "/game/"):
		l.gameInterface(w, r)
	}
}

func (l *Lobby) handleLogin(w http.ResponseWriter, r *http.Request) {
	playerName := r.FormValue("player-name")
	playerIdStr := misc.GetCookie(r, "playerId")
	playerId, _ := strconv.Atoi(playerIdStr)
	if playerIdStr != "" {
		if _, ok := l.Players[playerId]; ok == false {
			p := CreatePlayer(playerId, playerName, PLAYER_INIT_CASH)
			l.Players[playerId] = p
		}
	} else {
		playerId = time.Now().Hour()*1000000 + time.Now().Minute()*10000 + time.Now().Second()*100 + rand.Intn(99) + rand.Intn(99)
		p := CreatePlayer(playerId, playerName, PLAYER_INIT_CASH)
		l.Players[playerId] = p

		misc.SetCookie(w, "playerId", strconv.Itoa(playerId))
		misc.SetCookie(w, "playerName", playerName)
	}
	log.Debug("%s (%d) entered the lobby.", playerName, playerId)
	http.Redirect(w, r, "/lobby/", http.StatusFound)
}

func (l *Lobby) handleLogout(w http.ResponseWriter, r *http.Request) {
	playerIdStr := misc.GetCookie(r, "playerId")
	if playerIdStr != "" {
		playerId, _ := strconv.Atoi(playerIdStr)
		if _, ok := l.Players[playerId]; ok != false {
			log.Debug("%s (%d) left the lobby.", l.Players[playerId].Name, playerId)
			delete(l.Players, playerId)
		}
		misc.UnsetCookie(w, r, "playerId")
		misc.UnsetCookie(w, r, "playerName")
	}
	http.Redirect(w, r, "/login/", http.StatusFound)
}

func (l *Lobby) lobbyInterface(w http.ResponseWriter, r *http.Request) {
	var lobbyTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "tywa-server/templates/lobby.html"))

	playerIdStr := misc.GetCookie(r, "playerId")
	playerName := misc.GetCookie(r, "playerName")
	playerId, _ := strconv.Atoi(playerIdStr)
	if playerIdStr != "" {
		if _, ok := l.Players[playerId]; ok == true {
			l.Players[playerId].BetAction = BET_WAITING

			data := map[string]interface{}{}
			data["players"] = l.GetPlayers()
			data["games"] = l.GetGames()
			data["host"] = r.Host
			data["playerId"] = playerId
			data["PlayerName"] = playerName
			lobbyTempl.Execute(w, data)
		} else {
			http.Redirect(w, r, "/login/", http.StatusFound)
		}
	} else {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
}

func (l *Lobby) loginInterface(w http.ResponseWriter, r *http.Request) {
	var loginTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "tywa-server/templates/login.html"))

	playerIdStr := misc.GetCookie(r, "playerId")
	playerId, _ := strconv.Atoi(playerIdStr)
	if playerIdStr != "" {
		if _, ok := l.Players[playerId]; ok == false {
			playerName := misc.GetCookie(r, "playerName")
			p := CreatePlayer(playerId, playerName, PLAYER_INIT_CASH)
			l.Players[playerId] = p
		}
		http.Redirect(w, r, "/lobby/", http.StatusFound)
	} else {
		data := map[string]interface{}{}
		data["host"] = r.Host
		loginTempl.Execute(w, data)
	}
}

func (l *Lobby) consoleInterface(w http.ResponseWriter, r *http.Request) {
	var consoleTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "tywa-server/templates/console.html"))

	playerIdStr := misc.GetCookie(r, "playerId")
	playerName := misc.GetCookie(r, "playerName")

	playerId, _ := strconv.Atoi(playerIdStr)
	if playerIdStr != "" {
		urlTokens := strings.Split(r.URL.Path, "/") // /console/<table-ID>/
		tableIdStr := urlTokens[2]
		tableId, _ := strconv.Atoi(tableIdStr)

		if g := l.Games[tableId]; g != nil {
			data := map[string]interface{}{}
			data["host"] = r.Host
			data["tableId"] = tableId
			data["playerId"] = playerId
			data["playerName"] = playerName
			consoleTempl.Execute(w, data)
		} else {
			log.Debug("Table", tableId, "doesn't exist.")
			http.Redirect(w, r, "/lobby/", http.StatusFound)
		}
	} else {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
}

// wrapper around table to render it in a 960x640 frame
func (l *Lobby) gameInterface(w http.ResponseWriter, r *http.Request) {
	var wrapperTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "tywa-server/templates/wrapper.html"))

	urlTokens := strings.Split(r.URL.Path, "/") // /console/<table-ID>/
	tableIdStr := urlTokens[2]
	tableId, _ := strconv.Atoi(tableIdStr)

	if g := l.Games[tableId]; g != nil {
		// make sure that the table is active
		if g.State == GS_INACTIVE {
			g.init()
		}

		data := map[string]interface{}{}
		data["host"] = r.Host
		data["tableId"] = tableId
		wrapperTempl.Execute(w, data)
	} else {
		log.Debug("Table", tableId, "doesn't exist.")
		http.Redirect(w, r, "/lobby/", http.StatusFound)
	}
}

func (l *Lobby) tableInterface(w http.ResponseWriter, r *http.Request) {
	var tableTempl = template.Must(template.ParseFiles(misc.GetRootDir() + "tywa-server/templates/table.html"))
	playerIdStr := misc.GetCookie(r, "playerId")
	playerName := misc.GetCookie(r, "playerName")
	playerId, _ := strconv.Atoi(playerIdStr)
	if playerIdStr != "" {
		urlTokens := strings.Split(r.URL.Path, "/") // /console/<table-ID>/
		tableIdStr := urlTokens[2]
		tableId, _ := strconv.Atoi(tableIdStr)

		if g := l.Games[tableId]; g != nil {
			// make sure that the table is active
			if g.State == GS_INACTIVE {
				g.init()
			}

			data := map[string]interface{}{}
			data["host"] = r.Host
			data["tableId"] = tableId
			data["playerId"] = playerId
			data["playerName"] = playerName
			tableTempl.Execute(w, data)
		} else {
			log.Debug("Table", tableId, "doesn't exist.")
			http.Redirect(w, r, "/lobby/", http.StatusFound)
		}
	} else {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
}
