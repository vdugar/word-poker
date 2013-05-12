/**
* Representation of a tile
*/

goog.provide("tywa.tile");

goog.require('lime.Sprite');

tywa.tile = function(x, y, tile, position, type) {
	goog.base(this);

	var dim = tywa.WORD_TILE_DIM;
	
	this.position = position;		// 0 -> board tile, 1 -> available tile, 2 -> word tile, 3 -> community tile
	this.tile = tile;

	// returns the asset for filling in this tile
	this.getPic = function(t) {
		// ASCII magic
		var assetName = "";

		if(t == 0) {
			assetName = "BACK.png";
		}
		else {
			// assetName = String.fromCharCode(65 + t - 1) + ".png";	
			assetName = t + ".png";
		}
		
		return tywa.ui.spriteSheet.getFrame(assetName);
	}

	this.t = new lime.Sprite().
		setSize(dim, dim).
		setPosition(0, 0).
		setAnchorPoint(0, 0).
		setFill(this.getPic(tile));

	this.setAnchorPoint(0, 0).
		setPosition(x, y).
		setSize(dim, dim);

	// this.appendChild(this.bg);
	this.appendChild(this.t);

	// function to toggle position between word and available area
	this.togglePos = function() {
		this.position = (this.position == 1) ? 2 : 1;
	}

	// function to get the position
	this.getPos = function() {
		return this.position;
	}

	// changes the fill of this tile
	this.changeFill = function(t) {
		this.tile = t;
		this.t.setFill(this.getPic(t));
	}

	/**
	* Returns the tile this maps to
	*/
	this.getTile = function() {
		// return this.tile;
		return this.tile.charCodeAt(0) - 64;
	}
}

goog.inherits(tywa.tile, lime.Sprite);