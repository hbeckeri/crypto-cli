const GdaxExchange = require('./index');

class GdaxLtcUsdExchange extends GdaxExchange {
	static get tradingPair() {
		return ['LTC', 'USD'];
	}
}

module.exports = GdaxLtcUsdExchange;
