/**
* Takes care of all web-socket messages
*/

goog.provide("tywa.messageHandler");

tywa.messageHandler = function() {
	// Open up a websocket connection
	tywa.messageHandler.conn = new WebSocket(webHost);
				
    tywa.messageHandler.conn.onclose = function(evt) {
        console.log("<div><b>Connection closed.</b></div>");
        if(window.parent) {
            window.parent.location = "/lobby/";
        }        
        else {
            window.location = "/lobby/";
        }
    }

    tywa.messageHandler.conn.onmessage = function(evt) {
		msg = $.parseJSON(evt.data);
		console.log(msg);
		tywa.state.messageQ.push(msg);
    }
}

tywa.messageHandler.sendMessage = function(action, amount) {
    var obj = {
        "BetAction": action,
        "BetAmount": amount
    };

    tywa.messageHandler.conn.send(JSON.stringify(obj));
    console.log(obj);
}

tywa.messageHandler.sendWord = function(word) {
    var obj = {
        "Word": word
    };

    tywa.messageHandler.conn.send(JSON.stringify(obj));
    console.log(obj);
}

/**
* closes the websocket connection
*/
tywa.messageHandler.closeConn = function() {
    tywa.messageHandler.conn.close();
}

