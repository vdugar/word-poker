package tywa

func (g *Game) validBetAction(action string) bool {
	switch action {
	case BET_RAISE:
		return true
	case BET_CHECK:
		return true
	case BET_CALL:
		return true
	case BET_FOLD:
		return true
	case BET_ALLIN:
		return true
	case BET_LEFT:
		return true
	}
	return false
}

// forceReset is set to true when the game is restarting
func (g *Game) resetBet(forceReset bool) {
	for _, p := range g.Players {
		if p != nil {
			if forceReset {
				if p.BetAction != BET_LEFT {
					p.BetAction = BET_WAITING_TURN
					p.CumulativeBetAmount = 0
					p.Word = ""
				}
			} else {
				if p.BetAction != BET_FOLD && p.BetAction != BET_LEFT && p.BetAction != BET_WAITING {
					p.BetAction = BET_WAITING_TURN
				}
			}
		}
	}
}

func (g *Game) rotateFirstBetter() {
	if g.firstBetter != nil {
		foundCurrentPlayer := false
		for _, p := range g.Players {
			if p == g.firstBetter {
				foundCurrentPlayer = true
				continue
			}

			if foundCurrentPlayer {
				if p != nil && p.BetAction != BET_LEFT {
					g.firstBetter = p
					return
				}
			}
		}
		for _, p := range g.Players {
			if p != nil && p.BetAction != BET_LEFT {
				g.firstBetter = p
				return
			}
			if p == g.firstBetter {
				return
			}
		}
	} else {
		for _, p := range g.Players {
			if p != nil && p.BetAction != BET_LEFT {
				g.firstBetter = p
				return
			}
		}
	}
}

func (g *Game) getFirstBetter() *Player {
	if g.firstBetter.BetAction != BET_LEFT {
		return g.firstBetter
	} else {
		g.rotateFirstBetter()
		return g.firstBetter
	}
	return nil
}

// CHECK FOR: !folded, !left, !betAmount-equal, hasCash
func (g *Game) getNextBetter(currentPlayerId int) *Player {
	// first iterate from the current player to the end of the player list
	foundCurrentPlayer := false
	for _, p := range g.Players {
		if p != nil {
			if p.Id == currentPlayerId {
				foundCurrentPlayer = true
				continue
			}

			// we have found the current player. check if we can pass the next player or not
			if foundCurrentPlayer && (p.CumulativeBetAmount != g.CurrentBetAmount || p.BetAction == BET_WAITING_TURN) {
				switch p.BetAction {
				case BET_WAITING_TURN:
					fallthrough
				case BET_RAISE:
					fallthrough
				case BET_CHECK:
					fallthrough
				case BET_CALL:
					return p
				}
			}
		}
	}

	// iterate from the beginning of the players list till the current player
	for _, p := range g.Players {
		if p != nil {
			if p.CumulativeBetAmount != g.CurrentBetAmount || p.BetAction == BET_WAITING_TURN { // we have found the current player. check if we can pass the next player or not
				switch p.BetAction {
				case BET_WAITING_TURN:
					fallthrough
				case BET_RAISE:
					fallthrough
				case BET_CHECK:
					fallthrough
				case BET_CALL:
					return p
				}
			}

			if p.Id == currentPlayerId {
				break
			}
		}

	}

	return nil
}

func (g *Game) isBettingComplete() (bool, string) {
	// check if all (except one) have folded
	allFolded, _ := g.checkAllFolded()
	if allFolded { // all except 1 have folded. betting over
		return true, BS_ALL_FOLDED
	}

	// check if bets are equal
	for _, p := range g.Players {
		if p != nil {
			switch p.BetAction {
			case BET_WAITING_TURN:
				return false, BS_INCOMPLETE

			case BET_CHECK:
				fallthrough
			case BET_RAISE:
				fallthrough
			case BET_CALL:
				if p.CumulativeBetAmount != g.CurrentBetAmount {
					return false, BS_INCOMPLETE
				}
			}
		}
	}

	if !g.isBettingPossible() {
		return true, BS_NO_CASH
	}

	return true, BS_BETS_EVEN
}

func (g *Game) isBettingPossible() bool {
	// check if bets are equal
	for _, p := range g.Players {
		if p != nil {
			switch p.BetAction {
			case BET_WAITING_TURN:
				return true

			case BET_CHECK:
				fallthrough
			case BET_RAISE:
				fallthrough
			case BET_CALL:
				if p.CumulativeBetAmount != g.CurrentBetAmount {
					return true
				}
			}
		}
	}

	playersWithCash := 0
	for _, p := range g.Players {
		if p != nil {
			if p.BetAction != BET_FOLD && p.BetAction != BET_LEFT && p.BetAction != BET_WAITING { // player is in active betting state
				if p.Cash > 0 {
					playersWithCash++
				}
			}
		}
	}
	if playersWithCash > 1 {
		return true
	}
	return false
}

// check if all (except one) have folded
func (g *Game) checkAllFolded() (bool, *Player) {
	standingPlayer := &Player{}
	activePlayers := len(g.Players)
	for _, p := range g.Players {
		if p != nil {
			if p.BetAction == BET_FOLD || p.BetAction == BET_LEFT || p.BetAction == BET_WAITING {
				activePlayers--
			} else {
				standingPlayer = p
			}
		} else {
			activePlayers--
		}
	}
	if activePlayers <= 1 { // all except 1 have folded. betting over
		return true, standingPlayer
	}
	return false, nil
}
