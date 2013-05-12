/**
* Representation of a tile placeholder
*/

goog.provide("tywa.tilePlaceholder");

goog.require('lime.Sprite');

tywa.tilePlaceholder = function(x, y) {
	goog.base(this);

	var dim = tywa.COMMUNITY_TILE_DIM;

	this.setSize(dim, dim).
		setAnchorPoint(0, 0).
		setPosition(x, y).
		setFill(ui.spriteSheet.getFrame('BLANK.png'));

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

goog.inherits(tywa.tilePlaceholder, lime.Sprite);