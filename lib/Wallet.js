class Wallet {
	static get symbol() {
		throw new Error('You must implement `symbol`');
	}

	static async balance() {
		const balance = await this.walletBalance();

		return { [this.symbol]: balance };
	}

	static async walletBalance() {
		throw new Error('You must implement `walletBalance`');
	}

	static async withdraw() {
		throw new Error('You must implement `withdraw`');
	}

	static async depositAddress() {
		throw new Error('You must implement `depositAddress`');
	}
}

module.exports = Wallet;
