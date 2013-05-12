/**
* Representation of a tile
*/

goog.provide("gamble.tile");

goog.require('lime.Sprite');
goog.require('lime.RoundedRect');

gamble.tile = function(x, y, tile, position, type) {
	goog.base(this);

	var dim = gamble.WORD_TILE_DIM;
	
	this.position = position;		// 0 -> board tile, 1 -> available tile, 2 -> word tile, 3 -> community tile
	this.tile = tile;
	this._held = false;

	// returns the asset for filling in this tile
	this.getPic = function(t) {
		// ASCII magic
		var assetName = "";

		if(t == 0) {
			assetName = "BACK.png";
		}
		else {
			// assetName = String.fromCharCode(65 + t - 1) + ".png";	
			assetName = "/assets/" + t + ".png";
		}
		
		return assetName;
	}

	this.t = new lime.Sprite().
		setSize(dim, dim).
		setPosition(0, 0).
		setAnchorPoint(0, 0).
		setFill(this.getPic(tile));

	this.hold = new lime.RoundedRect().
		setSize(20, 7).
		setRadius(2).
		setFill("#ff0000").
		setOpacity(0.6).
		setAnchorPoint(0.5, 0.5).
		setPosition(dim/2, dim + 5);

	this.setAnchorPoint(0, 0).
		setPosition(x, y).
		setSize(dim, dim);

	// this.appendChild(this.bg);
	this.appendChild(this.t);
	this.appendChild(this.hold);

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

	this.isHeld = function() {
		return this._held;
	}

	var toggleHold = function(e) {
		var hold = e.targetObject;
		if(!hold.parent_._held) {
			hold.setFill("#00ff00");
			hold.parent_._held = true;
		}
		else {
			hold.setFill("#ff0000");
			hold.parent_._held = false;
		}
	}

	goog.events.listen(
	        this.hold,
	        ['mousedown', 'touchstart'],
	        toggleHold
	    );
}

goog.inherits(gamble.tile, lime.Sprite);