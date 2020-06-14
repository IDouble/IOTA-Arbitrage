'use strict';

const API_URL_WS = "wss://api.bitfinex.com/ws/2";

const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

function BFX(opts = {}) {
	this.ws = null;
	this.websocketURI = opts.websocketURI || API_URL_WS;
	this.channelMap = {}
	this.eventMap = {
		open: [],
		message: [],
		close: [],
		error: [],
		ticker: [],
		trade: [],
	};
};

BFX.prototype.debug = function(arg) {
	if (typeof arg == "string") {
		console.log("BFX: debug: " + arg);
	} else {
		console.log("BFX: debug: object>");
		console.log(arg);
	}

};

BFX.prototype.open = function() {
	this.debug("open");

	this.ws = new WebSocket(this.websocketURI);

	var that = this;
	var callback_onopen = function(event) {that.onopen(event);};
	var callback_onmessage = function(event) {that.onmessage(event);};
	var callback_onclose = function(event) {that.onclose(event);};
	var callback_onerror = function(event) {that.onerror(event);};

	this.ws.onopen = callback_onopen;
	this.ws.onmessage = callback_onmessage;
	this.ws.onclose = callback_onclose;
	this.ws.onerror = callback_onerror;

};


BFX.prototype.destroy = function() {
	this.debug("destroy");

	this.ws.close();
};

BFX.prototype.onopen = function(event) {
	this.debug("raw: onopen: ");
	this.debug(event);

	for (var i = 0; i < this.eventMap["open"].length; i++) {
		this.debug("onopen: callback[" + i + "]");
		this.eventMap["open"][i](event);
	}
};


BFX.prototype.getEventReason = function(event) {
	var reason = "Unknown reason";

	if (event.code == 1000)
		reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
	else if(event.code == 1001)
		reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
	else if(event.code == 1002)
		reason = "An endpoint is terminating the connection due to a protocol error";
	else if(event.code == 1003)
		reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
	else if(event.code == 1004)
		reason = "Reserved. The specific meaning might be defined in the future.";
	else if(event.code == 1005)
		reason = "No status code was actually present.";
	else if(event.code == 1006)
	   reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
	else if(event.code == 1007)
		reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
	else if(event.code == 1008)
		reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
	else if(event.code == 1009)
	   reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
	else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
		reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
	else if(event.code == 1011)
		reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
	else if(event.code == 1015)
		reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";

	return reason;
};
BFX.prototype.onclose = function(event) {
	this.debug("raw: onclose: ");
	this.debug(event);

	for (var i = 0; i < this.eventMap["close"].length; i++) {
		this.debug("onclose: callback[" + i + "]");

		var reason = null;
		if (event.code) {
			var reason = this.getEventReason(event);
		}
		this.eventMap["close"][i](reason, event);
	}
};

BFX.prototype.onmessage = function (event) {
	this.debug("raw: onmessage: ");
	this.debug(event);

	var raweventdata = event.data;
	var eventdata = null;
	try {
		eventdata = JSON.parse(raweventdata);
	} catch(e) {
		this.debug("error: json parsing failed!");
	}

	if (typeof eventdata == 'object') {
		if (eventdata instanceof Array) {
			if (this.channelMap[eventdata[0]]) {
				var data = eventdata.slice();
				data.shift();
				if (this.channelMap[eventdata[0]][0] == "ticker") {
					for (var i = 0; i < this.eventMap["ticker"].length; i++) {
						this.debug("ticker: callback[" + i + "]");
						this.eventMap["ticker"][i]( this.channelMap[eventdata[0]][1], data );
					}
				} else if (this.channelMap[eventdata[0]][0] == "trades") {
					for (var i = 0; i < this.eventMap["trade"].length; i++) {
						this.debug("trade: callback[" + i + "]");
						this.eventMap["trade"][i]( this.channelMap[eventdata[0]][1], data );
					}
				}
			}
		} else {
			if (eventdata['event'] && eventdata['event'] == 'subscribed') {
				if (eventdata['channel']) {
					if (eventdata['channel'] == 'ticker') {
						this.channelMap[eventdata['chanId']] = [eventdata['channel'], eventdata['pair']];
					} else if (eventdata['channel'] == 'trades') {
						this.channelMap[eventdata['chanId']] = [eventdata['channel'], eventdata['pair']];
					}
				}
			}
		}
	}


	for (var i = 0; i < this.eventMap["message"].length; i++) {
		this.debug("onmessage: callback[" + i + "]");
		this.eventMap["message"][i](reason, event);
	}

};

BFX.prototype.onerror = function(event) {
	this.debug("raw: onerror: ");
	this.debug(event);

	for (var i = 0; i < this.eventMap["error"].length; i++) {
		this.debug("onerror: callback[" + i + "]");

		this.eventMap["error"][i](event);
	}
};

BFX.prototype.on = function(event, callback) {
	if (["open", "close", "message", "error", "ticker", "trade"].indexOf(event) == -1) {
		return;
	}

	this.eventMap[event].push(callback);
}

BFX.prototype.subscribeTicker = function(symbol = 'tBTCUSD') {
	this.ws.send(JSON.stringify({
		event: 'subscribe',
		channel: 'ticker',
		symbol: symbol
	}));
}

BFX.prototype.subscribeTrades = function(symbol = 'BTCUSD') {
	this.ws.send(JSON.stringify({
		event: 'subscribe',
		channel: 'trades',
		symbol: symbol
	}));
}