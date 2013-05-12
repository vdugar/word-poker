// Set main namespace
goog.provide("tywa");

// get requirements
goog.require("lime.Director");
goog.require("lime.Scene");
goog.require("lime.Layer");
goog.require("lime.fill.LinearGradient");
goog.require("lime.GlossyButton");
goog.require("lime.Label");
goog.require("lime.Button");
goog.require("lime.SpriteSheet");
goog.require("lime.ASSETS.sprtsht.plist");
goog.require("lime.scheduleManager");
//goog.require("lime.animation.Resize");

goog.require("tywa.commandButton");
goog.require("tywa.pictureHolder");
goog.require("tywa.betHolder");
goog.require("tywa.tilePlaceholder");
goog.require("tywa.tile");
goog.require("tywa.wordArea");
goog.require("tywa.messageHandler");
goog.require("tywa.state");
goog.require("tywa.timer");
goog.require("tywa.betSlider");
goog.require("tywa.messageDisplay");
goog.require("tywa.strengthDp");

goog.require("goog.math");

// Size constants
tywa.WIDTH = 960;
tywa.HEIGHT = 640;
tywa.COMMAND_WIDTH = 960;
tywa.COMMAND_HEIGHT = 180;
tywa.TABLE_WIDTH = 832;
tywa.TABLE_HEIGHT = 405;
tywa.COMMAND_BUTTON_WIDTH = 114;
tywa.COMMAND_BUTTON_HEIGHT = 38;
tywa.COMMUNITY_TILE_DIM = 48;
tywa.WORD_TILE_DIM = 48;
tywa.PROFILE_W = 89;
tywa.PROFILE_H = 124;
tywa.BET_W = 101;
tywa.BET_H = 29;
tywa.TILE_BUTTON_W = 34;
tywa.TILE_BUTTON_H = 34;
tywa.BET_SLIDER_W = 220;
tywa.BET_SLIDER_H = 28;
tywa.SLIDER_BT_W = 59;
tywa.SLIDER_BT_H = 33;
tywa.MESSAGE_DP_W = 280;
tywa.MESSAGE_DP_H = 80;
tywa.SENDBT_W = 182;
tywa.SENDBT_H = 92;
tywa.STRENGTH_W = 174;
tywa.STRENGTH_H = 28;

// Placement constants
tywa.COMMUNITY_BEGIN_X = 346;
tywa.COMMUNITY_Y = 210;
tywa.AVAILABLE_BEGIN_X = 60;
tywa.AVAILABLE_Y = 527;
tywa.WORD_Y = 575;
tywa.MESSAGE_DP_X = 480;
tywa.MESSAGE_DP_Y = 330;
tywa.TICKER_X = 480;
tywa.TICKER_Y = 140;


// Game constants
tywa.NUM_COMMUNITY_TILES = 5;
tywa.NUM_INITIAL_REVEAL = 3;
tywa.NUM_PLAYER_TILES = 2;
tywa.MAX_NUM_PLAYERS = 4;
tywa.Q_PROCESS_DELAY = 500;                // milli-seconds
tywa.BET_TIME = 30;                        //seconds
tywa.LETTER_SCORES = [0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10];
tywa.INIT_COOLDOWN = 20;
tywa.TILE_COOLDOWN = 15;
tywa.WORD_FORM_TIMEOUT = 15;
tywa.NUM_TOTAL_TILES = 7;
tywa.BLIND = 50;

// UI elements
var ui = {
    tableScene: null,
    tableLayer: null,
    scoreDp: null,
    spriteSheet: null,
    players: [],
    commPlaceholders: [],
    commTiles: [],
    wordArea: null,
    betSlider: null,
    potDp: null,
    cooldownDp: null,
    ticker: null,
    strengthDp: null,
    minBetMsg: null,
    lobbyBt: null,
    waitMsg: null,
    chipPiles: []
};

// Buttons
var buttons = {
    foldBt: null,
    betBt: null,
    callBt: null,
    allInBt: null,
    checkBt: null,
    raiseBt: null,
    shuffleBt: null,
    clearBt: null,
    confirmBt: null
};

var mh = null;

// entrypoint
tywa.start = function() {
    
    // Director settings
    var director = new lime.Director(document.body, tywa.WIDTH, tywa.HEIGHT);
    director.makeMobileWebAppCapable();
    director.setDisplayFPS(false);

    // Set up spritesheet
    ui.spriteSheet = new lime.SpriteSheet(
        '/assets/sprtsht.png',
        lime.ASSETS.sprtsht.plist
    );

    // Set up initial UI
    setupInitialUI();

    // Set up buttons
    setupCommandButtons();
    setupTileButtons();

    // Set up tiles
    setupWordArea();

    // set up tile placeholders
    setupCommunityTiles();

    // Set up central chip piles
    setupCentralChipPiles();

    // Set up players UI
    setupPlayersUI();

    // Set up slider
    setupSlider();

    // Set pot dp
    setupPotDp();

    // Setup cooldown timer
    setupCooldownTimer();

    // Set up the action ticker
    setupActionTicker();

    // Open up websocket connection
    mh = new tywa.messageHandler();

    // Set up the schedule manager to process the message queue
    lime.scheduleManager.scheduleWithDelay(
        tywa.state.processMessageQueue,
        {},
        tywa.Q_PROCESS_DELAY
    );
    
    director.replaceScene(ui.tableScene);

}

/**
* Sets up the initial game UI
*/
var setupInitialUI = function() {
    ui.tableScene = new lime.Scene();

    ui.tableLayer = new lime.Layer().
        setPosition(0, 0).
        setRenderer(lime.Renderer.CANVAS).
        setAnchorPoint(0, 0);

    // static UI elements
    var gameBg = new lime.Sprite().
        setSize(tywa.WIDTH, tywa.HEIGHT).
        setFill("/assets/background.jpg").
        setPosition(0, 0).
        setAnchorPoint(0, 0);

    var commandBg = new lime.Sprite().
        setSize(tywa.COMMAND_WIDTH, tywa.COMMAND_HEIGHT).
        setFill(ui.spriteSheet.getFrame('Bottom_BG.png')).
        setPosition(0, 460).
        setAnchorPoint(0, 0);

    var tableBg = new lime.Sprite().
        setSize(tywa.TABLE_WIDTH, tywa.TABLE_HEIGHT).
        setFill(ui.spriteSheet.getFrame('poker-table.png')).
        setPosition(64, 30).
        setAnchorPoint(0, 0);

    // Show the minimum bet message
    ui.minBetMsg = new lime.Label().
        setAlign('center').
        setAnchorPoint(0.5, 0.5).
        setPosition(480, 150).
        setSize(tywa.MESSAGE_DP_W, tywa.MESSAGE_DP_H).
        setFontColor('#112e00').
        setFontSize(20).
        setFontFamily("News Gothic MT, Arial").
        setText("Minimum bet is $" + tywa.BLIND).
        setFontWeight("bold").
        setHidden(true);

    // Show the waiting-for-players message
    ui.waitMsg = new lime.Label().
        setAlign('center').
        setAnchorPoint(0.5, 0.5).
        setPosition(tywa.MESSAGE_DP_X, tywa.MESSAGE_DP_Y).
        setSize(tywa.MESSAGE_DP_W, tywa.MESSAGE_DP_H).
        setFontColor('#AACEA1').
        setFontSize(28).
        setText("Waiting for punters to join").
        setFontFamily("News Gothic MT, Arial").
        setFontWeight("bold");

    // Add in lobby link
    ui.lobbyBt = new lime.Sprite().
        setAnchorPoint(0, 0).
        setPosition(912 , 501).
        setSize(48, 47).
        setFill(ui.spriteSheet.getFrame("btn_lobby.png"));

    goog.events.listen(
            ui.lobbyBt,
            ['mousedown', 'touchstart'],
            function() {
                if(window.parent) {
                    window.parent.location = "/lobby/";
                }        
                else {
                    window.location = "/lobby/";
                }
            }
    );
    
    ui.tableLayer.appendChild(gameBg);
    ui.tableLayer.appendChild(commandBg);
    ui.tableLayer.appendChild(tableBg);
    ui.tableLayer.appendChild(ui.minBetMsg);
    ui.tableLayer.appendChild(ui.lobbyBt);
    ui.tableLayer.appendChild(ui.waitMsg);

    ui.tableScene.appendChild(ui.tableLayer);
}

/**
* Sets up UI elememts for players
*/
var setupPlayersUI = function() {
    var picAsset = ui.spriteSheet.getFrame("Profile.png"),
        i;
    
    // Set up each player in turn
    // Player 1 = current user
    var player = {};
    player.dp = new tywa.pictureHolder(
        20, 
        310, 
        picAsset,
        ui.spriteSheet.getFrame('dp_other.png'),
        "00"
    );
    player.dp.setHidden(true);
    
    ui.tableLayer.appendChild(player.dp);
    ui.players.push(player);

    // player 2
    player = {};
    player.dp = new tywa.pictureHolder(
        20, 
        40, 
        picAsset,
        ui.spriteSheet.getFrame('dp_other.png'),
        "10"
    );
    player.dp.setHidden(true);
    
    ui.tableLayer.appendChild(player.dp);
    ui.players.push(player);

    // player 3
    player = {};
    player.dp = new tywa.pictureHolder(
        850, 
        40, 
        picAsset,
        ui.spriteSheet.getFrame('dp_other.png'),
        "11"
    );
    player.dp.setHidden(true);
    
    ui.tableLayer.appendChild(player.dp);
    ui.players.push(player);

    // player 4
    player = {};
    player.dp = new tywa.pictureHolder(
        840, 
        310, 
        picAsset,
        ui.spriteSheet.getFrame('dp_other.png'),
        "01"
    );
    player.dp.setHidden(true);
    
    ui.tableLayer.appendChild(player.dp);
    ui.players.push(player);
}

/**
* Sets up the command center buttons
*/
var setupCommandButtons = function() {

    // Fold button
    buttons.foldBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_generic_on.png'),
        680, 
        490,
        "Fold",
        "command"
    );
    buttons.foldBt.disableButton();
    ui.tableLayer.appendChild(buttons.foldBt);

    // Check button
    buttons.checkBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_generic_on.png'),
        540, 
        490,
        "Check",
        "command"
    );
    buttons.checkBt.disableButton();
    ui.tableLayer.appendChild(buttons.checkBt);

    // Call button
    buttons.callBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_generic_on.png'),
        410, 
        490,
        "Call",
        "command"
    );
    buttons.callBt.disableButton();
    ui.tableLayer.appendChild(buttons.callBt);

    // Raise button
    buttons.raiseBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_generic_on.png'),
        280, 
        490,
        "Raise",
        "command"
    );
    buttons.raiseBt.disableButton();
    ui.tableLayer.appendChild(buttons.raiseBt);

    // Bet button- same position as raise
    buttons.betBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_generic_on.png'),
        280, 
        490,
        "Bet",
        "command"
    );
    buttons.betBt.disableButton();
    ui.tableLayer.appendChild(buttons.betBt);
    
    buttons.betBt.setHidden(true);
}

/**
* Sets up the buttons used to control the letter-tiles
*/
var setupTileButtons = function() {

    // shuffle button
    buttons.shuffleBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_shuffle_on.png'),
        465, 
        613,
        "Shuffle",
        "tile"
    );
    ui.tableLayer.appendChild(buttons.shuffleBt);

    // clear button
    buttons.clearBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_clear_on.png'),
        465, 
        553,
        "Clear",
        "tile"
    );
    ui.tableLayer.appendChild(buttons.clearBt);

    buttons.confirmBt = new tywa.commandButton(
        ui.spriteSheet.getFrame('btn_send_on.png'),
        840, 
        580,
        "Send",
        "send"
    );
    buttons.confirmBt.disableButton();
    ui.tableLayer.appendChild(buttons.confirmBt);

    // Word strength indicator
    ui.strengthDp = new tywa.strengthDp(540, 545);
    ui.strengthDp.updateScore(0);
    ui.tableLayer.appendChild(ui.strengthDp);
}

/**
* Sets up the word area
*/
var setupWordArea = function() {
    
    ui.wordArea = new tywa.wordArea(
        tywa.AVAILABLE_BEGIN_X,
        tywa.AVAILABLE_Y
    );

    ui.tableLayer.appendChild(ui.wordArea);
}

/**
* Setup community tiles
*/
var setupCommunityTiles = function() {
    // First up, community tile placeholders
    var x = tywa.COMMUNITY_BEGIN_X;
    var i;
    for(i = 1; i <= tywa.NUM_COMMUNITY_TILES; i++) {
        var s = new tywa.tilePlaceholder(x, tywa.COMMUNITY_Y);
        var tile = new tywa.tile(0, 0, 0, 3, "community");
        s.appendChild(tile);
        ui.commPlaceholders.push(s);
        ui.tableLayer.appendChild(s);

        x += 55;
    }
}

var setupSlider = function() {
    ui.betSlider = new tywa.betSlider(60, 485);
    ui.betSlider.setHidden(true);
    ui.tableLayer.appendChild(ui.betSlider);
}

var setupPotDp = function() {
    ui.potDp = new tywa.betHolder(428, 160, ui.spriteSheet.getFrame("betting_amount_placeholder.png"));

    ui.tableLayer.appendChild(ui.potDp);
}

var setupCooldownTimer = function() {
    ui.cooldownDp = new tywa.messageDisplay();
    ui.cooldownDp.setHidden(true);
    ui.tableLayer.appendChild(ui.cooldownDp);
}

var setupActionTicker = function() {
    ui.ticker = new lime.Label().
        setText("").
        setFontWeight("bold").
        setAlign("center").
        setFontColor('#112e00').
        setFontSize(20).
        setFontFamily("News Gothic MT, Arial").
        setSize(200, 60).
        setPosition(tywa.TICKER_X, tywa.TICKER_Y);

    ui.tableLayer.appendChild(ui.ticker);
}

var setupCentralChipPiles = function() {
    var i,
        chips;
    for(i = 0; i < tywa.MAX_NUM_PLAYERS; i++) {
        chips = new lime.Sprite().
            setFill(ui.spriteSheet.getFrame("chips_more.png")).
            setSize(97, 61).
            setPosition(400, 170).
            setHidden(true);
        ui.chipPiles.push(chips);
        ui.tableLayer.appendChild(chips);
    }
}


tywa.ui = ui;
tywa.buttons = buttons;
tywa.mh = mh;

