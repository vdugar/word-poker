/**
* Representation of a tile placeholder
*/

goog.provide("gamble.tilePlaceholder");

goog.require('lime.Sprite');

gamble.tilePlaceholder = function(x, y) {
	goog.base(this);

	var dim = gamble.WORD_TILE_DIM;

	this.setSize(dim, dim).
		setAnchorPoint(0, 0).
		setPosition(x, y).
		setFill('/assets/BLANK.png');

	this.full = false;

	// Function to get status of this placeholder
	this.isFull = function() {
		return this.full;
	}

	// Function to toggle the status of this placeholder
	this.toggleFull = function() {
		this.full = !this.full;
	}
}

goog.inherits(gamble.tilePlaceholder, lime.Sprite);