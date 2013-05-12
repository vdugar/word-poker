package gow

import (
	"code.google.com/p/go.net/websocket"
	log "code.google.com/p/log4go"
	"strings"
)

func CreatePlayer(ws *websocket.Conn, pid int, g *Game) *Player {
	p := &Player{}

	p.Id = pid
	p.game = g
	p.Words = make([]string, 0)
	p.Score = 0
	p.ws = ws
	p.send = make(chan *Update)

	return p
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
}

func (p *Player) reader(game *Game) {
	var pm PlayerMessage

	defer func() {
	}()

	for {
		err := websocket.JSON.Receive(p.ws, &pm)
		if err != nil {
			p.ws.Close()
			break
		}

		switch pm.Action {
		case "swap":
			tileIndexes := pm.Tiles
			numTiles := len(tileIndexes)

			newTiles := game.getTiles(numTiles)
			for i, t := range newTiles {
				p.Tiles[tileIndexes[i]] = t
			}

			p.Swaps += numTiles

			game.sendUpdate(ACT_SWAP, strings.Join(newTiles, ","), p.Id, nil)

		case "word":
			if game.CurrentPlayerIdx == p.Id {
				exists := WordExists(pm.Word)

				if exists {
					p.Words = append(p.Words, pm.Word)
					wScore := wordScore(pm.Word)
					p.Score += wScore

					isBonusWord, bonusPoints := game.isBonusWord(pm.Word)
					if isBonusWord {
						log.Debug("BONUS WORD: +%d", bonusPoints)
						p.Score += bonusPoints
					}

					game.moveMade <- pm.Word
				} else {
					game.sendUpdate(ACT_INVALID_WORD, pm.Word, p.Id, p)
				}
			} else {
				log.Debug("Ignoring word from player. Its not his turn")
			}

		default:
			log.Debug("Player says %s", pm.Action)
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
