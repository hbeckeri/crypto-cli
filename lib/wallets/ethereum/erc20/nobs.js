const Erc20Wallet = require('../erc20');

class Nobs extends Erc20Wallet {
	static get contractAddress() {
		return '0xF4FaEa455575354d2699BC209B0a65CA99F69982';
	}

	static get symbol() {
		return 'NOBS';
	}
}

module.exports = Nobs;
