const BinanceExchange = require('./index');

class BinanceBtcUsdtExchange extends BinanceExchange {
	static get tradingPair() {
		return ['BTC', 'USDT'];
	}
}

module.exports = BinanceBtcUsdtExchange;
