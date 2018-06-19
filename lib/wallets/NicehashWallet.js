const Wallet = require('../Wallet');
const NiceHashClient = require('nicehash');
const nh = new NiceHashClient({
	apiId: process.env.NICEHASH_APP_ID,
	apiKey: process.env.NICEHASH_API_KEY
});

class NicehashWallet extends Wallet {
	static get wallet() {
		return nh;
	}

	static get symbol() {
		return 'BTC';
	}

	static async walletBalance() {
		const result = await this.wallet.getMyBalance();

		return result.body.result.balance_confirmed;
	}

	static async depositAddress() {
		return process.env.NICEHASH_DEPOSIT_ADDRESS;
	}
}

module.exports = NicehashWallet;
