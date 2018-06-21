const BaseModel = require('./BaseModel');

class Wallet extends BaseModel {
	static async address() {
		const address = await this.depositAddress();

		return address;
	}

	static async balance() {
		const balance = await this.walletBalance();

		return { [this.symbol]: balance };
	}

	static async send(args) {
		if (!args.address) {
			console.log(
				`You must specify 'address' (ex --address 0x9BAecdA8EcDbE009cdd951a6a7CF6BD384003E52)`
			);
			process.exit();
		}

		console.log(`You are sending ${args.amount} ${this.symbol} to ${args.address}`);

		await this.prompt();
		return await this.withdraw(args);
	}

	static parseArgs(args) {
		return args;
	}

	static get symbol() {
		throw new Error('You must implement `symbol`');
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
