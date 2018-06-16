const EthereumWallet = require('./index');
const truffleContract = require('truffle-contract');
const truffleProvider = require('truffle-provider');
const fs = require('fs');
const BigNumber = require('bignumber.js');
const prompt = require('prompt-async');

const abi = fs.readFileSync(__dirname + '/contracts/ERC20Basic.abi').toString();
const Contract = truffleContract({ abi, unlinked_binary: '' });
const truffleConfig = require('./truffle').networks[process.env.ETHEREUM_NETWORK];
Contract.setProvider(truffleProvider.create(truffleConfig));

class Erc20Wallet extends EthereumWallet {
	static get contractAddress() {
		throw new Error(`you must implement 'contractAddress'`);
	}

	static get symbol() {
		throw new Error(`you must implement 'symbol'`);
	}

	static async contract() {
		return await Contract.at(this.contractAddress);
	}

	static async decimals() {
		const instance = await this.contract();

		return await instance.decimals();
	}

	static async withdraw({ amount, address, gasPrice, gasLimit }) {
		const depositAddress = await this.depositAddress();
		const instance = await this.contract();
		const decimals = await this.decimals();
		const value = new BigNumber(amount)
			.times(new BigNumber(10).pow(decimals.toNumber()))
			.toString();

		console.log(
			`You are sending ${amount} ${
				this.symbol
			} to ${address}\nAre you sure you want to proceed?\nType 'yes' to continue\n`
		);

		const { run } = await prompt.get(['run']);

		if (run !== 'yes') {
			return console.log('Aborted withdraw');
		}

		return await instance.transfer(address, value.toString(), {
			from: Contract.web3.currentProvider.provider.addresses[0],
			gasPrice,
			gasLimit
		});
	}

	static async walletBalance() {
		const address = await this.depositAddress();
		const instance = await this.contract();
		const decimals = await this.decimals();
		const balance = await instance.balanceOf(address);

		return balance.dividedBy(new BigNumber(10).exponentiatedBy(decimals.toNumber())).toFormat(2);
	}
}

module.exports = Erc20Wallet;
