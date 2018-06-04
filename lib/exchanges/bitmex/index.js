const CCXTExchange = require('../../CCXTExchange');
const ccxt = require('ccxt');
const BigNumber = require('bignumber.js');
const prompt = require('prompt-async');
const uuid = require('uuid/v1');

const ExchangeClient = new ccxt.bitmex({
	apiKey:
		process.env.BITMEX_TESTNET_ENABLED === 'true'
			? process.env.BITMEX_TESTNET_API_KEY
			: process.env.BITMEX_API_KEY,
	secret:
		process.env.BITMEX_TESTNET_ENABLED === 'true'
			? process.env.BITMEX_TESTNET_API_SECRET
			: process.env.BITMEX_API_SECRET,
	setSandboxMode: true
});

if (process.env.BITMEX_TESTNET_ENABLED === 'true') {
	ExchangeClient.urls['api'] = ExchangeClient.urls['test'];
}

class BitmexExchange extends CCXTExchange {
	static get exchange() {
		return ExchangeClient;
	}

	static get symbol() {
		return this.tradingPair.join('/');
	}

	static async executeBuy(size, params = {}) {
		return this.exchange.privatePostOrder(
			Object.assign({ symbol: 'XBTUSD', orderQty: size }, params)
		);
	}

	static async executeSell(size, params = {}) {
		if (size > 0) {
			size = size * -1;
		}

		return this.exchange.privatePostOrder(
			Object.assign({ symbol: 'XBTUSD', orderQty: size }, params)
		);
	}

	static async stopMarket(size, stopPx, params) {
		return this.executeBuy(size, Object.assign({ stopPx }, params));
	}

	static async stopLimit(size, price, stopPx, params) {
		return this.executeBuy(size, Object.assign({ stopPx, price }, params));
	}

	static async cancelAllOrders() {
		return this.exchange.privatePostOrderCancelAllAfter({ timeout: 1 });
	}

	static async buyBalance() {
		const response = await this.exchange.privateGetPosition();

		return response[0].currentQty;
	}

	static async leverage() {
		const response = await this.exchange.privateGetPosition();

		return response[0].leverage;
	}

	static async bid() {
		const response = await this.exchange.loadMarkets();

		return response[this.symbol].info.bidPrice;
	}

	static async ask() {
		const response = await this.exchange.loadMarkets();

		return response[this.symbol].info.askPrice;
	}

	static async autoLong(price, size, risk, reward) {
		const leverage = await this.leverage();
		let balance = await this.sellBalance();
		balance = parseFloat(balance).toFixed(15);
		const bid = await this.bid();

		if (parseFloat(price) < parseFloat(bid)) {
			return 'Your trigger price is less than the current bid price';
		}

		const baseCost = BigNumber(size)
			.dividedBy(price)
			.dividedBy(leverage);

		const exitPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(reward).dividedBy(leverage)))
			.toFixed(0);
		const stopPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(-risk).dividedBy(leverage)))
			.toFixed(0);

		const gain = BigNumber(size).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(size).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		const data = {
			contracts: size,
			leverage,
			balance,
			baseCost: baseCost.toFixed(10),
			entryPrice: price,
			profit: {
				balance: BigNumber(balance)
					.plus(gain)
					.toFixed(6),
				price: exitPrice,
				change: `${gain} (${reward * 100}%)`
			},
			loss: {
				balance: BigNumber(balance)
					.plus(loss)
					.toFixed(6),
				price: stopPrice,
				change: `${loss} (${risk * 100}%)`,
				pegOffset: BigNumber(stopPrice)
					.minus(price)
					.toFixed(0)
			}
		};

		console.log(data);

		prompt.start();

		const { shouldRun } = await prompt.get(['shouldRun']);

		if (shouldRun !== 'yes') {
			return 'aborted operation';
		}

		const linkId = uuid().substr(0, 8);

		const entry = await this.stopMarket(size, price, {
			contingencyType: 'OneTriggersTheOther',
			execInst: 'LastPrice',
			clOrdLinkID: linkId
		});
		const exit = await this.executeSell(size, {
			price: data.profit.price,
			clOrdLinkID: linkId
		});
		const stop = await this.executeSell(size, {
			clOrdLinkID: linkId,
			execInst: 'LastPrice,Close',
			pegPriceType: 'TrailingStopPeg',
			pegOffsetValue: BigNumber(stopPrice)
				.minus(price)
				.toFixed(0)
		});

		return { entry, exit, stop };
	}

	static async autoShort(price, size, risk, reward) {
		const leverage = await this.leverage();
		let balance = await this.sellBalance();
		balance = parseFloat(balance).toFixed(15);
		const ask = await this.ask();

		if (parseFloat(price) > parseFloat(ask)) {
			return 'Your trigger price greater than the current ask price';
		}

		const baseCost = BigNumber(size)
			.dividedBy(price)
			.dividedBy(leverage);

		const exitPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(-reward).dividedBy(leverage)))
			.toFixed(0);
		const stopPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(risk).dividedBy(leverage)))
			.toFixed(0);

		const gain = BigNumber(size).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(size).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		const data = {
			contracts: size,
			leverage,
			balance,
			baseCost: baseCost.toFixed(10),
			entryPrice: price,
			profit: {
				balance: BigNumber(balance)
					.minus(gain)
					.toFixed(6),
				price: exitPrice,
				change: `${gain} (${reward * 100}%)`
			},
			loss: {
				balance: BigNumber(balance)
					.minus(loss)
					.toFixed(6),
				price: stopPrice,
				change: `${loss} (${risk * 100}%)`,
				pegOffset: BigNumber(stopPrice)
					.minus(price)
					.toFixed(0)
			}
		};

		console.log(data);

		prompt.start();

		const { shouldRun } = await prompt.get(['shouldRun']);

		if (shouldRun !== 'yes') {
			return 'aborted operation';
		}

		const linkId = uuid().substr(0, 8);

		const entry = await this.stopMarket(`-${size}`, price, {
			contingencyType: 'OneTriggersTheOther',
			execInst: 'LastPrice',
			clOrdLinkID: linkId
		});
		const exit = await this.executeBuy(size, {
			price: data.profit.price,
			clOrdLinkID: linkId
		});
		const stop = await this.executeBuy(size, {
			clOrdLinkID: linkId,
			execInst: 'LastPrice,Close',
			pegPriceType: 'TrailingStopPeg',
			pegOffsetValue: BigNumber(stopPrice)
				.minus(price)
				.toFixed(0)
		});

		return { entry, exit, stop };
	}

	static async depositAddress() {
		const result = await this.exchange.privateGetUserWallet();

		return result.addr;
	}
}

module.exports = BitmexExchange;
