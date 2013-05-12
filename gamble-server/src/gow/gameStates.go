package gow

import (
	log "code.google.com/p/log4go"
	"time"
)

/*
 *	GameStateWaiting
 *	Wait for minumum players to join or to add waiting players to the table
 *	BREAKS ON: enough players to play a round
 */
func (g *Game) GameStateWaiting() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateWaiting:
			//	log.Debug("Game STATE: waiting")
			g.ResetGame()

			for _ = range time.Tick(time.Millisecond * DUR_WAIT_GAME_START) {
				if len(g.Players) >= MIN_PLAYERS {
					break
				}
			}

			log.Debug("starting game")

			for _, p := range g.Players {
				p.Tiles = g.getTiles(NUM_PLAYER_TILES)
			}

			g.sendUpdate(ACT_START, "", 0, nil)

			g.State = GS_PLAYING
			g.statePlaying <- 1
		}
	}
}
func (g *Game) GameStatePlaying() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.statePlaying:
			for {
				if g.Round > NUM_ROUNDS {
					break
				}

				// toggle current player
				if g.CurrentPlayerIdx == -1 {
					g.CurrentPlayerIdx = g.Players[0].Id
				} else {
					if g.CurrentPlayerIdx == g.Players[0].Id {
						g.CurrentPlayerIdx = g.Players[1].Id
					} else {
						g.CurrentPlayerIdx = g.Players[0].Id
					}
				}
				g.sendUpdate(ACT_REQUEST_WORD, "", g.CurrentPlayerIdx, nil)

				select {
				case word := <-g.moveMade:
					g.sendUpdate(ACT_WORD_MADE, word, g.CurrentPlayerIdx, nil)
					break
				}

				if g.CurrentPlayerIdx == g.Players[1].Id {
					g.Round++
				}
			}

			// game over. compute winner
			log.Debug("Game Over. Computing winner")
			winner := -1
			if g.Players[0].Score > g.Players[1].Score {
				winner = g.Players[0].Id
			} else {
				winner = g.Players[1].Id
			}
			g.sendUpdate(ACT_GAME_OVER, "", winner, nil)
		}
	}
}
