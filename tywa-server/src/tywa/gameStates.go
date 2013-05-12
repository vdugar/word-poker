package tywa

import (
	log "code.google.com/p/log4go"
	"math/rand"
	"strconv"
	"strings"
	"time"
)

/*
 *	GameStateWaiting
 *	Wait for minumum players to join or to add waiting players to the table
 *	BREAKS ON: enough players to play a round
 */
func (g *Game) GameStateWaiting() {
	var tempPlayers []*Player
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateWaiting:
			//			log.Debug("Game %d STATE: waiting", g.Id)
			g.ResetGame()

			for _ = range time.Tick(time.Millisecond * DUR_WAIT_GAME_START) {
				tempPlayers = make([]*Player, 0, MAX_PLAYERS) // first remove the players who have left
				for _, p := range g.Players {
					if p == nil {
						tempPlayers = append(tempPlayers, nil)
					} else if p.BetAction == BET_LEFT {
						// do nothing
					} else if p.Cash == 0 {
						g.sendUpdate(ACT_BYE, strconv.Itoa(p.Id), 0, p)
						g.sendUpdate(ACT_PLAYER_LEFT, strconv.Itoa(p.Id), 0, nil)
					} else {
						p.BetAction = BET_WAITING_TURN
						tempPlayers = append(tempPlayers, p)
					}
				}
				g.Players = tempPlayers

				//	if g.Players.Len() >= MIN_PLAYERS {
				if len(g.Players) >= MIN_PLAYERS {
					break
				}
			}

			// assign picture to each user
			counter := 0
			for _, p := range g.Players {
				counter++
				switch counter {
				case 1:
					p.Picture = "a"
				case 2:
					p.Picture = "b"
				case 3:
					p.Picture = "c"
				case 4:
					p.Picture = "d"
				}
			}
			g.rotateFirstBetter()

			g.State = GS_DEALING
			g.stateDealing <- 1
		}
	}
}

/*
 *	GameStateDealing
 *	Deals cards to the players and community
 *	BREAKS ON: cards have been dealt
 */
func (g *Game) GameStateDealing() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateDealing:
			log.Debug("Game %d STATE: dealing", g.Id)
			log.Debug("Dealing cards to %d players and community.", len(g.Players))
			rand := rand.Intn(len(g.lobby.handSets))
			set := g.lobby.handSets[rand]
			g.CommunityCards = set.community
			for i, p := range g.Players {
				p.Hand = set.players[i]
			}

			g.sendUpdate(ACT_START, strconv.Itoa(-1), 0, nil) // broadcast GAME_START

			time.Sleep(time.Millisecond * DUR_START_COOLDOWN)

			g.State = GS_BETTING
			g.stateBetting <- 1
		}
	}
}

/*
 *	GameStateBetting
 *	Players raise their bets based on the cards they have and the revealed community cards
 *	BREAKS ON: all players have either matched the top bet or folded 
 */
func (g *Game) GameStateBetting() {
	var (
		bettingOver   bool
		bettingStatus string
	)

	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateBetting:
			log.Debug("Game %d  STATE: betting", g.Id)
			if g.isBettingPossible() {
				g.resetBet(false)
				currentPlayer := g.getFirstBetter()
				currentPlayerIdx := currentPlayer.Id
				for {
					g.sendUpdate(ACT_REQUEST_BET, strconv.Itoa(currentPlayerIdx), g.minBet, nil)
					g.minBet = 0 // we only need to send this to the first player in the first round

					g.awaitingPlayerBet = currentPlayer
					select {
					case betMessage := <-currentPlayer.bet:
						betAction := betMessage.betAction
						betAmount := betMessage.betAmount

						if g.validBetAction(betAction) {
							log.Debug("Player %d: %s %d", currentPlayer.Id, betAction, betAmount)

							switch betAction {
							case BET_RAISE:
								currentPlayer.BetAction = BET_RAISE
								currentPlayer.CumulativeBetAmount += betAmount

								currentPlayer.Cash -= betAmount
								g.PotAmount += betAmount

								if g.CurrentBetAmount < currentPlayer.CumulativeBetAmount {
									g.CurrentBetAmount = currentPlayer.CumulativeBetAmount
								}

							case BET_CALL:
								currentPlayer.BetAction = BET_CALL

								diffAmount := g.CurrentBetAmount - currentPlayer.CumulativeBetAmount

								currentPlayer.CumulativeBetAmount += diffAmount
								currentPlayer.Cash -= diffAmount

								g.PotAmount += diffAmount

							case BET_FOLD:
								currentPlayer.BetAction = BET_FOLD

							case BET_ALLIN:
								currentPlayer.BetAction = BET_ALLIN
								currentPlayer.CumulativeBetAmount += currentPlayer.Cash

								g.PotAmount += currentPlayer.Cash

								if g.CurrentBetAmount < currentPlayer.CumulativeBetAmount {
									g.CurrentBetAmount = currentPlayer.CumulativeBetAmount
								}

								currentPlayer.Cash = 0

							case BET_CHECK:
								currentPlayer.BetAction = BET_CHECK

							case BET_LEFT:
								currentPlayer.BetAction = BET_LEFT
							}

							g.sendUpdate(ACT_PLAYER_BET, strconv.Itoa(currentPlayerIdx), 0, nil)
						} else {
							log.Debug("Invalid action by player %d - %s.", currentPlayerIdx, betAction)
						}
					}

					bettingOver, bettingStatus = g.isBettingComplete()
					if bettingOver {
						g.awaitingPlayerBet = nil
						log.Debug("Game %d Betting over. Reason: %s.", g.Id, bettingStatus)
						break
					}

					currentPlayer = g.getNextBetter(currentPlayerIdx)
					currentPlayerIdx = currentPlayer.Id
					g.awaitingPlayerBet = nil
				}
			} else {
				log.Debug("Game %d Betting is not possible", g.Id)
			}

			// based on the reason why the bet ended, determine which state the game should go into.
			switch bettingStatus {
			case BS_ALL_FOLDED:
				g.State = GS_FINISHING
				g.stateFinishing <- 1

			case BS_NO_CASH:
				fallthrough
			case BS_BETS_EVEN:
				if !g.didRevealCard1 {
					g.State = GS_REVEALING_CARD1
					g.stateRevealingCard1 <- 1
				} else if !g.didRevealCard2 {
					g.State = GS_REVEALING_CARD2
					g.stateRevealingCard2 <- 1
				} else {
					g.State = GS_FETCHING_WORDS
					g.stateFetchingWords <- 1
				}
			default:
				log.Debug("Betting ended without any standard reason for ending. Aborting game")
				g.AbortGame()
			}
		}
	}
}

/*
 *	GameStateRevealingCard1
 *	Revealing card 1
 *	BREAKS ON: card 1 revealed
 */
func (g *Game) GameStateRevealingCard1() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateRevealingCard1:
			log.Debug("Game %d STATE: Revealing Card 1.", g.Id)
			g.sendUpdate(ACT_REVEAL_CARD1, strconv.Itoa(-1), 0, nil)

			g.didRevealCard1 = true

			time.Sleep(time.Millisecond * DUR_REVEAL_COOLDOWN)

			g.State = GS_BETTING
			g.stateBetting <- 1
		}
	}
}

/*
 *	GameStateRevealingCard2
 *	Revealing card 2
 *	BREAKS ON: card 2 revealed
 */
func (g *Game) GameStateRevealingCard2() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateRevealingCard2:
			log.Debug("Game %d STATE: Revealing Card 2.", g.Id)
			g.sendUpdate(ACT_REVEAL_CARD2, strconv.Itoa(-1), 0, nil)

			g.didRevealCard2 = true

			time.Sleep(time.Millisecond * DUR_REVEAL_COOLDOWN)

			g.State = GS_BETTING
			g.stateBetting <- 1
		}
	}
}

/*
 *	GameStateFetchingWords
 *	All bets are over. Now ask players for their words.
 *	BREAKS ON: computing winner finished
 */
func (g *Game) GameStateFetchingWords() {
	defer func() {
		recover()
	}()

	for {
		select {
		case <-g.stateFetchingWords:
			log.Debug("Game %d STATE: Fetching words from active players.", g.Id)

			logStr := "Waiting for words from: "
			g.awaitingPlayersWord = make(map[int]int)
			for _, p := range g.Players {
				if p != nil {
					if p.BetAction != BET_FOLD && p.BetAction != BET_LEFT && p.BetAction != BET_WAITING {
						g.awaitingPlayersWord[p.Id] = 1
						logStr += "Player " + strconv.Itoa(p.Id) + ", "
					}
				}
			}
			log.Debug(logStr)
			g.sendUpdate(ACT_REQUEST_WORD, strconv.Itoa(-1), 0, nil)
		}
	}
}

/*
 *	GameStateFinishing
 *	Wait for players to send their words
 *	BREAKS ON: computing winner finished
 */
func (g *Game) GameStateWaitingForWords() {
	defer func() {
		recover()
	}()

	for {
		select {
		case pw := <-g.playersWord:
			log.Debug("Game %d Player %d made '%s'.", g.Id, pw.player.Id, pw.word)
			pw.player.Word = pw.word
			if len(g.awaitingPlayersWord) == 0 {
				g.State = GS_FINISHING
				g.stateFinishing <- 1
			}
		}
	}
}

/*
 *	GameStateFinishing
 *	All bets are over. Now collect the words made by users and compute the winner and give him the pot amount.
 *	BREAKS ON: computing winner finished
 */
func (g *Game) GameStateFinishing() {
	defer func() {
		recover()
	}()
	for {
		select {
		case <-g.stateFinishing:
			log.Debug("STATE: finishing")
			winnerIds := make([]string, 0)
			winners := g.computeWinner()
			if len(winners) > 0 {
				winnerShare := g.PotAmount / len(winners)
				for _, p := range winners {
					if p != nil {
						p.Cash += winnerShare
						winnerIds = append(winnerIds, strconv.Itoa(p.Id))
					}
				}
				log.Debug("Winners: %v", winnerIds)
			} else {
				log.Debug("No winner. House wins the pot.")
			}
			g.sendUpdate(ACT_GAME_OVER, strings.Join(winnerIds, ","), 0, nil)

			time.Sleep(time.Millisecond * DUR_WAIT_GAME_OVER)

			log.Debug("---- end of game ----")

			g.State = GS_WAITING
			g.stateWaiting <- 1
		}
	}
}
