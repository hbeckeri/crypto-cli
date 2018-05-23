const GdaxExchange = require('./index');

class GdaxEthUsdExchange extends GdaxExchange {
	static get tradingPair() {
		return ['ETH', 'USD'];
	}
}

module.exports = GdaxEthUsdExchange;
