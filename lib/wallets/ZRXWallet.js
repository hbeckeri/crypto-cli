const ERC20Wallet = require('./ERC20Wallet');

class ZRXWallet extends ERC20Wallet {
	static get contractAddress() {
		return '0xE41d2489571d322189246DaFA5ebDe1F4699F498';
	}

	static get symbol() {
		return 'ZRX';
	}
}

module.exports = ZRXWallet;
