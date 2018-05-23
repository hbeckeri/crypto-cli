const Exchange = require('./Exchange');
const BigNumber = require('bignumber.js');

class CCXTExchange extends Exchange {
	static get exchange() {
		throw new Error('You must implement `exchange`');
	}

	static get symbol() {
		return this.tradingPair.join('/');
	}

	static async buy(amount, price, params = {}) {
		const defaultAmount = await this.buyBalance();
		const defaultPrice = await this.bid();

		if (parseFloat(price) > parseFloat(defaultPrice)) {
			return 'Your buy price is larger than the current bid price';
		}

		const result = await this.buyLimit(amount || defaultAmount, price || defaultPrice, params);

		return result;
	}

	static async buyLimit(amount, price, params = {}) {
		const result = await this.exchange.createLimitBuyOrder(this.symbol, amount || defaultAmount, price || defaultPrice, params);

		return result;
	}

	static async sell(amount, price, params = {}) {
		const defaultAmount = await this.sellBalance();
		const defaultPrice = await this.ask();

		if (parseFloat(price) < parseFloat(defaultPrice)) {
			return 'Your sell price is less than the current ask price';
		}

		const result = await this.sellLimit(amount || defaultAmount, price || defaultPrice, params);

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

	static cancelAllOrders() {
		throw new Error('You must implement `cancelAllOrders`');
	}

	static async buyBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber(response[this.tradingPair[1]].free.toString()).toFixed(8);
	}

	static async sellBalance() {
		const response = await this.exchange.fetchBalance();

		return BigNumber(response[this.tradingPair[0]].free.toString()).toFixed(8);
	}

	static get deposit() {
		throw new Error('You must implement `deposit`');
	}

	static async withdraw(amount, address) {
		if (!address) {
			throw new Error('You must specify `address`');
		}

		const balance = await this.sellBalance();
		const result = await this.exchange.withdraw(this.tradingPair[0], amount || balance, address);

		return result;
	}

	static async depositAddress() {
		throw new Error('You must implement `depositAddress`');
	}

	static async openOrders() {
		const result = await this.exchange.fetchOpenOrders();

		return result;
	}

	static async closedOrders() {
		const result = await this.exchange.fetchClosedOrders();

		return result;
	}

	static async cancelOrder(orderId) {
		const result = await this.exchange.cancelOrder(orderId);

		return result;
	}
}

module.exports = CCXTExchange;
