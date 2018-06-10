const Wallet = require('../../Wallet');
const bitcore = require('bitcore-lib');
const axios = require('axios');

class BitcoinWallet extends Wallet{
	static get symbol() {
		return 'BTC';
	}

	static async walletBalance() {
		const address = await this.depositAddress();
		const result = await axios.get(`https://blockchain.info/rawaddr/${address}`);

		return bitcore.Unit.fromSatoshis(result.data.final_balance).toBTC();
	}

	static async withdraw() {
		throw new Error('You must implement `withdraw`');
	}

	static async depositAddress() {
		const privateKey = new bitcore.PrivateKey(process.env.BITCOIN_PRIVATE_KEY);
		const publicKey = new bitcore.PublicKey(privateKey.publicKey);

		return publicKey.toAddress().toString();
	}
}

module.exports = BitcoinWallet;
