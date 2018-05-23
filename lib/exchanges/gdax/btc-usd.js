const GdaxExchange = require('./index');

class GdaxBtcUsdExchange extends GdaxExchange {
	static get tradingPair() {
		return ['BTC', 'USD'];
	}
}

module.exports = GdaxBtcUsdExchange;
