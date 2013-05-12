/**
* Representation of the word area.
* This includes all the placeholders and tiles,
* and controls the business logic for moving tiles around
*/

goog.provide("gamble.wordArea");

goog.require('lime.Sprite');
goog.require("lime.Label");
goog.require("gamble.tilePlaceholder");
goog.require("gamble.tile");

gamble.wordArea = function(x, y) {
	goog.base(this);

	this.setAnchorPoint(0, 0).
		setPosition(x, y);

	this.availableHolders = [];			// Available tile placeholders
	this.wordHolders = [];				// Word tile placeholders
	this.numWordTiles = 0;				// Number of tiles in the word area
    this.score = 0;
	
	this.TOTAL_TILES = 7;

	// Add in the placeholders
	var i;
	var x = 0;

    // available placeholders
    for(i = 1; i <= this.TOTAL_TILES; i++) {
        var s = new gamble.tilePlaceholder(x, 50);

        this.appendChild(s);
        this.availableHolders.push(s);

        x += 42;
    }

    // word placeholders
    x = 0;
    for(i = 1; i <= this.TOTAL_TILES; i++) {
        var s = new gamble.tilePlaceholder(x, 0);
        s.setFill('/assets/bg_tile.png');
        this.appendChild(s);
        this.wordHolders.push(s);

        x += 42;
    }

    

    /*
    * Add in an explanatory message that gets cleared when someone clicks
    * on an available tile
    */
    this.helpMsg = new lime.Label().
        setText("Click on the tiles to form your word").
        setFontSize(18).
        setAlign("center").
        setFontWeight("bold").
        setFontColor("#fff").
        setSize(400, 60).
        setFontFamily("Arial").
        setOpacity("0.6").
        setPosition(x-190, 45).
        setHidden(true);
    this.appendChild(this.helpMsg);

    /**
    * Returns the first empty placeholder in the available tiles
    * area
    */
    this.getFirstEmptyAvailable = function() {
    	var i;
    	for(i = 0; i < this.TOTAL_TILES; i++) {
    		if(!this.availableHolders[i].isFull()) {
    			return i;
    		}
    	}
    }

    /**
    * Adds in a tile to the first empty placeholder in
    * the available tiles area.
    */
    this.addTileToAvailable = function(tile, type) {
    	var tile = new gamble.tile(0, 0, tile.toUpperCase(), 1, type);

    	// define the event handler that controls the tile's movement
    	goog.events.listen(
	        tile.t,
	        ['mousedown', 'touchstart'],
	        this.tileMover
	    );

    	var placeholder = this.getFirstEmptyAvailable();

    	this.availableHolders[placeholder].appendChild(tile);
    	this.availableHolders[placeholder].toggleFull();
    }


    /**
    * Event handler that handles movement of the tiles
    */
    this.tileMover = function(e) {

        var tile = e.targetObject.parent_;

        // Hide the explanatory message
        tile.parent_.parent_.helpMsg.setHidden(true);
    	
    	if(tile.getPos() == 1) {
    		// Move from available area to word area
    		var wa = tile.parent_.parent_;
    		tile.parent_.toggleFull();
    		tile.parent_.removeChild(tile);
    		wa.wordHolders[wa.numWordTiles].appendChild(tile);
    		wa.wordHolders[wa.numWordTiles].toggleFull();
    		wa.numWordTiles++;
    		tile.togglePos();

            wa.score += gamble.LETTER_SCORES[tile.getTile()];

            // Update strength bar
            gamble.ui.strengthDp.updateScore(wa.score);

            // Enable send button, if disabled
            if(gamble.myTurn && !gamble.buttons.confirmBt._enabled) {
                gamble.buttons.confirmBt.enableButton();
            }

            // Disable swap button, if enabled
            if(gamble.buttons.swapBt._enabled) {
                gamble.buttons.swapBt.disableButton();
            }
    	}
    }

    /**
    * Clears all tiles from the available area,
    * and pushes them back to the word area
    */
    this.clearTiles = function() {
    	var i, tile, availablePos;
    	for(i = 0; i < this.numWordTiles; i++) {
    		tile = this.wordHolders[i].getChildAt(0);
    		this.wordHolders[i].toggleFull();
    		this.wordHolders[i].removeChild(tile);
    		availablePos = this.getFirstEmptyAvailable();
    		this.availableHolders[availablePos].appendChild(tile);
    		this.availableHolders[availablePos].toggleFull();
    		tile.togglePos();
    	}
    	this.numWordTiles = 0;
        this.score = 0;

        // Update strength bar
        gamble.ui.strengthDp.updateScore(0);

        // Disable send button
        gamble.buttons.confirmBt.disableButton();
        
        
        gamble.buttons.swapBt.enableButton();
    }

    /**
    * Shuffles the available tiles around
    */
    this.shuffleTiles = function() {
    	var i;
    	for(i = 0; i < this.TOTAL_TILES - 1; i++) {
    		var randIndex = Math.floor(i + (this.TOTAL_TILES - i - 1) * Math.random());
    		var ph1 = this.availableHolders[i],
    			ph2 = this.availableHolders[randIndex];

			var tile1 = ph1.getChildAt(0),
				tile2 = ph2.getChildAt(0);

			if(!ph1.isFull() && !ph2.isFull) {
				continue;
			}
			else if(tile1 && tile2) {
				ph1.removeChild(tile1);
				ph2.removeChild(tile2);
				ph1.appendChild(tile2);
				ph2.appendChild(tile1);
			}
			/**
			else if(tile1 && !tile2) {
				ph1.removeChild(tile1);
				ph1.toggleFull();
				ph2.appendChild(tile1);
				ph2.toggleFull();
			}
			*/
			else if(!tile1 && tile2) {
				ph2.removeChild(tile2);
				ph2.toggleFull();
				ph1.appendChild(tile2);
				ph1.toggleFull();
			}
    	}
    }


    /**
    * Cleans up the word area
    */
    this.cleanUp = function() {
        this.clearTiles();
        var i;
        for(i = 0; i < this.TOTAL_TILES; i++) {
            if(this.availableHolders[i].isFull()) {
                this.availableHolders[i].removeChildAt(0);
                this.availableHolders[i].toggleFull();
            }
        }
    }

    /**
    * Returns the word formed by the player
    */
    this.getFormedWord = function() {
        var word = "",
            i;

        for(i = 0; i < this.numWordTiles; i++) {
            word += this.getLetterFromTile(this.wordHolders[i].getChildAt(0).getTile());
        }

        return word;
    }

    /**
    * Returns the letter represented by the tile
    */
    this.getLetterFromTile = function(tile) {
        return String.fromCharCode(96 + tile);
    }

    /** 
    * Returns the tiles that are to be swapped as an array of
    * indices
    */
    this.getTilesToSwap = function() {
        var tiles = [];
        var i, tile;
        for(i = 0; i < this.TOTAL_TILES; i++) {
            tile = this.availableHolders[i].getChildAt(0);
            if(!tile.isHeld()) {
                tiles.push(i);
            }
        }

        return tiles;
    }

    /** 
    * Swaps out the tiles that need to be changed
    */
    this.swapTiles = function(newTiles) {
        var tilesToSwap = this.getTilesToSwap();
        var i, tile;
        newTiles = newTiles.split(",");
        for(i = 0; i < newTiles.length; i++) {
            tile = this.availableHolders[tilesToSwap[i]].getChildAt(0);
            tile.changeFill(newTiles[i].toUpperCase());
        }
    }
}

goog.inherits(gamble.wordArea, lime.Sprite);