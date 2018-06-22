const CCXTWallet = require('../CCXTWallet');

class CoinbaseProWallet extends CCXTWallet {
	static get exchangeName() {
		return 'coinbasepro';
	}

	static get exchangeParams() {
		return {
			apiKey: process.env.GDAX_API_KEY,
			secret: process.env.GDAX_API_SECRET,
			password: process.env.GDAX_API_PASSPHRASE
		};
	}

	static async depositAddress() {
		throw new Error('You must implement `depositAddress`');
	}
}

module.exports = CoinbaseProWallet;
