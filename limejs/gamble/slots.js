/**
* The slots-like reel mechanism for letter swaps
*/

goog.provide("gamble.slots");

goog.require('lime.Sprite');

gamble.slots = function(x, y) {
	goog.base(this);

	this.reel1 = new lime.Sprite().
		setPosition(0, 0).
		setAnchorPoint(0, 0);

	this.reel2 = new lime.Sprite().
		setPosition(0, gamble.WORD_TILE_DIM + 5).
		setAnchorPoint(0, 0);

	var tile = new 	

}

goog.inherits(gamble.tilePlaceholder, lime.Sprite);