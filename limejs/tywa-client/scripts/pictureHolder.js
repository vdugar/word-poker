/**
* Defines the picture holder that is used to display dp,
* bet status and cash for each player
*/

goog.provide("tywa.pictureHolder");

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.MoveTo');


var POS_00 = [tywa.PROFILE_W + 10, tywa.PROFILE_H - 30, tywa.PROFILE_W + 10, tywa.PROFILE_H - 65, -15, -20, tywa.PROFILE_W-20, -40, tywa.PROFILE_W + 50, tywa.PROFILE_H - 80, tywa.PROFILE_W, tywa.PROFILE_H - 130],
	POS_10 = [tywa.PROFILE_W + 10, 0, tywa.PROFILE_W + 10, 35, -15, -20, tywa.PROFILE_W-20, tywa.PROFILE_H - 30, tywa.PROFILE_W + 50, 80, tywa.PROFILE_W, 80],
	POS_11 = [tywa.PROFILE_W - 200, 0, -234, 35, -15, -20, -100, tywa.PROFILE_H - 30, tywa.PROFILE_W - 135, 80, tywa.PROFILE_W - 145, 80],
	POS_01 = [tywa.PROFILE_W - 200, tywa.PROFILE_H - 30, -234, tywa.PROFILE_H - 65, -15, -20, -100, -40, tywa.PROFILE_W - 135, tywa.PROFILE_H - 80, tywa.PROFILE_W - 145, tywa.PROFILE_H - 130];

var TILE_W = 27,
	TILE_H = 27;

// Maps the player's bet state to English words
var stateMap = {
	"waiting_turn": "",
	"waiting": "zzz",
	"raise": "RAISE",
	"check": "CHECK",
	"call": "CALL",
	"fold": "FOLD",
	"left": "LEFT",
	"allin": "ALLIN"
};

var ANIMATION_STOP = {
	x: 428,
	y: 150
};

tywa.pictureHolder = function(x, y, asset, dp, pos) {
	goog.base(this);

	var bet_x, bet_y, tiles_x, tiles_y, timer_x, timer_y, winner_x, winner_y, score_x, score_y, chips_x, chips_y,
		betAsset = tywa.ui.spriteSheet.getFrame("betting_amount_placeholder.png"),
		i;

	this.pos = pos;

	this.setAnchorPoint(0, 0).
		setPosition(x, y).
		setSize(tywa.PROFILE_W, tywa.PROFILE_H).
		setFill(asset);

	// Add in labels for status and cash
	var statusLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(0, 0).
		setFontColor('#3F342A').
		setFontSize(12).
		setText("").
		setFontWeight("bold");

	var statusDp = new lime.Sprite().
		setAnchorPoint(0.5, 0.5).
		setPosition(tywa.PROFILE_W / 2, tywa.PROFILE_H + 20).
		setSize(89, 23).
		setFill(ui.spriteSheet.getFrame('betaction.png'))

	statusDp.appendChild(statusLabel);

	var cashLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(tywa.PROFILE_W / 2, tywa.PROFILE_H - 10).
		setFontColor('#3F342A').
		setFontSize(12).
		setFontWeight("bold");

	var nameLabel = new lime.Label().
		setAlign('center').
		setAnchorPoint(0.5, 0.5).
		setPosition(tywa.PROFILE_W / 2, tywa.PROFILE_H - 110).
		setFontColor('#3F342A').
		setFontSize(14).
		setFontWeight("bold");

	// Add in bet graphic
	switch(pos) {
		case "00": 
			bet_x = POS_00[0];
			bet_y = POS_00[1];
			tiles_x = POS_00[2];
			tiles_y = POS_00[3];
			timer_x = POS_00[4];
			timer_y = POS_00[5];
			winner_x = POS_00[6];
			winner_y = POS_00[7];
			score_x = POS_00[8];
			score_y = POS_00[9];
			chips_x = POS_00[10];
			chips_y = POS_00[11];
			break;
		case "10":
			bet_x = POS_10[0];
			bet_y = POS_10[1];
			tiles_x = POS_10[2];
			tiles_y = POS_10[3];
			timer_x = POS_10[4];
			timer_y = POS_10[5];
			winner_x = POS_10[6];
			winner_y = POS_10[7];
			score_x = POS_10[8];
			score_y = POS_10[9];
			chips_x = POS_10[10];
			chips_y = POS_10[11];
			break;
		case "11":
			bet_x = POS_11[0];
			bet_y = POS_11[1];
			tiles_x = POS_11[2];
			tiles_y = POS_11[3];
			timer_x = POS_11[4];
			timer_y = POS_11[5];
			winner_x = POS_11[6];
			winner_y = POS_11[7];
			score_x = POS_11[8];
			score_y = POS_11[9];
			chips_x = POS_11[10];
			chips_y = POS_11[11];
			break;
		case "01":
			bet_x = POS_01[0];
			bet_y = POS_01[1];
			tiles_x = POS_01[2];
			tiles_y = POS_01[3];
			timer_x = POS_01[4];
			timer_y = POS_01[5];
			winner_x = POS_01[6];
			winner_y = POS_01[7];
			score_x = POS_01[8];
			score_y = POS_01[9];
			chips_x = POS_01[10];
			chips_y = POS_01[11];
			break;

	}
	this.betUI = new tywa.betHolder(bet_x, bet_y, betAsset);

	// Add in timer
	this.timer = new tywa.timer(80, timer_x, timer_y);
	this.timer.setHidden(true);

	// Add in score DP
	this.scoreDp = new lime.Label().
		setAlign('left').
		setAnchorPoint(0.5, 0.5).
		setPosition(score_x, score_y).
		setFontColor('#fff').
		setFontSize(16).
		setText("Score: 13").
		setSize(80, 20).
		setFontWeight("bold");
	this.scoreDp.setHidden(true);

	// Add in word-correctness dp
	this.correctDp = new lime.Sprite().
		setSize(61, 63).
		setHidden(true);

	//Add in chips dp
	this.chipsDp = new lime.Sprite().
		setFill(ui.spriteSheet.getFrame('chips.png')).
		setHidden(true).
		setAnchorPoint(0, 0).
		setSize(56, 61).
		setPosition(chips_x, chips_y);

	this.appendChild(statusDp);
	this.appendChild(cashLabel);
	this.appendChild(nameLabel);
	this.appendChild(this.betUI);
	this.appendChild(this.timer);
	this.appendChild(this.scoreDp);
	this.appendChild(this.correctDp);
	this.appendChild(this.chipsDp);
	
	this.winnerDp = new lime.Sprite().
		setSize(123, 54).
		setPosition(winner_x, winner_y).
		setFill(ui.spriteSheet.getFrame('winner.png')).
		setAnchorPoint(0, 0).
		setHidden(true);

	this.appendChild(this.winnerDp);
	
	// Add in tiles
	this.tiles = [];
	for(i = 0; i < tywa.NUM_PLAYER_TILES + tywa.NUM_COMMUNITY_TILES; i++) {
		this.tiles.push(new tywa.tile(tiles_x, tiles_y, 0, 0, "personal"));
		this.appendChild(this.tiles[i]);
		tiles_x += TILE_W + 5;
		this.tiles[i].setSize(TILE_W, TILE_H);
		// this.tiles[i].bg.setSize(TILE_W, TILE_H);
		this.tiles[i].t.setSize(TILE_W, TILE_H);
		this.tiles[i].setHidden(true);
	}

	// Define functions to update state, cash and tiles
	this.setState = function(state) {

		this.getChildAt(0).getChildAt(0).setText(stateMap[state]);
	}

	this.setCash = function(cash) {
		this.getChildAt(1).setText("$" + cash);
	}

	this.setBet = function(bet) {
		this.betUI.setBet(bet);
	}

	this.setName = function(name) {
		this.getChildAt(2).setText(name);
	}

	this.setTiles = function(tiles) {
		var i;
		if(this.pos == "00" || this.pos == "10") {
			for(i = 0; i < tywa.NUM_PLAYER_TILES; i++) {
				this.tiles[i].changeFill(tiles[i]);
			}
		}
		else {
			var count = 0;
			for(i = tywa.NUM_TOTAL_TILES - tywa.NUM_PLAYER_TILES; i < tywa.NUM_TOTAL_TILES; i++) {
				this.tiles[i].changeFill(tiles[count]);
				count++;
			}
		}
	}

	this.showTiles = function() {
		var i;
		if(this.pos == "00" || this.pos == "10") {
			for(i = 0; i < tywa.NUM_PLAYER_TILES; i++) {
				this.tiles[i].setHidden(false);
			}
		}
		else {
			for(i = tywa.NUM_TOTAL_TILES - tywa.NUM_PLAYER_TILES; i < tywa.NUM_TOTAL_TILES; i++) {
				this.tiles[i].setHidden(false);
			}
		}
	}

	this.hideTiles = function() {
		var i;
		for(i = 0; i < tywa.NUM_TOTAL_TILES; i++) {
			this.tiles[i].setHidden(true);
		}
	}

	this.enableTimer = function() {
		this.timer.restoreSize();
		this.timer.setHidden(false);
		this.timer.countdown(tywa.BET_TIME);
	}

	this.disableTimer = function() {
		this.timer.setHidden(true);
		this.timer.removeListener();
		this.timer.stopAnimation();
	}

	/**
	* Forms the player's word on his tiles
	*/
	this.setWordOnTiles = function(word, isValidWord) {
		var i, count, score = 0, lastTilePos;

		if(this.pos == "00" || this.pos == "10") {
			for(i = 0; i < word.length; i++) {
				this.tiles[i].changeFill(word[i].toUpperCase());
				this.tiles[i].setHidden(false);
				score += tywa.LETTER_SCORES[this.tiles[i].getTile()];
			}
			lastTilePos = this.tiles[i-1].getPosition();
			this.correctDp.setPosition(lastTilePos.x + 50, lastTilePos.y+15);
		}
		else {
			count = 0;
			lastTilePos = this.tiles[tywa.NUM_TOTAL_TILES - word.length].getPosition();
			for(i = tywa.NUM_TOTAL_TILES - word.length; i < tywa.NUM_TOTAL_TILES; i++) {
				this.tiles[i].changeFill(word[count].toUpperCase());
				this.tiles[i].setHidden(false);
				count++;
				score += tywa.LETTER_SCORES[this.tiles[i].getTile()];
			}
			this.correctDp.setPosition(lastTilePos.x-25, lastTilePos.y+15);
		}
		if(isValidWord) {
			this.correctDp.setFill(ui.spriteSheet.getFrame('icn_tick.png'));
		}
		else {
			this.correctDp.setFill(ui.spriteSheet.getFrame('icn_cross.png')).
				setHidden(false);
		}

		this.scoreDp.setText("Score: " + score);
		this.scoreDp.setHidden(false);	
	}

	/**
	* Initializes the dealt tiles
	*/
	this.refreshDealtTiles = function() {
		var i;
		for(i = 0; i < tywa.NUM_PLAYER_TILES + tywa.NUM_COMMUNITY_TILES; i++) {
			this.tiles[i].changeFill(0);

			if(i >= tywa.NUM_PLAYER_TILES) {
				this.tiles[i].setHidden(true);
			}
		}
	}

	/** 
	* Sets up the player's dp
	*/
	this.setDp = function(asset) {
		var dpic = new lime.Sprite().
			setAnchorPoint(0, 0).
			setPosition(7, 24).
			setFill(asset).
			setSize(75, 75);
		this.appendChild(dpic);
	}

	

	this.animateChips = function() {
		/**
		* Animates the motion of chips
		*/
		var oldPos = this.chipsDp.getPosition();
		var pos = new goog.math.Coordinate(ANIMATION_STOP.x, ANIMATION_STOP.y);
		pos = tywa.ui.tableLayer.localToNode(pos, this);
			
		this.animation = new lime.animation.MoveTo(pos).
				setDuration(1.5);
		goog.events.listen(
				this.animation,
				lime.animation.Event.STOP,
				function() {
					this.targets[0].parent_.chipsDp.setHidden(true).
						setPosition(oldPos.x, oldPos.y);
				});
			this.chipsDp.setHidden(false);
			this.chipsDp.runAction(this.animation);
	}

	this.getChipsStopPos = function() {
		var x, y;
		switch(this.pos) {
			case "00":
				x = 100;
				y = 350;
				break;
			case "10":
				x = 100;
				y = 100;
				break;
			case "11":
				x = 830;
				y = 100;
				break;
			case "01":
				x = 830;
				y = 350;
				break;
		}

		return new goog.math.Coordinate(x, y);
	}
}

goog.inherits(tywa.pictureHolder, lime.Sprite);