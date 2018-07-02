const CCXTWallet = require('../CCXTWallet');

class BinanceWallet extends CCXTWallet {
	static get exchangeName() {
		return 'binance';
	}

	static get exchangeParams() {
		return {
			apiKey: process.env.BINANCE_API_KEY,
			secret: process.env.BINANCE_API_SECRET
		};
	}

	static async _openOrders() {
		const result = await this.exchange.fetchOpenOrders(this.tradingSymbol);

		return result.filter(e => e.symbol === this.tradingSymbol);
	}

	static async _closedOrders() {
		const result = await this.exchange.fetchClosedOrders(this.tradingSymbol);

		return result.filter(e => e.symbol === this.tradingSymbol);
	}

	static async cancelOrder({ order }) {
		const result = await this.exchange.cancelOrder(order, this.tradingSymbol);

		return result;
	}
}

module.exports = BinanceWallet;
