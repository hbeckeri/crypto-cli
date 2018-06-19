const Wallet = require('../Wallet');
const ethers = require('ethers');
const fs = require('fs');
const solc = require('solc');

const ethWallet = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC_PHRASE);
ethWallet.provider = ethers.providers.getDefaultProvider(process.env.ETHEREUM_NETWORK);

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

	static async withdraw({ amount, address, gasPrice }) {
		const transaction = {
			to: address,
			value: ethers.utils.parseEther(amount)
		};

		const gasLimit = await this.wallet.estimateGas(transaction);
		transaction.gasLimit = gasLimit;
		transaction.gasPrice = gasPrice;

		return await this.wallet.sendTransaction(transaction);
	}

	static depositAddress() {
		return this.wallet.address;
	}

	static async compile(args) {
		function findImports(p) {
			return { contents: fs.readFileSync(p).toString() };
		}

		const contract = fs.readFileSync(args.contract).toString();
		const input = { 'contract.sol': contract };

		const output = solc.compile({ sources: input }, 1, findImports);

		console.log(JSON.stringify(output.errors, null, 2));

		const key = Object.keys(output.contracts).find(k => k.includes('contract.sol'));
		const abi = output.contracts[key].interface;
		const bytecode = output.contracts[key].bytecode;
		const name = key.split(':')[1];

		fs.writeFileSync(`${name}.abi`, abi);
		console.log(`wrote ${name}.abi`);

		fs.writeFileSync(`${name}.bytecode`, bytecode);
		console.log(`wrote ${name}.bytecode`);
	}

	static async deploy(args) {
		const abi = fs.readFileSync(args.abi).toString();
		const bytecode = `0x${fs.readFileSync(args.bytecode).toString()}`;

		const transaction = ethers.Contract.getDeployTransaction(bytecode, abi);
		Object.assign(transaction, { gasPrice: args.gasPrice, gasLimit: args.gasLimit });

		console.log(
			`Deploying this contract could cost up to ${ethers.utils.formatEther(
				ethers.utils.bigNumberify(transaction.gasLimit).mul(transaction.gasPrice)
			)} ETH.\nAre you sure you want to proceed?\nType 'yes' to continue\n`
		);

		await this.prompt();

		const deployedContract = await this.wallet.sendTransaction(transaction);
		console.log('Contract Submitted. Transaction Hash', deployedContract.hash);

		const response = await deployedContract.wait();
		console.log(
			'Contract Mined.',
			`https://${
				process.env.ETHEREUM_NETWORK ? process.env.ETHEREUM_NETWORK + '.' : ''
			}etherscan.io/tx/${response.hash}`
		);
	}
}

module.exports = EthereumWallet;
