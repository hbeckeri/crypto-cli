class Exchange {
	static get tradingPair() {
		throw new Error('You must implement `tradingPair`');
	}

	static buy(ammount, price) {
		throw new Error('You must implement `buy`');
	}

	static sell(ammount, price) {
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

	static get deposit() {
		throw new Error('You must implement `deposit`');
	}

	static get withdraw() {
		throw new Error('You must implement `deposit`');
	}

	static get depositAddress() {
		throw new Error('You must implement `depositAddress`');
	}
}

module.exports = Exchange;
