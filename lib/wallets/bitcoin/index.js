const Wallet = require('../../Wallet');
const bitcore = require('bitcore-lib');
const bitcoreMnemonic = require('bitcore-mnemonic');
const axios = require('axios');

class BitcoinWallet extends Wallet {
	static get privateKey() {
		return new bitcoreMnemonic(process.env.MNEMONIC_PHRASE)
			.toHDPrivateKey()
			.derive("m/44'/0'/0'/0/0");
	}

	static get symbol() {
		return 'BTC';
	}

	static async withdraw({ amount, address }) {
		const depositAddress = await this.depositAddress();
		const response = await axios.get(`https://blockchain.info/unspent?active=${depositAddress}`);
		const utxos = response.data.unspent_outputs.map(each => {
			return {
				txId: each.tx_hash,
				outputIndex: each.tx_output_n,
				address: depositAddress,
				script: each.script,
				satoshis: each.value
			};
		});

		const transaction = new bitcore.Transaction()
			.from(utxos)
			.to(address, bitcore.Unit.fromBTC(amount).toSatoshis())
			.sign(this.privateKey.privateKey);

		return JSON.stringify(transaction.toObject(), null, 2);
	}

	static async walletBalance() {
		const address = await this.depositAddress();
		const result = await axios.get(`https://blockchain.info/rawaddr/${address}`);

		return bitcore.Unit.fromSatoshis(result.data.final_balance).toBTC();
	}

	static async depositAddress() {
		return this.privateKey.publicKey.toAddress().toString();
	}
}

module.exports = BitcoinWallet;
