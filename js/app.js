
var __bfx = null;
var __error_count = 0;
const RETRY_WAIT_MS = 1000;
const MAX_ERROR_COUNT = 5;
const MAX_CARDS = 8;

const EXCHANGE_RATE_PRICE_RESOLUTION = 8;
const EXCHANGE_RATE_PERCENT_FLOAT_RESOLUTION = 2;
const EXCHANGE_RATE_PERCENT_INT_RESOLUTION = 2;
const ARBITRAGE_RESOLUTION = 8;
const TRADE_IOTA_RESOLUTION = 8;
const TRADE_PRICE_RESOLUTION = 8;

/* exchange vars */
var usd_per_btc = null;
var usd_per_eth = null;
var usd_per_miota = null;
var btc_per_miota = null;
var eth_per_miota = null;

var __usd_amount = 1000;

var $loaderButton = null;
var $loaderButtonIcon = null;

var $userInputUSD = null;

var $sampleTradeCard = null;

var bfxopen = function() {
	console.log('bfx opened!');
	__error_count = 0;

	__bfx.subscribeTicker('tBTCUSD');
	__bfx.subscribeTicker('tETHUSD');
	__bfx.subscribeTicker('tIOTUSD');
	__bfx.subscribeTicker('tIOTBTC');
	__bfx.subscribeTicker('tIOTETH');


	__bfx.subscribeTrades('tIOTUSD');
	__bfx.subscribeTrades('tIOTBTC');
	__bfx.subscribeTrades('tIOTETH');

	if ($loaderButton) {
		$loaderButton.classList.add('is-success');
		$loaderButton.classList.remove('is-danger');
	}
};

var bfxclose = function(reason, event) {
	if (event.wasClean == true) {
		// clean close; do nothing.
	}

	// error handling
	console.log("WS: closed: reason: " + reason);
	usd_per_btc = usd_per_eth = usd_per_miota = btc_per_miota = eth_per_miota = null;
	$loaderButton.classList.add('is-danger');
	$loaderButton.classList.add('is-loading');
	$loaderButton.classList.remove('is-success');
	$loaderButtonIcon.classList.remove('fa-spin');

	const $websocketstoomanyfailuresmodal = document.getElementById('websockets-too-many-failures-modal');
	$websocketstoomanyfailuresmodal.classList.add('is-active');
};

var bfxerror = function(event) {
	__error_count += 1;
	console.log("__error_count: " + __error_count);

	if (__error_count > MAX_ERROR_COUNT-1) {
		const $websocketstoomanyfailuresmodal = document.getElementById('websockets-too-many-failures-modal');
		$websocketstoomanyfailuresmodal.classList.add('is-active');

		return;
	}

	usd_per_btc = usd_per_eth = usd_per_miota = btc_per_miota = eth_per_miota = null;
	$loaderButton.classList.add('is-danger');
	$loaderButton.classList.add('is-loading');
	$loaderButton.classList.remove('is-success');
	$loaderButtonIcon.classList.remove('fa-spin');
	setTimeout(function() {
		__bfx.open();
	}, RETRY_WAIT_MS);
};

var updateCard = function(pair, data, element) {
/*
	?? todo: figure this out.
	0	FRR					float	Flash Return Rate - average of all fixed rate funding over the last hour
	1	BID					float	Price of last highest bid
	2	BID_PERIOD			integer	Bid period covered in days
	3	BID_SIZE			float	Size of the last highest bid
	4	ASK					float	Price of last lowest ask
	5	ASK_PERIOD			integer	Ask period covered in days
	6	ASK_SIZE			float	Size of the last lowest ask
	7	DAILY_CHANGE		float	Amount that the last price has changed since yesterday
	8	DAILY_CHANGE_PERC	float	Amount that the price has changed expressed in percentage terms
	9	LAST_PRICE			float	Price of the last trade.
		VOLUME				float	Daily volume
		HIGH				float	Daily high
		LOW					float	Daily low
*/

	if (typeof data == 'object' && data instanceof Array && data.length) {
		if (typeof data[0] == 'object' && data[0] instanceof Array && data[0].length == 10) { // data
			const e_price = element.getElementsByClassName('card-exchange-rate');

			const e_percent_item = element.getElementsByClassName('card-exchange-percentage-item');
			const e_percent_change = element.getElementsByClassName('card-exchange-percentage-change');
			const e_percent_icon = element.getElementsByClassName('card-exchange-percentage-icon');

			var price = null;
			try {
				price = parseFloat(data[0][0]);
			} catch(e) {
				price = null;
			}
			if (price != null) {
				e_price[0].innerHTML = price.toFixed(EXCHANGE_RATE_PRICE_RESOLUTION);
			}

			var change = null;
			try {
				change = parseFloat(data[0][5]) * 100;
			} catch (e) {
				change = null;
			}
			if (change != null) {
				if (change > 0) {
					e_percent_item[0].classList.add('is-success');
					e_percent_item[0].classList.remove('is-danger');

					e_percent_icon[0].classList.add('fa-chevron-up');
					e_percent_icon[0].classList.remove('fa-chevron-down');
					e_percent_icon[0].classList.remove('fa-chevron-right');
				} else if (change < 0) {
					e_percent_item[0].classList.add('is-danger');
					e_percent_item[0].classList.remove('is-success');

					e_percent_icon[0].classList.add('fa-chevron-down');
					e_percent_icon[0].classList.remove('fa-chevron-up');
					e_percent_icon[0].classList.remove('fa-chevron-right');
				} else {
					e_percent_item[0].classList.remove('is-danger');
					e_percent_item[0].classList.remove('is-success');

					e_percent_icon[0].classList.add('fa-chevron-right');
					e_percent_icon[0].classList.remove('fa-chevron-up');
					e_percent_icon[0].classList.remove('fa-chevron-down');
				}
				if (change < 0) {
					change = change * -1;
				}
				$t = change.toFixed(EXCHANGE_RATE_PERCENT_FLOAT_RESOLUTION);
				while ( $t.length < (EXCHANGE_RATE_PERCENT_FLOAT_RESOLUTION + 1 + EXCHANGE_RATE_PERCENT_INT_RESOLUTION) ) {
					$t = '0' + $t;
				}
				e_percent_change[0].innerHTML = '&nbsp;' + $t;
			}

		} else if (typeof data[0] == 'string' && data[0] == 'hb') { // heartbeat

		}
	}

};
var __updateStat = function(element, amount, max, price) {
	const e_amount = element.getElementsByClassName('card-stat-amount');
	const e_value = element.getElementsByClassName('card-stat-value');
	const e_header = element.getElementsByClassName('card-stat-item');

	e_amount[0].innerHTML = amount
	e_value[0].innerHTML = price.toFixed(ARBITRAGE_RESOLUTION);

	if (price == max) {
		e_header[0].classList.add('is-success');
		e_header[0].classList.remove('is-danger');
	} else {
		e_header[0].classList.add('is-danger');
		e_header[0].classList.remove('is-success');
	}
};

var updateCalculations = function() {
	if (
		usd_per_btc == null ||
		usd_per_eth == null ||
		usd_per_miota == null ||
		btc_per_miota == null ||
		eth_per_miota == null
	) {
		if ($loaderButton) {
			if (__bfx.ws.readyState != 1) { // 1 == WS_OPEN
				$loaderButton.classList.add('is-danger');
				$loaderButton.classList.add('is-loading');
				$loaderButton.classList.remove('is-success');
				$loaderButtonIcon.classList.remove('fa-spin');
			}
		}
		return;
	}
	if ($loaderButton) {
		$loaderButton.classList.add('is-success');
		$loaderButton.classList.remove('is-danger');
		$loaderButton.classList.remove('is-loading');
		setTimeout(function() {
			$loaderButtonIcon.classList.add('fa-spin');
		}, 1000);
	}

	const $e_usd_to_miota = document.getElementById('usd-to-miota');
	const $e_usd_to_btc_to_miota = document.getElementById('usd-to-btc-to-miota');
	const $e_usd_to_eth_to_miota = document.getElementById('usd-to-eth-to-miota');

	var usd_to_miota = __usd_amount / usd_per_miota;
	var usd_to_btc_to_miota = __usd_amount / usd_per_btc / btc_per_miota;
	var usd_to_eth_to_miota = __usd_amount / usd_per_eth / eth_per_miota;

	var max_returns = Math.max(usd_to_miota, usd_to_btc_to_miota, usd_to_eth_to_miota);

	__updateStat($e_usd_to_miota,        __usd_amount, max_returns, usd_to_miota);
	__updateStat($e_usd_to_btc_to_miota, __usd_amount, max_returns, usd_to_btc_to_miota);
	__updateStat($e_usd_to_eth_to_miota, __usd_amount, max_returns, usd_to_eth_to_miota);
};

var bfxticker = function(pair, data){

	if (typeof data == 'object' && data instanceof Array && data.length) {
		if (typeof data[0] == 'string' && data[0] == 'hb') {
			updateCalculations();
			return;
		}
	};

	var price = null;
	try {
		price = parseFloat(data[0][0]);
	} catch(e) {
		price = null;
	}
	if (price == null) {
		return;
	}

	if (pair == "IOTUSD") {
		const $e_usdpermiota = document.getElementById('usd-per-miota');
		updateCard(pair, data, $e_usdpermiota);
		usd_per_miota = price;
	} else if (pair == "BTCUSD") {
		const $e_usdperbtc = document.getElementById('usd-per-btc');
		updateCard(pair, data, $e_usdperbtc);
		usd_per_btc = price;
	} else if (pair == "ETHUSD") {
		const $e_usdpereth = document.getElementById('usd-per-eth');
		updateCard(pair, data, $e_usdpereth);
		usd_per_eth = price;
	} else if (pair == "IOTBTC") {
		const $e_btcpermiota = document.getElementById('btc-per-miota');
		updateCard(pair, data, $e_btcpermiota);
		btc_per_miota = price;
	} else if (pair == "IOTETH") {
		const $e_ethpermiota = document.getElementById('eth-per-miota');
		updateCard(pair, data, $e_ethpermiota);
		eth_per_miota = price;
	}

	updateCalculations();
};

var __get_from_to = function(pair, amount) {
	if (pair == "IOTUSD") {
		if (amount < 0) {
			return ["IOTA", "USD"];
		}
		return ["USD", "IOTA"];
	} else if (pair == "IOTBTC") {
		if (amount < 0) {
			return ["IOTA", "BTC"];
		}
		return ["BTC", "IOTA"];
	} else if (pair == "IOTETH") {
		if (amount < 0) {
			return ["IOTA", "ETH"];
		}
		return ["ETH", "IOTA"];
	} else {
		return ["NA", "NA"];
	}
};
var __add_or_update_card = function(parent, trade, card) {
	var $cards = parent.getElementsByClassName('trade-card');
	var $placed = false;

	/*
	for (var i = 0; i < $cards.length; i++) {
		if (trade.timestamp > $cards[i].dataset.tradetimestamp) {
			parent.insertBefore(card, $cards[i]);
			$placed = true;
			continue;
		}
	}

	// if not placed card yet, append
	if ($placed == false) {
		parent.appendChild(card);
	}

	// remove extra cards
	var $cards_new = parent.getElementsByClassName('trade-card');
	for (var j = MAX_CARDS; j < $cards_new.length; j++) {
		console.log("removing cards...");
		parent.removeChild($cards_new[j]);
	};
	*/

	var $cardsarr = [].slice.call($cards);
	$cardsarr.push(card);

	$cardsarr.sort(function(a, b) {
		return b.dataset.tradetimestamp - a.dataset.tradetimestamp;
	});

	while (parent.hasChildNodes()) {
		console.log("ck_trd: ; removing; ", parent.lastChild);
		parent.removeChild(parent.lastChild);
	}

	for (var i = 0; i < $cardsarr.length && i < MAX_CARDS; i++ ) {
		parent.appendChild($cardsarr[i]);
	}
};
var addCard = function(pair, data, update = 2) {
	const $e_trades_buy = document.getElementById('trades-column-buy');
	const $e_trades_sell = document.getElementById('trades-column-sell');

	var trade = {
		id: data[0],
		timestamp: data[1],
		amount: data[2],
		price: data[3],
	};

	if (update == 0 || update == 2) {
		var card = $sampleTradeCard.cloneNode(true);
		var $e_from = card.getElementsByClassName('card-trade-currency-from')[0];
		var $e_to   = card.getElementsByClassName('card-trade-currency-to')[0];
		var $e_miota = card.getElementsByClassName('card-trade-amount-miota')[0];

		var $e_trade_price = card.getElementsByClassName('card-trade-price')[0];
		var $e_trade_price_unit = card.getElementsByClassName('card-trade-price-unit')[0];

		var $e_trade_status_icon = card.getElementsByClassName('card-trade-status-icon')[0];
		var $e_trade_status_text = card.getElementsByClassName('card-trade-status-text')[0];
		var $e_trade_timestamp_text = card.getElementsByClassName('card-trade-timestamp-text')[0];

		var $v_from_to = __get_from_to(pair, trade.amount);

		card.dataset.tradeid = trade.id;
		card.dataset.tradetimestamp = trade.timestamp;
		card.dataset.amount = trade.amount;
		card.dataset.price = trade.price;

		card.id = data[0];
		card.classList.add('trade-' + trade.id);

		/*
			SET status
			fa-circle-o-notch fa-spin
			fa-check-square
			fa-minus-circle
		*/
		$e_trade_status_icon.classList.remove('fa-circle-o-notch');
		$e_trade_status_icon.classList.remove('fa-check-square');
		$e_trade_status_icon.classList.remove('fa-minus-circle');
		$e_trade_status_icon.classList.remove('fa-spin');
		$e_trade_status_text.innerHTML = "UNKNOWN";
		if (update == 2) {
			$e_trade_status_icon.classList.add('fa-minus-circle');
			$e_trade_status_text.innerHTML = "UNKNOWN";
		} else if (update == 0) {
			$e_trade_status_icon.classList.add('fa-circle-o-notch');
			$e_trade_status_icon.classList.add('fa-spin');
			$e_trade_status_text.innerHTML = "PENDING";
		}

		/*
			set timestamp
		*/
		var timestamp = new Date(trade.timestamp);
		$e_trade_timestamp_text.innerHTML = timestamp.toString();

		/*
			SET from to
		*/
		if (trade.amount < 0) {
			$e_from.innerHTML = $v_from_to[1];
			$e_to.innerHTML = $v_from_to[0];
		} else {
			$e_from.innerHTML = $v_from_to[0];
			$e_to.innerHTML = $v_from_to[1];
		}

		/*
			SET amount
		*/
		var $v_amount = trade.amount;
		if (trade.amount < 0) {
			$v_amount = $v_amount * -1;
		}
		$e_miota.innerHTML = $v_amount.toFixed(TRADE_IOTA_RESOLUTION);

		/*
			SET price and unit
		*/
		$e_trade_price.innerHTML = trade.price.toFixed(TRADE_PRICE_RESOLUTION);
		if (trade.amount < 0) {
			$e_trade_price_unit.innerHTML = $v_from_to[1] + "/" + $v_from_to[0];
		} else {
			$e_trade_price_unit.innerHTML = $v_from_to[0] + "/" + $v_from_to[1];
		}

		card.removeAttribute("style");
		if (trade.amount < 0) {
			__add_or_update_card($e_trades_sell, trade, card);
		} else {
			__add_or_update_card($e_trades_buy, trade, card);
		}

	} else if (update == 1) {
		var $needle = null;

		if (trade.amount < 0) {
			$needle = $e_trades_sell.getElementsByClassName('trade-' + trade.id)[0];
		} else {
			$needle = $e_trades_buy.getElementsByClassName('trade-' + trade.id)[0];
		}

		if ($needle) {
			var $e_trade_status_icon = $needle.getElementsByClassName('card-trade-status-icon')[0];
			var $e_trade_status_text = $needle.getElementsByClassName('card-trade-status-text')[0];
			var $e_trade_timestamp_text = $needle.getElementsByClassName('card-trade-timestamp-text')[0];


			/* SET status */
			$e_trade_status_icon.classList.remove('fa-circle-o-notch');
			$e_trade_status_icon.classList.remove('fa-check-square');
			$e_trade_status_icon.classList.remove('fa-minus-circle');
			$e_trade_status_icon.classList.remove('fa-spin');
			$e_trade_status_text.innerHTML = "UNKNOWN";

			$e_trade_status_icon.classList.add('fa-check-square');
			$e_trade_status_text.innerHTML = "COMPLETE";

			/* SET timestamp */
			var timestamp = new Date(trade.timestamp);
			$e_trade_timestamp_text.innerHTML = timestamp.toString();
		} // needle found
	} // update == 1 (TU)
};
var bfxtrade = function(pair, data){
	console.log("ck_trd: ", pair, data);

	if (!$sampleTradeCard) { // ???
		return;
	}

	if (typeof data == 'object' && data instanceof Array && data.length) {
		if (typeof data[0] == 'string' && data[0] == 'hb') {
			return;
		}
		if (typeof data[0] == 'string' && data[0] == 'te') {
			addCard(pair, data[1], 0);
			return;
		}
		if (typeof data[0] == 'string' && data[0] == 'tu') {
			addCard(pair, data[1], 1);
			return;
		}
		if (typeof data[0] == 'object' && data[0] instanceof Array) {
			for (var i = 0; i < MAX_CARDS && i < data[0].length; i++) {
				addCard(pair, data[0][i], 2);
			}
		}
	};
};

var bfxsetusd = function() {
	if ($userInputUSD.value == '') {
		return;
	}

	if ($userInputUSD.value < 1) {
		$userInputUSD.value = 1;
	}

	__usd_amount = $userInputUSD.value;
	updateCalculations();
}

document.addEventListener('DOMContentLoaded', () => {

	const supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;

	if (!supportsWebSockets) {
		return;
	}

	// remove nowebsockets modal
	const $nowebsocketsmodal = document.getElementById('no-websockets-modal');
	$nowebsocketsmodal.classList.remove('is-active');

	$loaderButton = document.getElementById('navbar-loader-button');
	$loaderButtonIcon = document.getElementById('navbar-loader-button-icon');
	if ($loaderButton) {
		$loaderButton.classList.add('is-danger');
	}

	$t = document.getElementById('sample-trade-card');
	if ($t) {
		$sampleTradeCard = $t.getElementsByTagName("tr")[0];
	}

	$userInputUSD = document.getElementById('navbar-amount-input');
	if ($userInputUSD) {
		$userInputUSD.onchange = bfxsetusd;
		$userInputUSD.onkeyup = bfxsetusd;
	}

	__bfx = new BFX();
	__bfx.on('open', bfxopen); // .on('open')
	__bfx.on('close', bfxclose); // .on('close')
	__bfx.on('error', bfxerror); // .on('error')
	__bfx.on('ticker', bfxticker);
	__bfx.on('trade', bfxtrade);

	__bfx.open();
});

window.onbeforeunload = function(){
	__bfx.destroy();
};