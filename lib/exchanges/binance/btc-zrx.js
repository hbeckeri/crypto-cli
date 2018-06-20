const BinanceExchange = require('./index');

class BinanceBtcZrxExchange extends BinanceExchange {
	static get tradingPair() {
		return ['BTC', 'ZRX'];
	}
}

module.exports = BinanceBtcZrxExchange;
