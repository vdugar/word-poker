/**
* Takes care of all web-socket messages
*/

goog.provide("gamble.messageHandler");

gamble.messageHandler = function() {
	// Open up a websocket connection
	gamble.messageHandler.conn = new WebSocket("ws://10.99.3.123:8020/ws/");
				
    gamble.messageHandler.conn.onclose = function(evt) {
        console.log("<div><b>Connection closed.</b></div>");
    }

    gamble.messageHandler.conn.onmessage = function(evt) {
		msg = $.parseJSON(evt.data);
		console.log(msg);
        gamble.messageQ.push(msg);
    }
}

gamble.messageHandler.sendMessage = function(action, numLetters, word) {
    var obj = {
        "Action": action,
        "Word": word,
        "Tiles": numLetters
    };
    console.log(gamble.messageHandler.conn);
    var objStr = JSON.stringify(obj);
    gamble.messageHandler.conn.send(objStr);
    console.log(obj);
}

gamble.messageHandler.sendWord = function(word) {
    var obj = {
        "Word": word
    };

    gamble.messageHandler.conn.send(JSON.stringify(obj));
    console.log(obj);
}

/**
* closes the websocket connection
*/
gamble.messageHandler.closeConn = function() {
    gamble.messageHandler.conn.close();
}