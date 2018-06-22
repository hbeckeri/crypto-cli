const Exchange = require('./Exchange');
const BigNumber = require('bignumber.js');
const ccxt = require('ccxt');

class CCXTWallet extends Exchange {
	static get exchange() {
		if (!this._exchange) {
			this._exchange = new ccxt[this.exchangeName](this.exchangeParams);
		}

		return this._exchange;
	}

	static get exchangeName() {
		throw new Error('You must implement `exchangeName`');
	}

	static get exchangeParams() {
		throw new Error('You must implement `exchangeParams`');
	}

	static async withdraw({ amount, address }) {
		const balance = await this.walletBalance();
		return await this.exchange.withdraw(this.symbol, amount || balance, address);
	}

	static async depositAddress() {
		const response = await this.exchange.fetchDepositAddress(this.symbol);

		return response.address;
	}

	static async buyLimit(amount, price, params = {}) {
		const result = await this.exchange.createLimitBuyOrder(
			this.tradingSymbol,
			amount || defaultAmount,
			price || defaultPrice,
			params
		);

		return result;
	}

	static async sellLimit(amount, price, params = {}) {
		const result = await this.exchange.createLimitSellOrder(
			this.tradingSymbol,
			amount || defaultAmount,
			price || defaultPrice,
			params
		);

		return result;
	}

	static async bid() {
		const response = await this.exchange.fetchTicker(this.tradingSymbol);

		return response.bid;
	}

	static async ask() {
		const response = await this.exchange.fetchTicker(this.tradingSymbol);

		return response.ask;
	}

	static async walletBalance() {
		const response = await this.exchange.fetchBalance();

		return response[this.tradingPair[0]];
	}

	static async buyBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber((response[this.tradingPair[1]] || { free: 0 }).free.toString()).toFixed(8);
	}

	static async sellBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber((response[this.tradingPair[0]] || { free: 0 }).free.toString()).toFixed(8);
	}

	static async portfolio() {
		const response = await this.exchange.fetchBalance();

		const payload = {};
		const totals = Object.keys(response.total).forEach(key => {
			if (response.total[key]) {
				payload[key] = response.total[key];
			}
		});

		return payload;
	}

	static async _openOrders() {
		const result = await this.exchange.fetchOpenOrders();

		return result;
	}

	static async _closedOrders() {
		const result = await this.exchange.fetchClosedOrders();

		return result;
	}

	static async cancelOrder({ order }) {
		const result = await this.exchange.cancelOrder(order);

		return result;
	}
}

module.exports = CCXTWallet;
