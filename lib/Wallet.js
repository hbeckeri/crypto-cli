const BaseModel = require('./BaseModel');
const bitcoreMnemonic = require('bitcore-mnemonic');

class Wallet extends BaseModel {
	static async seed() {
		return new bitcoreMnemonic().toString();
	}

	static get type() {
		return 'wallet';
	}

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

		let amount = args.amount;

		if (amount === 'all') {
			const balance = await this.walletBalance();
			amount = balance;
		}

		if (!amount) {
			console.log(`You must specify 'amount' (ex --amount all)`);
			process.exit();
		}

		console.log(`You are sending ${amount} ${this.symbol} to ${args.address}`);

		await this.prompt();
		return await this.withdraw(Object.assign({}, args, { amount }));
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

	static async transactions() {
		throw new Error('You must implement `transactions`');
	}
}

module.exports = Wallet;
