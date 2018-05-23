const GdaxExchange = require('./index');

class GdaxBchUsdExchange extends GdaxExchange {
	static get tradingPair() {
		return ['BCH', 'USD'];
	}
}

module.exports = GdaxBchUsdExchange;
