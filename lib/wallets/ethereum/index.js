const Wallet = require('../../Wallet');
const ethers = require('ethers');
const prompt = require('prompt-async');

const ethWallet = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC_PHRASE);
ethWallet.provider = ethers.providers.getDefaultProvider();

class EthereumWallet extends Wallet {
	static get wallet() {
		return ethWallet;
	}

	static get symbol() {
		return 'ETH';
	}

	static async walletBalance() {
		const result = await this.wallet.getBalance();

		return ethers.utils.formatEther(result);
	}

	static async withdraw(amount, address) {
		const transaction = {
			to: address,
			value: ethers.utils.parseEther(amount),
		};

		const gasLimit = await this.wallet.estimateGas(transaction);
		transaction.gasLimit = gasLimit;

		console.log(Object.assign({}, transaction, {
			value: ethers.utils.formatEther(transaction.value),
			gasLimit: transaction.gasLimit.toString()
		}));

		prompt.start();

		const { shouldRun } = await prompt.get(['shouldRun']);

		if (shouldRun !== 'yes') {
			return 'aborted operation';
		}

		const result = await this.wallet.sendTransaction(transaction);

		return result;
	}

	static depositAddress() {
		return this.wallet.address;
	}
}

module.exports = EthereumWallet;
