const Wallet = require('./Wallet');

class Exchange extends Wallet {
	static get tradingPair() {
		throw new Error('You must implement `tradingPair`');
	}

	static buy(amount, price) {
		throw new Error('You must implement `buy`');
	}

	static sell(amount, price) {
		throw new Error('You must implement `sell`');
	}

	static get bid() {
		throw new Error('You must implement `bid`');
	}

	static get ask() {
		throw new Error('You must implement `ask`');
	}

	static cancelAllOrders() {
		throw new Error('You must implement `cancelAllOrders`');
	}

	static async buyBalance() {
		throw new Error('You must implement `buyBalance`.');
	}

	static get sellBalance() {
		throw new Error('You must implement `sellBalance`');
	}
}

module.exports = Exchange;
