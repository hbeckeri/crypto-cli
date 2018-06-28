const Exchange = require('../Exchange');
const axios = require('axios');
const ERC20Wallet = require('./ERC20Wallet');
const EthereumWallet = require('./EthereumWallet');

class BancorWallet extends Exchange {
	static get apiClient() {
		return axios.create({ baseURL: 'https://api.bancor.network/0.1' });
	}

	static async buy({ amount }) {
		const defaultAmount = await this.sellBalance();
		const sellCurrency = await this.fetchCurrency(this.symbol);
		const buyCurrency = await this.fetchCurrency(this.exchangeSymbol);

		const payload = {
			amount: amount || defaultAmount,
			fromId: sellCurrency._id,
			toId: buyCurrency._id
		};

		const discovery = await this.apiClient.get(
			`/currencies/${payload.fromId}/value?toCurrencyId=${payload.toId}&toAmount=${payload.amount}`
		);

		return discovery.data;
	}

	static async bid() {
		const response = await this.apiClient.get(
			`/currencies/${this.symbol}/ticker?fromCurrencyCode=${this.exchangeSymbol}`
		);

		if (response.data.errorCode) {
			return response.data;
		}

		return response.data.data.price;
	}

	static async ask() {
		return this.bid();
	}

	static async walletBalance() {
		return this.sellBalance();
	}

	static async sellBalance() {
		const Wallet = await this.fetchWallet(this.symbol);

		return Wallet.walletBalance();
	}

	static async buyBalance() {
		const Wallet = await this.fetchWallet(this.exchangeSymbol);

		return Wallet.walletBalance();
	}

	static async fetchWallet(symbol) {
		const Wallet = symbol === 'ETH' ? EthereumWallet : ERC20Wallet;
		const currency = await this.fetchCurrency(symbol);

		class AWallet extends Wallet {
			static get contractAddress() {
				return currency.details.contractAddress;
			}

			static get symbol() {
				return symbol;
			}
		}

		return AWallet;
	}

	static async fetchCurrency(symbol) {
		const response = await this.apiClient.get(`/currencies?limit=100`);

		if (response.data.errorCode) {
			return response.data;
		}

		return response.data.data.currencies.page.find(e => e.code === symbol);
	}
}

module.exports = BancorWallet;
