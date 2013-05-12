/**
* Implements a message display and timer
*/

goog.provide("tywa.messageDisplay");

goog.require("lime.Sprite");
goog.require("lime.Label");
goog.require("lime.scheduleManager");

tywa.messageDisplay = function() {
	goog.base(this);

	this.setSize(tywa.MESSAGE_DP_W, tywa.MESSAGE_DP_H).
		setPosition(tywa.MESSAGE_DP_X, tywa.MESSAGE_DP_Y).
		setAnchorPoint(0.5, 0.5);
	this.ctime = 0;
	this.sendWordFlag = false;
	this.init = false;
	this.msgType = "start_bet";

	this.label = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(0, 0).
		setSize(tywa.MESSAGE_DP_W, tywa.MESSAGE_DP_H).
		setFontColor('#AACEA1').
		setFontSize(28).
		setText("").
		setFontFamily("News Gothic MT, Arial").
		setFontWeight("bold");

	this.appendChild(this.label);

	var bettingStartMsg = "Betting will start in";
	var bettingResumeMsg = "Betting will resume in";
	var sendWordMsg = "Send your word in\n";

	this.initializeCooldown = function(ctime, msgType) {
		this.ctime = ctime;
		this.msgType = msgType;
		this.label.setText("");

		this.startCountdown();
	}

	this.startCountdown = function() {
		this.init = true;
	}

	this.stopCountDown = function() {
		this.init = false;
	}

	this.decrementTime = function() {
		if(!this.init)
			return;
		if(this.ctime == 0) {
			if(this.sendWordFlag) {
				// Timer expired. Send off the word
				tywa.buttons.confirmBt.sendWord();
			}
			return;
		}

		this.ctime--;
		var msg = "";
		switch(this.msgType) {
			case "start_bet":
				msg += bettingStartMsg;
				break;
			case "resume_bet":
				msg += bettingResumeMsg;
				break;
			case "send_word":
				msg += sendWordMsg;
				break;
		}
		msg += " " + this.ctime;
		msg += " seconds";
		this.label.setText(msg);
	}

	this.setSendWordFlag = function() {
		this.sendWordFlag = true;
	}

	this.unsetSendWordFlag = function() {
		this.sendWordFlag = false;
	}

	lime.scheduleManager.scheduleWithDelay(
			this.decrementTime,
			this,
			1000
		);
}

goog.inherits(tywa.messageDisplay, lime.Sprite);