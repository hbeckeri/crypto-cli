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
}

module.exports = GdaxWallet;

/*
const Gdax = require('gdax');
const ccxt = require('ccxt');
const CCXTExchange = require('../../CCXTExchange');
const BigNumber = require('bignumber.js');

const ExchangeClient = new ccxt.gdax({
	apiKey: process.env.GDAX_API_KEY,
	secret: process.env.GDAX_API_SECRET,
	password: process.env.GDAX_API_PASSPHRASE
});

const client = new Gdax.AuthenticatedClient(
	process.env.GDAX_API_KEY,
	process.env.GDAX_API_SECRET,
	process.env.GDAX_API_PASSPHRASE
);

class GdaxExchange extends CCXTExchange {
	static get exchange() {
		return ExchangeClient;
	}

	static async cancelAllOrders() {
		const response = await this.exchange.privateDeleteOrders();

		return response;
	}

	static async getCoinbaseAccount() {
		const accounts = await client.getCoinbaseAccounts();
		const account = accounts.find(each => each.currency === this.tradingPair[0]);

		return account;
	}

	static async deposit({ amount }) {
		const account = await this.getCoinbaseAccount();
		const payload = {
			coinbase_account_id: account.id,
			currency: account.currency,
			amount: amount || account.balance
		};
		const response = await client.deposit(payload);

		return response;
	}
}

module.exports = GdaxExchange;
*/
