const BitmexExchange = require('./index');

class BitmexXbtUsdExchange extends BitmexExchange {
	static get tradingPair() {
		return ['BTC', 'USD'];
	}
}

module.exports = BitmexXbtUsdExchange;
