const CCXTWallet = require('../CCXTWallet');

class CoinbaseWallet extends CCXTWallet {
	static get exchangeName() {
		return 'coinbase';
	}

	static get exchangeParams() {
		return {
			apiKey: process.env.COINBASE_API_KEY,
			secret: process.env.COINBASE_API_SECRET
		};
	}
}

module.exports = CoinbaseWallet;
