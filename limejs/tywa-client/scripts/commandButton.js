// Set main namespace
goog.provide("tywa.commandButton");

goog.require('lime.Label');
goog.require('lime.Sprite');
goog.require("lime.Button");

tywa.commandButton = function(asset, x, y, buttonText, buttonType) {
	goog.base(this);

	var w, h, fontSize = 24;
	this.buttonType = buttonType;
	this.asset = asset;

	if(buttonType == "command") {
		w = tywa.COMMAND_BUTTON_WIDTH;
		h = tywa.COMMAND_BUTTON_HEIGHT;
		fontSize = 16;
	}
	else if(buttonType == "tile") {
		w = tywa.TILE_BUTTON_W;
		h = tywa.TILE_BUTTON_H;
	}
	else if(buttonType == "slider") {
		w = tywa.SLIDER_BT_W;
		h = tywa.SLIDER_BT_H;
		fontSize = 18;
	}
	else if(buttonType == "send") {
		w = tywa.SENDBT_W;
		h = tywa.SENDBT_H;
		fontSize = 24;
	}

	this._enabled = false;
	this.clicked = false;			// Used to track clicks for "Bet" and "Raise"

	/**
	var upState = new lime.Sprite().
		setFill(asset).
		setSize(tywa.COMMAND_BUTTON_WIDTH, tywa.COMMAND_BUTTON_HEIGHT).
		setPosition(x, y);

	var downState = new lime.Sprite().
		setFill(asset).
		setSize(tywa.COMMAND_BUTTON_WIDTH, tywa.COMMAND_BUTTON_HEIGHT).
		setPosition(x, y);

	var textLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(tywa.COMMAND_BUTTON_WIDTH / 2, tywa.COMMAND_BUTTON_HEIGHT / 2).
		setFontColor('#fff').
		setFontSize(24).
		setText(buttonText).
		setFontWeight("bold");


	upState.appendChild(textLabel);
	downState.appendChild(textLabel);

	this.setUpState(upState);
	//this.setDownState(downState);
	*/

	var textLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(0, 2).
		setFontColor('#FFF').
		setFontSize(fontSize).
		setText(buttonText).
		setFontWeight("bold");

	if(buttonType == "send" || buttonType == "tile" || buttonType == "slider") {
		textLabel.setText("");
	}

	if(buttonType == "slider") {
		textLabel.setSize(80, 30);
		textLabel.setPosition(0, 5)
	}
	
	this.setFill(asset).
		setSize(w, h).
		setPosition(x, y).
		appendChild(textLabel);

	this.enableButton = function() {
		this._enabled = true;

		this.setFill(this.asset);
		this.getChildAt(0).setFontColor("#FFF");
	}

	this.disableButton = function() {
		this._enabled = false;

		if(this.buttonType == "command") {
			this.setFill(tywa.ui.spriteSheet.getFrame("btn_generic_off.png"));
			this.getChildAt(0).setFontColor("#494949");
		}
		else if(this.buttonType == "send") {
			this.setFill(tywa.ui.spriteSheet.getFrame("btn_send_off.png"))
		}
	}

	// Define event-handlers
	this.raise = function(e) {
		if(!this._enabled)
			return;

		tywa.buttons.raiseBt.clicked = true;
		tywa.buttons.betBt.clicked = false;
		tywa.state.setupBetState();
	}

	this.bet = function(e) {
		if(!this._enabled)
			return;

		tywa.buttons.raiseBt.clicked = false;
		tywa.buttons.betBt.clicked = true;
		tywa.state.setupBetState();
	}

	this.check = function(e) {
		if(!this._enabled)
			return;

		tywa.messageHandler.sendMessage(
			"check",
			-1
		);
		tywa.state.disableBetButtons();
		tywa.state.updateOwnBetState("check", 0);
	}

	this.fold = function(e) {
		if(!this._enabled)
			return;

		tywa.messageHandler.sendMessage(
			"fold",
			-1
		);
		tywa.state.disableBetButtons();
		tywa.state.updateOwnBetState("fold", 0);
	}

	this.call = function(e) {
		if(!this._enabled)
			return;

		tywa.messageHandler.sendMessage(
			"call",
			tywa.state.getCurrentBet()
		);
		tywa.state.disableBetButtons();
		tywa.state.updateOwnBetState("call", tywa.state.getMinBet());
	}

	/**
	* Shuffles the available tiles around
	*/
	this.shuffle = function(e) {
		tywa.ui.wordArea.shuffleTiles();
	}

	/**
	* Clears all word tiles and pushes them back into the
	* pool of available tiles
	*/
	this.clearTiles = function(e) {
		tywa.ui.wordArea.clearTiles();
	}

	/**
	* Confirm bet to be placed
	*/
	this.OK = function() {

	}

	/**
	* Go all-in!
	*/
	this.allIn = function() {

	}

	this.setScore = function(score) {
		// Updates score on the score UI
		this.getChildAt(0).setText(score);
	}

	this.setBetAmt = function(amt) {
		// Update bet amount on the bet label
		this.getChildAt(0).setText("$" + amt);
	}

	this.getBetAmt = function() {
		return parseInt(this.getChildAt(0).getText().substring(1));
	}

	this.sendWord = function() {
		if(!this._enabled)
			return;

		// Form the word, and send it off to the server
		var word = tywa.ui.wordArea.getFormedWord();

		tywa.messageHandler.sendWord(word);
		console.log(word);

		tywa.buttons.confirmBt.disableButton();

		tywa.ui.cooldownDp.setHidden(true);
		tywa.ui.cooldownDp.stopCountDown();
		tywa.ui.cooldownDp.unsetSendWordFlag();
	}

	this.cancel = function() {

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
	}

	if(buttonText != "") {
		goog.events.listen(
	        this,
	        ['mousedown', 'touchstart'],
	        handler
	    );
	}

}

goog.inherits(tywa.commandButton, lime.Sprite);