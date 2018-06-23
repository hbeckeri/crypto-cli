const GdaxWallet = require('./GdaxWallet');

class CoinbaseProWallet extends GdaxWallet {
	static get exchangeName() {
		return 'coinbasepro';
	}
}

module.exports = CoinbaseProWallet;
