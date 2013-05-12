goog.provide("tywa.betSlider");

goog.require("lime.Sprite");
goog.require("lime.Label");

tywa.betSlider = function(x, y) {
	goog.base(this);

	this.enabled = false;

	this.setPosition(x, y).
		setAnchorPoint(0.5, 0.5);

	this.placeholder = new lime.Sprite().
		setSize(254, 28).
		setPosition(400, 0).
		setAnchorPoint(0.5, 0.5).
		setFill(tywa.ui.spriteSheet.getFrame("SliderBar.png"));

	this.pick = new lime.Sprite().
		setSize(20, 20).
		setPosition(-106.5, 0).
		setAnchorPoint(0.5, 0.5).
		setFill(tywa.ui.spriteSheet.getFrame("Slider.png"));

	this.placeholder.appendChild(this.pick);

	this.betDisplay = new lime.Label().
		setFontColor('#fff').
		setAlign("left").
		setFontSize(16).
		setPosition(355, -7).
		setFontWeight("bold").
		setFontFamily("Arial").
		setSize(400,0);

	this.appendChild(this.betDisplay);

	this.confirmBt = new tywa.commandButton(
		tywa.ui.spriteSheet.getFrame("btn_ok.png"), 555, 0, "OK", "slider");
	this.confirmBt.setSize(45, 27);

	this.allInBt = new tywa.commandButton(
		tywa.ui.spriteSheet.getFrame("btn_allin.png"), 618, 0, "All in", "slider");
	this.allInBt.setSize(64, 29);

	this.cancelBt = new tywa.commandButton(
		tywa.ui.spriteSheet.getFrame("btn_cancel.png"), 670, 0, "Cancel", "slider");
	this.cancelBt.setSize(28, 29);

	this.appendChild(this.cancelBt);
	this.appendChild(this.confirmBt);
	this.appendChild(this.allInBt);
	this.appendChild(this.placeholder);

	this.initSlider = function() {

		var pick = this.pick;
		var mb = tywa.state.getMinBet();
		mb = (mb == 0) ? tywa.BLIND : mb;
		this.setBetLabel(mb);

		// Set up the slider's motion
		goog.events.listen(this.pick, ['mousedown', 'touchstart'], 
	        function(e) { 
	            var drag = new lime.events.Drag(e, false, new 
	            goog.math.Box(0, tywa.BET_SLIDER_W/2, 0, -tywa.BET_SLIDER_W/2)); 
	            goog.events.listen(drag, lime.events.Drag.Event.MOVE,function() 
	            { 
	                var x = this.getPosition().x;

	                var fraction = x / tywa.BET_SLIDER_W + 0.5; 
	                
	                // Update bet display
	                var minBet = tywa.state.getMinBet();
	                minBet = (minBet == 0) ? tywa.BLIND : minBet;
	                var range = tywa.state.getPlayerCash(tywa.state.myId) - minBet;
	                var divisions = range / tywa.BLIND;
	                var bracket = Math.floor(fraction / (1.0 / divisions));
	                var betAmt = minBet + bracket * tywa.BLIND;
	                pick.parent_.parent_.setBetLabel(betAmt);

	                },false, pick); 
	            }); 
	}

	this.confirm = function(e) {
		if(!e.targetObject.parent_.enabled)
			return;

		var betAmt = this.parent_.getBetAmt();
		
		tywa.messageHandler.sendMessage("raise", betAmt);

		tywa.state.clearBetState();
		tywa.state.disableBetButtons();
		tywa.state.updateOwnBetState("raise", betAmt);
	}

	this.allIn = function(e) {
		if(!e.targetObject.parent_.enabled)
			return;

		var betAmt = tywa.state.getPlayerCash(tywa.state.myId);

		tywa.messageHandler.sendMessage("allin", betAmt);

		tywa.state.clearBetState();
		tywa.state.disableBetButtons();
		tywa.state.updateOwnBetState("allin", betAmt);		
	}

	this.cancel = function(e) {
		if(!e.targetObject.parent_.enabled)
			return;

		tywa.state.clearBetState();
	}

	this.resetSlider = function() {
		this.setBetLabel(0);
		this.pick.setPosition(-106.5, 0);
	}

	this.setBetLabel = function(amt) {
		var msg = "";

		if(tywa.buttons.raiseBt.clicked) {
			msg += "Raise to $";
		}
		else {
			msg += "      Bet $";
		}

		msg += amt;

		this.betDisplay.setText(msg);
	}

	this.getBetAmt = function() {
		var regex = /[0-9]+/;
		var labelText = this.betDisplay.getText();
		return parseInt(regex.exec(labelText)[0]);
	}

	this.setBetLabel(0);

	goog.events.listen(
	        this.confirmBt,
	        ['mousedown', 'touchstart'],
	        this.confirm
	    );

	goog.events.listen(
	        this.allInBt,
	        ['mousedown', 'touchstart'],
	        this.allIn
	    );

	goog.events.listen(
	        this.cancelBt,
	        ['mousedown', 'touchstart'],
	        this.cancel
	    );
}

goog.inherits(tywa.betSlider, lime.Sprite);