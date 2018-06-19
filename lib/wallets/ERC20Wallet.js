const EthereumWallet = require('./EthereumWallet');
const truffleContract = require('truffle-contract');
const truffleProvider = require('truffle-provider');
const fs = require('fs');
const BigNumber = require('bignumber.js');

const abi = fs.readFileSync(__dirname + '/ERC20/contracts/ERC20Basic.abi').toString();
const Contract = truffleContract({ abi, unlinked_binary: '' });
const truffleConfig = require('../utils/truffle').networks[process.env.ETHEREUM_NETWORK];
Contract.setProvider(truffleProvider.create(truffleConfig));

class ERC20Wallet extends EthereumWallet {
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

module.exports = ERC20Wallet;
