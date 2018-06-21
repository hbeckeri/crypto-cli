const CCXTWallet = require('../CCXTWallet');

class HitBTCWallet extends CCXTWallet {
	static get exchangeName() {
		return 'hitbtc';
	}

	static get exchangeParams() {
		return {
			apiKey: process.env.HITBTC_API_KEY,
			secret: process.env.HITBTC_API_SECRET
		};
	}
}

module.exports = HitBTCWallet;
