const ERC20Wallet = require('./ERC20Wallet');

class SCHBWallet extends ERC20Wallet {
	static get contractAddress() {
		return '0xbcc2a3034f5b29875bb72cc26a03be082ee28361';
	}

	static get symbol() {
		return 'SCHB';
	}
}

module.exports = SCHBWallet;
