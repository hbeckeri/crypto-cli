const ERC20Wallet = require('./ERC20Wallet');

class DAIWallet extends ERC20Wallet {
	static get contractAddress() {
		return '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';
	}

	static get symbol() {
		return 'DAI';
	}
}

module.exports = DAIWallet;
