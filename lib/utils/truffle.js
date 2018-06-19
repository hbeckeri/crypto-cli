const HDWalletProvider = require('truffle-hdwallet-provider');
const ethUnit = require('ethjs-unit');

module.exports = {
	networks: {
		rinkeby: {
			provider: function() {
				return new HDWalletProvider(
					process.env.MNEMONIC_PHRASE,
					'https://rinkeby.infura.io/01dJIr88UVq6pLzueOSW'
				);
			},
			network_id: '4',
			gasPrice: ethUnit.toWei(0.1, 'gwei')
		},
		mainnet: {
			provider: function() {
				return new HDWalletProvider(
					process.env.MNEMONIC_PHRASE,
					'https://mainnet.infura.io/01dJIr88UVq6pLzueOSW'
				);
			},
			network_id: '1',
			gasPrice: ethUnit.toWei(0.1, 'gwei')
		}
	}
};
