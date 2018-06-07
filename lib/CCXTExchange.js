const Exchange = require('./Exchange');
const BigNumber = require('bignumber.js');

class CCXTExchange extends Exchange {
	static get exchange() {
		throw new Error('You must implement `exchange`');
	}

	static async buyLimit(amount, price, params = {}) {
		const result = await this.exchange.createLimitBuyOrder(this.symbol, amount || defaultAmount, price || defaultPrice, params);

		return result;
	}

	static async sellLimit(amount, price, params = {}) {
		const result = await this.exchange.createLimitSellOrder(this.symbol, amount || defaultAmount, price || defaultPrice, params);

		return result;
	}

	static async bid() {
		const response = await this.exchange.fetchTicker(this.symbol);

		return response.info.bid;
	}

	static async ask() {
		const response = await this.exchange.fetchTicker(this.symbol);

		return response.info.ask;
	}

	static async buyBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber(response[this.tradingPair[1]].free.toString()).toFixed(8);
	}

	static async sellBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber(response[this.tradingPair[0]].free.toString()).toFixed(8);
	}

	static async withdraw({ amount, address }) {
		if (!address) {
			throw new Error('You must specify `address`');
		}

		const balance = await this.sellBalance();
		const result = await this.exchange.withdraw(this.tradingPair[0], amount || balance, address);

		return result;
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

module.exports = CCXTExchange;
