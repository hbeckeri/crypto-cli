const Wallet = require('../../Wallet');
const bitcore = require('bitcore-lib');
const bitcoreMnemonic = require('bitcore-mnemonic');
const axios = require('axios');

class BitcoinWallet extends Wallet {
	static get symbol() {
		return 'BTC';
	}

	static async walletBalance() {
		const address = await this.depositAddress();
		const result = await axios.get(`https://blockchain.info/rawaddr/${address}`);

		return bitcore.Unit.fromSatoshis(result.data.final_balance).toBTC();
	}

	static async depositAddress() {
		const xpriv = new bitcoreMnemonic(process.env.MNEMONIC_PHRASE)
			.toHDPrivateKey()
			.derive("m/44'/0'/0'/0/0");

		return xpriv.publicKey.toAddress().toString();
	}
}

module.exports = BitcoinWallet;
