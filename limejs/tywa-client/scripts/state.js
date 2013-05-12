goog.provide("tywa.state");

goog.require("lime.animation.MoveTo");

// State constants
tywa.state.STATUS_WAITING = "waiting";
tywa.state.FINISHING = "finishing";

// Action - verb map
var actionMap = {
	"player_joined": "joined",
	"player_left": "has left",
	"raise": "raises to",
	"bet": "bets",
	"check": "checks",
	"call": "calls",
	"fold": "folds",
	"allin": "goes all in!"
};

tywa.state.gameState = {};
tywa.state.currPlayer = null;
tywa.state.currAction = null;
tywa.state.currState = null;
tywa.state.myId = null;
tywa.state.playerPosMap = [null, null, null, null];
tywa.state.messageQ = [];
tywa.state.numTilesOpened = 0;
tywa.state.minBet = 0;
tywa.state.previousBetter = null;
tywa.state.blind = 0;
tywa.state.prevBetValue = 0;

/** list of players who've left */
tywa.state.leaveList = [];

/**
* Returns the index of the first empty position at the table
* First position is always mapped to the current player, so we ignore that
*/
tywa.state.getEmptyPos = function() {
	var i;
	for(i = 1; i < tywa.state.playerPosMap.length; i++) {
		if(tywa.state.playerPosMap[i] == null) {
			return i;
		}
	}
}

/** Returns the position index of the given player */
/*
tywa.state.getPlayerPos = function(id) {
	var i;
	for(i = 0; i < tywa.state.playerPosMap.length; i++) {
		if(tywa.state.playerPosMap[i] == id) {
			return i;
		}
	}
	return -1;
}*/
tywa.state.getPlayerPos = function(id) {
	var i;
	for(i = 0; i < tywa.state.gameState["Players"].length; i++) {
		if(tywa.state.gameState["Players"][i]!= null &&
			tywa.state.gameState["Players"][i]["Id"] == id) {
			return i;
		}
	}
	return -1;
}

/**
* Processes the message queue
*/
tywa.state.processMessageQueue = function(dt) {
	
	while(tywa.state.messageQ.length != 0) {
		// I don't anticipate the message queue to get very large, so
		// a shift operation won't be expensive
		var msg = tywa.state.messageQ.shift();
		tywa.state.currAction = msg["Action"];
		tywa.state.currPlayer = msg["PlayerIdx"];
		tywa.state.blind = msg["MinBet"];
		tywa.state.prevBetValue = tywa.state.gameState["CurrentBetAmount"];

		// Pre-init
		tywa.state.preInit();

		// Update the client state
		tywa.state.gameState = msg["GameState"];
		tywa.state.currState = msg["GameState"]["State"];
		if(tywa.state.myId && tywa.state.getPlayerWithID(tywa.state.myId)) {
			tywa.state.minBet = tywa.state.getCurrentBet() - parseInt(tywa.state.getPlayerWithID(tywa.state.myId)["CumulativeBetAmount"]); 
		}
		
		switch(tywa.state.currAction) {
			case "welcome":
				welcome();
				return;
			case "player_joined":
				playerJoin();
				break;
			case "start":
				start();
				break;
			case "request_bet":
				requestBet();
				break;
			case "reveal_card1":
				revealTile1();
				break;
			case "reveal_card2":
				revealTile2();
				break;
			case "request_word":
				sendWord();
				break;
			case "game_over":
				handOver();
				break;
			case "bye":
				onBye();
			case "player_bet":
				onPlayerBet();
		}

		refreshUI();
	}
}


/**
* Called on receipt of every message to refresh the UI
*/
var refreshUI = function() {
	// Cycle through the list of players. For every player,
	// update the UI.
	var i,
		playerId,
		idx,
		freePos;

	for(i = 0; i < tywa.state.gameState["Players"].length; i++) {
		if(tywa.state.gameState["Players"][i] != null) {
			playerId = tywa.state.gameState["Players"][i]["Id"];
			pos = i;

			if(tywa.ui.players[pos].dp.getHidden()) {
				tywa.ui.players[pos].dp.setHidden(false);
			}
			updatePlayer(playerId, pos);
		}
		else {
			// Hide players who have left
			tywa.ui.players[i].dp.setHidden(true);
		}
	}

	// Update pot amount
	tywa.ui.potDp.setBet(tywa.state.getPotAmount());
}

/**
* Updates stats for a particular player
*/
var updatePlayer = function(id, pos) {
	var playerDp = tywa.ui.players[pos].dp,
		playerObj = tywa.state.getPlayerWithID(id);

	playerDp.setCash(playerObj["Cash"]);
	playerDp.setBet(playerObj["CumulativeBetAmount"]);
	playerDp.setState(playerObj['BetAction']);
	playerDp.setName(playerObj['Name']);
	playerDp.showTiles();
	//playerDp.setDp("assets/"+playerObj['Picture']+".png") 
	if(id == tywa.state.myId) {
		playerDp.setDp(ui.spriteSheet.getFrame('dp_me.png')); 
	}
	else {
		playerDp.setDp(ui.spriteSheet.getFrame('dp_other.png')); 
	}
	
	if(tywa.state.myId == id && tywa.state.currState != tywa.state.FINISHING && !tywa.state.inWaitList(id)) {
		playerDp.setTiles(playerObj["Hand"]);
	}
}

var welcome = function() {
	tywa.state.myId = tywa.state.currPlayer;
	tywa.state.disableBetButtons();
}

var playerJoin = function() {
	// Update the ticker
	if(tywa.state.currPlayer != tywa.state.myId) {
		tywa.state.updateActionTicker(tywa.state.currPlayer, "player_joined", -1);
	}
	else {
		// Update his table message if he's waiting for the hand to finish
		if(tywa.state.inWaitList(tywa.state.myId)) {
			tywa.ui.waitMsg.setText("Waiting for a hand to get over");
		}
	}
}

var playerLeave = function() {
	// Clear his seat at the table

	var pos = tywa.state.getPlayerPos(tywa.state.currPlayer);
	if(pos != -1) {

		if(tywa.state.currState == tywa.state.STATUS_WAITING) {
			// Clear the table now if the hand is yet to begin
			// tywa.state.playerPosMap[pos] = null;
			tywa.ui.players[pos].dp.setHidden(true);
		}
		else {
			/*
			// He'll be booted out on the next hand
			tywa.state.leaveList.push(tywa.state.currPlayer);
			*/
			// Update his display, and ignore him from the next message onwards
			updatePlayer(tywa.state.currPlayer, pos);
		}
	}
}

var start = function() {
	clearCommunityTiles();
	clearPlayersUI();
	tywa.ui.wordArea.cleanUp();
	tywa.state.clearBetState();
	tywa.state.disableBetButtons();

	var tiles = tywa.state.gameState['CommunityCards'],
		playerTiles = tywa.state.getPlayerWithID(tywa.state.myId)['Hand'],
		i,
		tile,
		pos;

	// Clear away the table-minimum-bet message
	tywa.ui.minBetMsg.setHidden(true);

	// Clear away players who have left
	for(i = 0; i < tywa.state.leaveList.length; i++) {
		pos = getPlayerPos(tywa.state.leaveList[i]);
		// tywa.state.playerPosMap[pos] = null;
		tywa.ui.players[pos].dp.setHidden(true);
	}

	// Put in all the community tiles, and reveal only the initial ones
	for(i = 0; i < tywa.NUM_COMMUNITY_TILES; i++) {
		tile = new tywa.tile(0, 0, tiles[i], 3, "community");
		tywa.ui.commPlaceholders[i].appendChild(tile);
		if(i >= tywa.NUM_INITIAL_REVEAL) {
			tile.setHidden(true);
		}
	}

	tywa.state.numTilesOpened = tywa.NUM_INITIAL_REVEAL;

	// Initialize the player's word area with community and personal tiles
	for(i = 0; i < tywa.NUM_PLAYER_TILES; i++) {
		tywa.ui.wordArea.addTileToAvailable(playerTiles[i], "personal");
	}

	for(i = 0; i < tywa.NUM_INITIAL_REVEAL; i++) {
		tywa.ui.wordArea.addTileToAvailable(tiles[i], "community");
	}

	// Refresh dealt tiles
	for(i = 0; i < tywa.MAX_NUM_PLAYERS; i++) {
		tywa.ui.players[i].dp.refreshDealtTiles();
	}

	// Show the cooldown timer
	tywa.ui.cooldownDp.setHidden(false);
	tywa.ui.cooldownDp.initializeCooldown(tywa.INIT_COOLDOWN, "start_bet");

	// Disable the send button
	tywa.buttons.confirmBt.disableButton();

	// Remove the waiting-for-players message
	tywa.ui.waitMsg.setHidden(true);
}

/**
* Enables the bet buttons, and shows the countdown timer
*/
var requestBet = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}

	var playerDp;

	if(tywa.state.previousBetter) {
		playerDp = tywa.ui.players[tywa.state.getPlayerPos(tywa.state.previousBetter)].dp;
		playerDp.disableTimer();
	}

	// Disable the cooldown timer
	tywa.ui.cooldownDp.setHidden(true);
	tywa.ui.cooldownDp.stopCountDown();

	if(!msgForMe()) {
		playerDp = tywa.ui.players[tywa.state.getPlayerPos(tywa.state.currPlayer)].dp;
		playerDp.enableTimer();
		tywa.state.previousBetter = tywa.state.currPlayer;
		return;
	}

	var currentBet = parseInt(tywa.state.gameState['CurrentBetAmount']);
	var playerPos = tywa.state.getPlayerPos(tywa.state.myId);
	playerDp = tywa.ui.players[playerPos].dp;

	tywa.buttons.foldBt.enableButton();

	if(tywa.state.getMinBet() == 0 || getBlind() != 0) {
		tywa.buttons.checkBt.enableButton();
		tywa.buttons.raiseBt.setHidden(true);
		tywa.buttons.betBt.setHidden(false);
		tywa.buttons.betBt.enableButton();
		tywa.buttons.callBt.disableButton();
		tywa.buttons.foldBt.disableButton();
	}
	else {
		tywa.buttons.raiseBt.setHidden(false);
		tywa.buttons.raiseBt.enableButton();
		tywa.buttons.betBt.setHidden(true);
		tywa.buttons.callBt.enableButton();
		tywa.buttons.checkBt.disableButton();
		tywa.buttons.foldBt.enableButton();
	}

	// Special-casing for blinds
	if(getBlind() != 0) {
		tywa.buttons.checkBt.disableButton();
	}

	tywa.state.previousBetter = tywa.state.myId;
	
	// Show the countdown timer
	playerDp.enableTimer();
}

/**
* Disables all the bet buttons
*/
tywa.state.disableBetButtons = function() {
	tywa.buttons.checkBt.disableButton();
	tywa.buttons.raiseBt.setHidden(false);
	tywa.buttons.raiseBt.disableButton();
	tywa.buttons.betBt.setHidden(true);
	tywa.buttons.foldBt.disableButton();
	tywa.buttons.callBt.disableButton();

	// Disable timer
	var playerPos = tywa.state.getPlayerPos(tywa.state.myId);
	if(playerPos != -1) {
		tywa.ui.players[playerPos].dp.disableTimer();
	}
}

/**
* Returns the current bet
*/
tywa.state.getCurrentBet = function() {
	return parseInt(tywa.state.gameState['CurrentBetAmount']);
}

/**
* Reveals the "turn" tile
*/
var revealTile1 = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}

	var playerDp;

	if(tywa.state.previousBetter) {
		playerDp = tywa.ui.players[tywa.state.getPlayerPos(tywa.state.previousBetter)].dp;
		playerDp.disableTimer();
	}

	tywa.ui.commPlaceholders[tywa.NUM_INITIAL_REVEAL].getChildAt(1).setHidden(false);

	tywa.ui.wordArea.addTileToAvailable(tywa.state.gameState["CommunityCards"][tywa.NUM_INITIAL_REVEAL], "community");
	console.log(tywa.state.gameState["CommunityCards"][tywa.NUM_INITIAL_REVEAL]);
	tywa.state.numTilesOpened++;

	// Disable bet buttons and show cooldown timer
	tywa.state.disableBetButtons();
	tywa.ui.cooldownDp.setHidden(false);
	tywa.ui.cooldownDp.initializeCooldown(tywa.TILE_COOLDOWN, "resume_bet");
}

/**
* Reveals the "river" tile
*/
var revealTile2 = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}

	var playerDp;

	if(tywa.state.previousBetter) {
		playerDp = tywa.ui.players[tywa.state.getPlayerPos(tywa.state.previousBetter)].dp;
		playerDp.disableTimer();
	}

	tywa.ui.commPlaceholders[tywa.NUM_INITIAL_REVEAL + 1].getChildAt(1).setHidden(false);

	tywa.ui.wordArea.addTileToAvailable(tywa.state.gameState["CommunityCards"][tywa.NUM_INITIAL_REVEAL + 1], "community");
	console.log(tywa.state.gameState["CommunityCards"][tywa.NUM_INITIAL_REVEAL + 1]);
	tywa.state.numTilesOpened++;

	// Disable bet buttons and show cooldown timer
	tywa.state.disableBetButtons();
	tywa.ui.cooldownDp.setHidden(false);
	tywa.ui.cooldownDp.initializeCooldown(tywa.TILE_COOLDOWN, "resume_bet");
}

/**
* Checks if the message is meant for the current player or not
*/
var msgForMe = function() {
	return tywa.state.myId == tywa.state.currPlayer;
}

/**
* Sends off the word to the server
*/
var sendWord = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}

	tywa.buttons.confirmBt.enableButton();

	// Disable bet buttons and show cooldown timer
	tywa.state.disableBetButtons();
	tywa.ui.cooldownDp.setHidden(false);
	tywa.ui.cooldownDp.setSendWordFlag();
	tywa.ui.cooldownDp.initializeCooldown(tywa.WORD_FORM_TIMEOUT, "send_word");
}

/**
* Reveal tiles, show winners etc
*/
var handOver = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}

	var playerDp;

	if(tywa.state.previousBetter) {
		playerDp = tywa.ui.players[tywa.state.getPlayerPos(tywa.state.previousBetter)].dp;
		playerDp.disableTimer();
	}

	// Reveals people's words
	var i,
		playerId,
		pos,
		isValidWord,
		word;
	for(i = 0; i < tywa.state.gameState["Players"].length; i++) {
		if(tywa.state.gameState["Players"][i] != null) {
			playerId = tywa.state.gameState["Players"][i]["Id"];
			pos = tywa.state.getPlayerPos(playerId);
			isValidWord = tywa.state.gameState["Players"][i]["WordValidity"];
			word = tywa.state.getPlayerWord(playerId);
			if(word != "") {
				tywa.ui.players[pos].dp.setWordOnTiles(tywa.state.getPlayerWord(playerId), isValidWord);
			}	
		} 
	}
	var chipsPos;
	// Set winners, and show the chip animation
	if(tywa.state.currPlayer != "") {
		var winners = tywa.state.currPlayer.split(",");
		for(i = 0; i < winners.length; i++) {
			pos = tywa.state.getPlayerPos(winners[i]);
			playerDp = tywa.ui.players[pos].dp;
			playerDp.winnerDp.setHidden(false);

			// Animate the central pile of chips
			chipsPos = playerDp.getChipsStopPos();
			animateCentralChips(tywa.ui.chipPiles[i], chipsPos);
		}
	}

	// Clear ticker
	tywa.ui.ticker.setText("");
}

/**
* Updates the player's own bet state
*/
tywa.state.updateOwnBetState = function(action, delta) {
	var player = tywa.state.getPlayerWithID(tywa.state.myId);
	player['BetAction'] = action;
	player['CumulativeBetAmount'] += delta;
	player['Cash'] -= delta;

	updatePlayer(tywa.state.myId, tywa.state.getPlayerPos(tywa.state.myId));	
}

/** 
* Clears the community tiles
*/
var clearCommunityTiles = function() {
	var i;
	for(i = 0; i < tywa.NUM_COMMUNITY_TILES; i++) {
		tywa.ui.commPlaceholders[i].removeChildAt(1);
	}
}

/**
* Clear player UI
*/
var clearPlayersUI = function() {
	var i,
		playerId,
		pos,
		playerDp;
	for(i = 0; i < tywa.state.gameState["Players"].length; i++) {
		if(tywa.state.gameState["Players"][i] != null) {
			playerId = tywa.state.gameState["Players"][i]["Id"];
			pos = i;
			if(pos != -1) {
				tywa.ui.players[pos].dp.hideTiles();
				tywa.ui.players[pos].dp.setBet(0);
				tywa.ui.players[pos].dp.setState("");	
				tywa.ui.players[pos].dp.winnerDp.setHidden(true);
				tywa.ui.players[pos].dp.scoreDp.setHidden(true);
				tywa.ui.players[pos].dp.correctDp.setHidden(true);
			}
		}
		else {
			// Hide players who've left
			tywa.ui.players[pos].dp.setHidden(true);
		}
	}
}

/**
* Returns the current pot amount
*/
tywa.state.getPotAmount = function() {
	return parseInt(tywa.state.gameState["PotAmount"]);
}

/**
* Handles expiry of bet timer
*/
tywa.state.betTimerExpired = function() {
	if(tywa.state.previousBetter != tywa.state.myId)
		return;

	tywa.state.updateOwnBetState("fold", 0, 0);

	tywa.messageHandler.sendMessage("fold", 0);
}

/**
* Get the minimum amount user must bet
*/
tywa.state.getMinBet = function() {
	// Hack to implement blinds
	var blind = getBlind();
	if(blind != 0) {
		return blind; 
	}

	return tywa.state.minBet;
}

/**
* Returns the player's cash
*/
tywa.state.getPlayerCash = function(playerId) {
	return parseInt(tywa.state.getPlayerWithID(playerId)['Cash']);
}

/**
* Setup bet state
*/
tywa.state.setupBetState = function() {
	// hide the other buttons
	tywa.buttons.foldBt.setHidden(true);
	tywa.buttons.checkBt.setHidden(true);
	tywa.buttons.callBt.setHidden(true);
	tywa.buttons.raiseBt.setHidden(true);
	tywa.buttons.betBt.setHidden(true);

	// Reveal the bet slider
	tywa.ui.betSlider.setHidden(false);
	tywa.ui.betSlider.initSlider();
	tywa.ui.betSlider.enabled = true;
}

/**
* Clears the bet state
*/
tywa.state.clearBetState = function() {
	// hide the slider
	tywa.ui.betSlider.setHidden(true);
	tywa.ui.betSlider.enabled = false;
	tywa.ui.betSlider.resetSlider();

	// show the other buttons
	tywa.buttons.foldBt.setHidden(false);
	tywa.buttons.checkBt.setHidden(false);
	tywa.buttons.callBt.setHidden(false);
	if(tywa.buttons.raiseBt.clicked) {
		tywa.buttons.raiseBt.setHidden(false);
	}
	else {
		tywa.buttons.betBt.setHidden(false);
	}
}

/**
* Returns the word formed by this player
*/
tywa.state.getPlayerWord = function(id) {
	return tywa.state.getPlayerWithID(id)["Word"].toUpperCase();
}

/**
* Returns the cumulative bet for the player so far
*/
tywa.state.getCumulativeBet = function(id) {
	return tywa.state.getPlayerWithID(id)['CumulativeBetAmount'];
}

/**
* Returns the player's name
*/
tywa.state.getPlayerName = function(id) {
	return tywa.state.getPlayerWithID(id)['Name'];
}

/**
* Gets the player object with this particular ID
*/
tywa.state.getPlayerWithID = function(id) {
	var i;
	for(i = 0; i < tywa.state.gameState['Players'].length; i++) {
		if(tywa.state.gameState['Players'][i] != null && 
			tywa.state.gameState['Players'][i]['Id'] == id) {
			return tywa.state.gameState['Players'][i];
		}
	}
}

var onBye = function() {
	tywa.messageHandler.closeConn();
	if(window.parent) {
            window.parent.location = "/lobby/";
        }        
    else {
            window.location = "/lobby/";
    }
}

/**
* Handles functionality that should be performed before we update the game state
*/
tywa.state.preInit = function() {
	// Check if a player has left
	if(tywa.state.currAction == "player_left") {
		// Update the player's state, since he'll presently by set to null
		updatePlayer(tywa.state.currPlayer, tywa.state.getPlayerPos(tywa.state.currPlayer));

		// Update the ticker
		tywa.state.updateActionTicker(tywa.state.currPlayer, "player_left", -1);
	}
}

var getBlind = function() {
	return tywa.state.blind;
}

tywa.state.updateActionTicker = function(playerId, action, value) {
	var msg = "";
	var playerName = tywa.state.getPlayerName(playerId);
	var actionVerb = actionMap[action];
	msg += playerName;
	msg += " " + actionVerb + " ";
	if(value != -1) {
		msg += "$" + value;
	}
	tywa.ui.ticker.setText(msg);
}

var onPlayerBet = function() {
	if(tywa.state.inWaitList(tywa.state.myId)) {
		// We have no business in this hand
		return;
	}
	var betUpdateVal = -1;
	var playerId = tywa.state.currPlayer;
	var betAmt = tywa.state.getCurrentBet();
	var playerObj = tywa.state.getPlayerWithID(tywa.state.currPlayer);
	var betAction = playerObj["BetAction"];
	var pos;

	// Hack to check if this is a bet or a raise
	if(betAction == "raise") {
		if(tywa.state.prevBetValue == 0) {
			betAction = "bet";
		}
		else {
			betAction = "raise";
		}	
	}

	switch(betAction) {
		case "check":
		case "call":
		case "fold":
		case "allin":
			betUpdateVal = -1;
			break;
		case "raise":
		case "bet":
			betUpdateVal = betAmt;
			// Show chips animation
			pos = tywa.state.getPlayerPos(playerId);
			tywa.ui.players[pos].dp.animateChips();
			break;
	}

	// HACK-> Special-casing call for animation
	if(betAction == "call" || betAction == "allin") {
		// Show chips animation
		pos = tywa.state.getPlayerPos(playerId);
		tywa.ui.players[pos].dp.animateChips();
	}

	tywa.state.updateActionTicker(playerId, betAction, betUpdateVal);
}

var animateCentralChips = function(chips, chipsPos) {
	var oldPos = chips.getPosition();
		
	var animation = new lime.animation.MoveTo(chipsPos).
			setDuration(1.5);
	goog.events.listen(
			animation,
			lime.animation.Event.STOP,
			function() {
				chips.setHidden(true).
					setPosition(oldPos.x, oldPos.y);
			});
		chips.setHidden(false);
		chips.runAction(animation);
}

/**
* Checks if the player is in a waitlist
*/
tywa.state.inWaitList = function(id) {
	var playerObj = tywa.state.getPlayerWithID(id);
	if(playerObj["BetAction"] == "waiting" && tywa.state.currState != "waiting" && tywa.state.currState != "inactive") {
		return true;
	}

	return false;
}





