const CCXTWallet = require('../CCXTWallet');

class GdaxWallet extends CCXTWallet {
	static get exchangeName() {
		return 'gdax';
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

	static async getCoinbaseAccount() {
		return account;
	}

	static async deposit({ amount }) {
		const Gdax = require('gdax');
		const client = new Gdax.AuthenticatedClient(
			process.env.GDAX_API_KEY,
			process.env.GDAX_API_SECRET,
			process.env.GDAX_API_PASSPHRASE
		);

		const accounts = await client.getCoinbaseAccounts();
		const account = accounts.find(each => each.currency === this.tradingPair[0]);

		const payload = {
			coinbase_account_id: account.id,
			currency: account.currency,
			amount: amount || account.balance
		};

		try {
			const response = await client.deposit(payload);

			return response.data;
		} catch (e) {
			return e.data;
		}
	}
}

module.exports = GdaxWallet;
