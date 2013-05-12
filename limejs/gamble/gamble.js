//set main namespace
goog.provide('gamble');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Label');
goog.require('lime.animation.ColorTo');
goog.require("lime.scheduleManager");

goog.require("gamble.wordArea");
goog.require("gamble.strengthDp");
goog.require("gamble.commandButton");
goog.require("gamble.messageHandler");

gamble.WORD_TILE_DIM = 39;
gamble.LETTER_SCORES = [0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10];
gamble.SWAP_COST = 5;
gamble.WRONG_COST = 2;
gamble.BONUS_POINTS = 30;
gamble.NUM_BONUS_WORDS = 12;
gamble.Q_PROCESS_DELAY = 500;
gamble.MAX_SWAPS = 25;

// UI elements
var ui = {
    scene: null,
    layer: null,
    wordArea: null,
    strengthDp:null,
    bonusWords: [],
    score1: null,
    score2: null,
    turn1: null,
    turn2: null, 
    swaps1: null,
    swaps2: null,
    bonus1: null,
    bonus2: null,
    bonus3: null,
    bonus4: null,
    bottomSwap: null,
    notif: null,
    round: null,
    notifLabel: null,
    oppTiles: [],
    oppTilesPH: null
};

// Buttons
var buttons = {
    shuffleBt: null,
    clearBt: null,
    confirmBt: null,
    swapBt: null
};

gamble.totalScore = 0;
gamble.sentWord = "";
gamble.formedWords = [];
gamble.bonusWords = [];

gamble.messageQ = [];
gamble.gameState = {};
gamble.currPlayer = null;
gamble.myId = null;
gamble.currAction = "";
gamble.currValue = 0;
gamble.myTurn = false;
gamble.swapsLeft = 25;

var names = ["Arpan", "Sumit"];

gamble.start = function() {
    // Director settings
    var director = new lime.Director(document.body, 302, 453);
    director.makeMobileWebAppCapable();
    director.setDisplayFPS(false);

    setupInitialUI();

    
    // Set up tiles
    setupWordArea();

    
    setupTileButtons();
    
    // Message-handler
    var mh = new gamble.messageHandler();
    
    // Set up the schedule manager to process the message queue
    lime.scheduleManager.scheduleWithDelay(
        gamble.processMessageQ,
        {},
        gamble.Q_PROCESS_DELAY
    );

    director.replaceScene(ui.scene);
}

gamble.isBonusWord = function(word) {
    return gamble.bonusWords.indexOf(word.toLowerCase());
}

gamble.init = function(msg) {
    var letters = msg["Letters"],
        bonusWords = msg["BonusWords"];

    var i;
    
    // Initialize the word area
    for(i = 0; i < letters.length; i++) {
        gamble.ui.wordArea.addTileToAvailable(letters[i], "personal");
    }
    gamble.bonusWords = bonusWords;

    // Setup bonus words
    setupBonusWords();
}

gamble.updateTotalScore = function(validWord, isSwap) {
    var index;

    // Check if this is a swap operation
    if(isSwap) {
        gamble.totalScore -= gamble.SWAP_COST;
        gamble.ui.strengthDp.totalScoreDp.setFontColor("#ff0000");
    }
    else {
        if(!validWord) {
            gamble.totalScore -= gamble.WRONG_COST;
            gamble.ui.strengthDp.totalScoreDp.setFontColor("#ff0000");
        }
        else {
            var wordScore = 0, i;
            for(i = 0; i < gamble.sentWord.length; i++) {
                wordScore += gamble.LETTER_SCORES[gamble.sentWord[i].charCodeAt(0) - 64];
            }
            gamble.totalScore += wordScore;

            // Check if this is a bonus word
            index = gamble.isBonusWord(gamble.sentWord);
            if(index != -1) {
                gamble.totalScore += gamble.BONUS_POINTS;

                // Mark it
                gamble.ui.bonusWords[index].textLabel.setFontColor('#00FF00');
            }

            gamble.sentWord = "";
            gamble.ui.strengthDp.totalScoreDp.setFontColor("#00ff00");
        }
    }

    
    // Enable swap button if player has enough points
    if(gamble.totalScore >= gamble.SWAP_COST) {
        gamble.buttons.swapBt.enableButton();
    }
    else {
        gamble.buttons.swapBt.disableButton();
    }

    setTimeout(function() {gamble.ui.strengthDp.totalScoreDp.setFontColor("#fff");}, 2000);
}

var setupInitialUI = function() {
    ui.scene = new lime.Scene();

    ui.layer = new lime.Layer().
        setPosition(0, 0).
        setRenderer(lime.Renderer.CANVAS).
        setAnchorPoint(0, 0);

    var gameBg = new lime.Sprite().
        setSize(302, 453).
        setFill("/assets/background.png").
        setPosition(0, 0).
        setAnchorPoint(0, 0);

    // Add in player DPs
    var dp1 = new lime.Sprite().
        setFill("/assets/player1.png").
        setSize(43, 43).
        setAnchorPoint(0, 0).
        setPosition(8, 48);

    // Add in player DPs
    var dp2 = new lime.Sprite().
        setFill("/assets/player2.png").
        setSize(43, 43).
        setAnchorPoint(0, 0).
        setPosition(251, 48);

    // Add in player details
    var name1 = new lime.Label().
        setText(names[0]).
        setAnchorPoint(0, 0).
        setFontSize(14).
        setFontColor("#fff").
        setPosition(58, 48).
        setFontFamily("Helvetica").
        setFontWeight("bold");
     var name2 = new lime.Label().
        setText("").
        setAnchorPoint(0, 0).
        setFontSize(14).
        setFontColor("#fff").
        setPosition(205, 48).
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.score1 = new lime.Label().
        setText("0").
        setFontSize(26).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(145, 50).
        setFontFamily("Helvetica").
        setFontWeight("bold");
    ui.score2 = new lime.Label().
        setText("0").
        setFontSize(26).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(200, 50).
        setAlign("right").
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.swaps1 = new lime.Label().
        setText("25 swaps left").
        setFontSize(12).
        setSize(100, 12).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(45, 70).
        setFontFamily("Helvetica").
        setFontWeight("bold").
        setOpacity(0.7);

    ui.swaps2 = new lime.Label().
        setText("25 swaps left").
        setFontSize(12).
        setSize(100, 12).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(210, 95).
        setFontFamily("Helvetica").
        setFontWeight("bold").
        setOpacity(0.7);  

    // Set up bonus words
    ui.bonus1 = new lime.Label().
        setText("TRASH").
        setFontSize(24).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(30, 170).
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.bonus2 = new lime.Label().
        setText("STAND").
        setFontSize(24).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(160, 170).
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.bonus3 = new lime.Label().
        setText("TALK").
        setFontSize(24).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(40, 210).
        setFontFamily("Helvetica").
        setFontWeight("bold");      

    ui.bonus4 = new lime.Label().
        setText("SNOB").
        setFontSize(24).
        setAnchorPoint(0, 0).
        setFontColor("#fff").
        setPosition(170, 210).
        setFontFamily("Helvetica").
        setFontWeight("bold");


    ui.bottomSwap = new lime.Label().
        setText("You can swap 12 more letters. Choose wisely!").
        setFontSize(10).
        setAnchorPoint(0.5, 0.5).
        setFontColor("#fff").
        setPosition(150, 450).
        setAlign("center").
        setSize(300, 20).
        setFontFamily("Helvetica").
        setFontWeight("bold").
        setHidden(true);

    ui.round = new lime.Label().
        setText("Round 1").
        setFontSize(16).
        setAnchorPoint(0.5, 0.5).
        setFontColor("#fff").
        setPosition(150, 30).
        setAlign("center").
        setSize(100, 30).
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.turn1 = new lime.Sprite().
        setFill("/assets/icn_exclaim.png").
        setSize(18, 18).
        setAnchorPoint(0, 0).
        setPosition(130, 50).
        setHidden(true);

    ui.turn2 = new lime.Sprite().
        setFill("/assets/icn_exclaim.png").
        setSize(18, 18).
        setAnchorPoint(0, 0).
        setPosition(155, 50).
        setHidden(true);

    ui.notif = new lime.Sprite().
        setFill("/assets/bkg_notif.png").
        setSize(302, 42).
        setAnchorPoint(0.5, 0.5).
        setPosition(151, 21).
        setHidden(true);

    ui.notifLabel = new lime.Label().
        setText("Arpan forms 'Mafia'").
        setFontSize(16).
        setAnchorPoint(0.5, 0.5).
        setFontColor("#000").
        setPosition(0, 15).
        setAlign("center").
        setSize(302, 42).
        setFontFamily("Helvetica").
        setFontWeight("bold");

    ui.oppTilesPH = new lime.Sprite().
        setSize(152, 20).
        setAnchorPoint(0, 0).
        setPosition(5, 93).
        setHidden(false);

    // Add in opponent tiles
    ui.oppTiles = [];
    var x = 0;
    for(i = 0; i < 7; i++) {
        ui.oppTiles.push(new gamble.tile(x, 0, "A", 0, "personal"));
        ui.oppTilesPH.appendChild(ui.oppTiles[i]);
        x += 26;
        ui.oppTiles[i].setSize(20, 20);
        ui.oppTiles[i].t.setSize(24, 24);
        ui.oppTiles[i].removeChild(ui.oppTiles[i].hold);
        ui.oppTiles[i].setHidden(true);
    }

    ui.layer.appendChild(gameBg);
    ui.layer.appendChild(dp1);
    ui.layer.appendChild(dp2);
    ui.layer.appendChild(name1);
    ui.layer.appendChild(name2);
    ui.layer.appendChild(ui.score1);
    ui.layer.appendChild(ui.score2);
    ui.layer.appendChild(ui.swaps1);
    ui.layer.appendChild(ui.swaps2);
    ui.layer.appendChild(ui.bonus1);
    ui.layer.appendChild(ui.bonus2);
    ui.layer.appendChild(ui.bonus3);
    ui.layer.appendChild(ui.bonus4);
    ui.layer.appendChild(ui.bottomSwap);
    ui.layer.appendChild(ui.round);
    ui.layer.appendChild(ui.turn1);
    ui.layer.appendChild(ui.turn2);
    ui.layer.appendChild(ui.notif);
    ui.layer.appendChild(ui.oppTilesPH);
    
    ui.notif.appendChild(ui.notifLabel);



    ui.scene.appendChild(ui.layer);
}

/**
* Sets up the word area
*/
var setupWordArea = function() {
    
    ui.wordArea = new gamble.wordArea(
        5,
        300
    );

    ui.layer.appendChild(ui.wordArea);
}

/**
* Sets up the buttons used to control the letter-tiles
*/
var setupTileButtons = function() {

    // shuffle button
    /*
    buttons.shuffleBt = new gamble.commandButton(
        '/assets/btn_shuffle_on.png',
        465, 
        600,
        "Shuffle",
        "tile"
    );
    ui.layer.appendChild(buttons.shuffleBt);
    */

    // clear button
    buttons.clearBt = new gamble.commandButton(
        '/assets/btn_small.png',
        270, 
        285,
        "Clear",
        "clear"
    );
    ui.layer.appendChild(buttons.clearBt);
    

    buttons.confirmBt = new gamble.commandButton(
        '/assets/btn_action.png',
        100, 
        430,
        "Send",
        "send"
    );
    buttons.confirmBt.disableButton();
    ui.layer.appendChild(buttons.confirmBt);


    buttons.swapBt = new gamble.commandButton(
        '/assets/btn_action.png',
        200, 
        430,
        "Swap",
        "send"
    );
    buttons.swapBt.disableButton();
    ui.layer.appendChild(buttons.swapBt);

    // Word strength indicator
    ui.strengthDp = new gamble.strengthDp(-15, 255);
    ui.strengthDp.updateScore(0);
    ui.layer.appendChild(ui.strengthDp);
}

gamble.processMessageQ = function(dt) {
    while(gamble.messageQ.length != 0) {
        var msg = gamble.messageQ.shift();
        gamble.currAction = msg["Action"];
        gamble.currPlayer = msg["PlayerIdx"];
        gamble.gameState = msg["GameState"];
        gamble.currValue = msg["Value"];

        refreshUI(msg);

        switch(gamble.currAction) {
            case "welcome":
                gamble.myId = gamble.currPlayer;
                break;
            case "start":
                start();
                break;
            case "swap":
                swap();
                break;
            case "word":
                word();
                break;
            case "request_word":
                requestWord();
                break;
            case "game_over":
                gameOver();
                break;
            case "validate":
                gamble.updateTotalScore(msg["Validity"], false);
                break;
        }
    }
}

// Generic function which refreshes the entire UI
var refreshUI = function(msg) {
    if(gamble.gameState["Players"].length != 2) {
        return;
    }

    var self, opponent;
    // Update the player object- player1 is always me in this context
    if(gamble.myId == 1) {
        self = gamble.gameState["Players"][0];
        opponent = gamble.gameState["Players"][1];
    }
    else {
        self = gamble.gameState["Players"][1];
        opponent = gamble.gameState["Players"][0];
    }

    // Update score
    gamble.ui.score1.setText(opponent["Score"]);
    gamble.ui.score2.setText(self["Score"]);

    // Update swaps left
    gamble.ui.swaps1.setText((gamble.MAX_SWAPS - opponent["Swaps"]) + " swaps left");
    gamble.ui.swaps2.setText((gamble.MAX_SWAPS - self["Swaps"]) + " swaps left");
    
    gamble.ui.bottomSwap.setText("You can swap " + (gamble.MAX_SWAPS - self["Swaps"]) + " more letters. Choose wisely!");

    // Update round
    ui.round.setText("Round " + gamble.gameState["Round"]);

    // Update opponent tiles
    if(opponent["Tiles"]) {
        var i;
        for(i = 0; i < opponent["Tiles"].length; i++) {
            ui.oppTiles[i].setHidden(false);
            ui.oppTiles[i].changeFill(opponent["Tiles"][i].toUpperCase());
        }
    } 
}

// Sets up the screen
var start = function() {
    // Add in bonus words
    var bonusWords = gamble.gameState["BonusWords"];
    ui.bonus1.setText(bonusWords[0][0].toUpperCase());
    ui.bonus2.setText(bonusWords[0][1].toUpperCase());
    ui.bonus3.setText(bonusWords[1][0].toUpperCase());
    ui.bonus4.setText(bonusWords[1][1].toUpperCase());

    // Add in my tiles
    var player = gamble.gameState["Players"][gamble.myId - 1];
    var tiles = player["Tiles"];
    var i;

    // Initialize the word area
    for(i = 0; i < tiles.length; i++) {
        gamble.ui.wordArea.addTileToAvailable(tiles[i].toUpperCase(), "personal");
    }

    // Show round
    ui.round.setHidden(false);

    // Disable send, enable swap
    buttons.confirmBt.disableButton();
    buttons.swapBt.enableButton();
}

var requestWord = function() {
    // Need to show some indication of player's turn
    if(gamble.currPlayer == gamble.myId) {
        ui.turn1.setHidden(true);
        ui.turn2.setHidden(false);
    }
    else {
        ui.turn1.setHidden(false);
        ui.turn2.setHidden(true);
    }

    if(gamble.myId != gamble.currPlayer) {
        // Disable send
        buttons.confirmBt.disableButton();
        gamble.myTurn = false;
        return;
    }

    // Enable send
    buttons.confirmBt.enableButton();

    gamble.myTurn = true;
}

var swap = function() {
    if(gamble.myId != gamble.currPlayer) {
        // Display message
        ui.notifLabel.setText(names[gamble.currPlayer-1] + " swaps " + (gamble.currValue.split(",").length) + " tiles");
        ui.notif.setHidden(false);
        setTimeout(function() {ui.notif.setHidden(true);}, 5000);

        return;
    }

    // Replace my tiles
    ui.wordArea.swapTiles(gamble.currValue);
}

var word = function() {
    if(gamble.myId != gamble.currPlayer) {
        // Display message
        ui.notifLabel.setText(names[gamble.currPlayer-1] + " forms " + gamble.currValue);
        ui.notif.setHidden(false);
        setTimeout(function() {ui.notif.setHidden(true);}, 5000);
        return;
    }

    // Check for bonus word
    var index = gamble.gameState["BonusWords"][0].indexOf(gamble.currValue);
    if(index != -1) {
        ui["bonus"+(index+1)].setFontColor("#FF6600");
        setTimeout(function() {ui["bonus"+(index+1)].setFontColor("#246F49");}, 3000);
    }
    var index1 = gamble.gameState["BonusWords"][1].indexOf(gamble.currValue);
    if(index1 != -1) {
        alert("d");
        ui["bonus"+(index1+1+2)].setFontColor("#FF6600");
        setTimeout(function() {ui["bonus"+(index1+1+2)].setFontColor("#246F49");}, 3000);
    }
}

var gameOver = function() {

}

gamble.ui = ui;
gamble.buttons = buttons;
gamble.score = 0;

/*
// entrypoint
gamble.start = function(){

	var director = new lime.Director(document.body,1024,768),
	    scene = new lime.Scene(),

	    target = new lime.Layer().setPosition(512,384),
        circle = new lime.Circle().setSize(150,150).setFill(255,150,0),
        lbl = new lime.Label().setSize(160,50).setFontSize(30).setText('TOUCH ME!'),
        title = new lime.Label().setSize(800,70).setFontSize(60).setText('Now move me around!')
            .setOpacity(0).setPosition(512,80).setFontColor('#999').setFill(200,100,0,.1);


    //add circle and label to target object
    target.appendChild(circle);
    target.appendChild(lbl);

    //add target and title to the scene
    scene.appendChild(target);
    scene.appendChild(title);

	director.makeMobileWebAppCapable();

    //add some interaction
    goog.events.listen(target,['mousedown','touchstart'],function(e){

        //animate
        target.runAction(new lime.animation.Spawn(
            new lime.animation.FadeTo(.5).setDuration(.2),
            new lime.animation.ScaleTo(1.5).setDuration(.8)
        ));

        title.runAction(new lime.animation.FadeTo(1));

        //let target follow the mouse/finger
        e.startDrag();

        //listen for end event
        e.swallow(['mouseup','touchend'],function(){
            target.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(1),
                new lime.animation.ScaleTo(1),
                new lime.animation.MoveTo(512,384)
            ));

            title.runAction(new lime.animation.FadeTo(0));
        });


    });

	// set current scene active
	director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('gamble.start', gamble.start);
*/
