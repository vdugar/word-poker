/**
* Defines the bet-display graphic
*/

goog.provide("tywa.betHolder");

goog.require('lime.Sprite');
goog.require('lime.Label');

tywa.betHolder = function(x, y, asset) {
	goog.base(this);

	this.setAnchorPoint(0, 0).
		setFill(asset).
		setSize(tywa.BET_W, tywa.BET_H).
		setPosition(x, y);

	// Add in bet amount label
	var betLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(tywa.BET_W / 2 - 10, tywa.BET_H / 2 + 1).
		setFontColor('#fff').
		setFontSize(14).
		setText("").
		setFontWeight("bold");

	this.appendChild(betLabel);

	// update bet function
	this.setBet = function(bet) {
		this.getChildAt(0).setText("$" + bet);
	}
}

goog.inherits(tywa.betHolder, lime.Sprite);