const CCXTWallet = require('../CCXTWallet');

class BinanceWallet extends CCXTWallet {
	static get exchangeName() {
		return 'binance';
	}

	static get exchangeParams() {
		return {
			apiKey: process.env.BINANCE_API_KEY,
			secret: process.env.BINANCE_API_SECRET
		};
	}
}

module.exports = BinanceWallet;
