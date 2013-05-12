// Set main namespace
goog.provide("gamble.commandButton");

goog.require('lime.Label');
goog.require('lime.Sprite');
goog.require("lime.Button");

gamble.commandButton = function(asset, x, y, buttonText, buttonType) {
	goog.base(this);

	var w, h, fontSize = 24;
	this.buttonType = buttonType;
	this.asset = asset;

	if(buttonType == "command") {
		w = 114;
		h = 38;
		fontSize = 16;
	}
	else if(buttonType == "tile") {
		w = 34;
		h = 34;
	}
	else if(buttonType == "slider") {
		w = 220;
		h = 28;
		fontSize = 18;
	}
	else if(buttonType == "send") {
		w = 88;
		h = 41;
		fontSize = 18;
	}
	else if(buttonType == "bonus") {
		w = 150;
		h = 48;
		fontSize = 24;
	}
	else if(buttonType == "clear") {
		w = 43;
		h = 22;
		fontSize = 12;
	}

	this._enabled = false;
	this.clicked = false;			// Used to track clicks for "Bet" and "Raise"

	/**
	var upState = new lime.Sprite().
		setFill(asset).
		setSize(gamble.COMMAND_BUTTON_WIDTH, gamble.COMMAND_BUTTON_HEIGHT).
		setPosition(x, y);

	var downState = new lime.Sprite().
		setFill(asset).
		setSize(gamble.COMMAND_BUTTON_WIDTH, gamble.COMMAND_BUTTON_HEIGHT).
		setPosition(x, y);

	var textLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(gamble.COMMAND_BUTTON_WIDTH / 2, gamble.COMMAND_BUTTON_HEIGHT / 2).
		setFontColor('#fff').
		setFontSize(24).
		setText(buttonText).
		setFontWeight("bold");


	upState.appendChild(textLabel);
	downState.appendChild(textLabel);

	this.setUpState(upState);
	//this.setDownState(downState);
	*/

	this.textLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(0, 2).
		setFontColor('#FFF').
		setFontSize(fontSize).
		setText(buttonText).
		setFontWeight("bold");

	if(buttonType == "tile" || buttonType == "slider") {
		this.textLabel.setText("");
	}

	if(buttonType == "slider") {
		this.textLabel.setSize(80, 30);
		this.textLabel.setPosition(0, 5);
	}
	
	this.setFill(asset).
		setSize(w, h).
		setPosition(x, y).
		appendChild(this.textLabel);

	this.enableButton = function() {
		this._enabled = true;

		this.setFill(this.asset);
		this.getChildAt(0).setFontColor("#FFF");
	}

	this.disableButton = function() {
		this._enabled = false;

		if(this.buttonType == "command") {
			this.setFill("/assets/btn_generic_off.png");
			this.getChildAt(0).setFontColor("#494949");
		}
		else if(this.buttonType == "send") {
			this.setFill("/assets/btn_action_off.png")
		}
	}

	/**
	// Define event-handlers
	this.raise = function(e) {
		if(!this._enabled)
			return;

		gamble.buttons.raiseBt.clicked = true;
		gamble.buttons.betBt.clicked = false;
		gamble.state.setupBetState();
	}

	this.bet = function(e) {
		if(!this._enabled)
			return;

		gamble.buttons.raiseBt.clicked = false;
		gamble.buttons.betBt.clicked = true;
		gamble.state.setupBetState();
	}

	this.check = function(e) {
		if(!this._enabled)
			return;

		gamble.messageHandler.sendMessage(
			"check",
			-1
		);
		gamble.state.disableBetButtons();
		gamble.state.updateOwnBetState("check", 0);
	}

	this.fold = function(e) {
		if(!this._enabled)
			return;

		gamble.messageHandler.sendMessage(
			"fold",
			-1
		);
		gamble.state.disableBetButtons();
		gamble.state.updateOwnBetState("fold", 0);
	}

	this.call = function(e) {
		if(!this._enabled)
			return;

		gamble.messageHandler.sendMessage(
			"call",
			gamble.state.getCurrentBet()
		);
		gamble.state.disableBetButtons();
		gamble.state.updateOwnBetState("call", gamble.state.getMinBet());
	}
	*/

	/**
	* Shuffles the available tiles around
	*/
	this.shuffle = function(e) {
		gamble.ui.wordArea.shuffleTiles();
	}

	/**
	* Clears all word tiles and pushes them back into the
	* pool of available tiles
	*/
	this.clearTiles = function(e) {
		gamble.ui.wordArea.clearTiles();
	}


	this.setScore = function(score) {
		// Updates score on the score UI
		this.getChildAt(0).setText(score);
	}

	this.sendWord = function() {
		if(!this._enabled)
			return;

		// Form the word, and send it off to the server
		var word = gamble.ui.wordArea.getFormedWord();
		if(gamble.formedWords.indexOf(word) != -1) {
			alert("You've already formed this word!");
			return;
		}
		gamble.formedWords.push(word);
		gamble.sentWord = word.toUpperCase();

		gamble.messageHandler.sendMessage("word", [], word);
		console.log(word);

		gamble.buttons.confirmBt.disableButton();
		gamble.ui.wordArea.clearTiles();
	}

	this.cancel = function() {

	}

	this.swap = function() {
		if(!this._enabled)
			return;

		var tilesToSwap = gamble.ui.wordArea.getTilesToSwap();
		gamble.messageHandler.sendMessage("swap", tilesToSwap, "");
	}

	// Assign the correct event-handler
	var handler = null;
	switch(buttonText) {
		case "Raise": 
			handler = this.raise;
			break;
		case "Bet": 
			handler = this.bet;
			break;
		case "Check": 
			handler = this.check;
			break;
		case "Fold": 
			handler = this.fold;
			break;
		case "Call": 
			handler = this.call;
			break;
		case "Shuffle":
			handler = this.shuffle;
			break;
		case "Clear":
			handler = this.clearTiles;
			break;
		case "OK":
			handler = this.OK;
			break;
		case "All in":
			handler = this.allIn;
			break;
		case "Send":
			handler = this.sendWord;
			break;
		case "Cancel":
			handler = this.cancel;
			break;
		case "Swap":
			handler = this.swap;
			break;
	}

	if(buttonText != "" && buttonType != "bonus") {
		goog.events.listen(
	        this,
	        ['mousedown', 'touchstart'],
	        handler
	    );
	}

}

goog.inherits(gamble.commandButton, lime.Sprite);