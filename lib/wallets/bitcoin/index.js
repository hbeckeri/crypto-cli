const Wallet = require('../../Wallet');
const Mnemonic = require('bitcore-mnemonic');
const bitcore = require('bitcore-lib');


class BitcoinWallet extends Wallet{
	static get symbol() {
		return 'BTC';
	}

	static async walletBalance() {
		throw new Error('You must implement `walletBalance`');
	}

	static async withdraw() {
		throw new Error('You must implement `withdraw`');
	}

	static async depositAddress() {
		const privateKey = new bitcore.HDPrivateKey(new Mnemonic(process.env.MNEMONIC_PHRASE).toHDPrivateKey());
		const publicKey = new bitcore.PublicKey(privateKey.publicKey);

		// return Object.keys(publicKey);
		return '12hwdYayfLRRdoat8RWjzLZs7uqNgCdh4y';
	}
}

module.exports = BitcoinWallet;
