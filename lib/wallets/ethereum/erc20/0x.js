const Erc20Wallet = require('../erc20');

class Nobs extends Erc20Wallet {
	static get contractAddress() {
		return '0xE41d2489571d322189246DaFA5ebDe1F4699F498';
	}

	static get symbol() {
		return '0x';
	}
}

module.exports = Nobs;
