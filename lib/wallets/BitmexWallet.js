const CCXTWallet = require('../CCXTWallet');
const BigNumber = require('bignumber.js');
const uuid = require('uuid/v1');

/**
if (process.env.BITMEX_TESTNET_ENABLED === 'true') {
	ExchangeClient.urls['api'] = ExchangeClient.urls['test'];
}
*/

class BitmexWallet extends CCXTWallet {
	static get exchangeName() {
		return 'bitmex';
	}

	static get tradingSymbol() {
		return 'XBTUSD';
	}

	static get exchangeParams() {
		return {
			apiKey:
				process.env.BITMEX_TESTNET_ENABLED === 'true'
					? process.env.BITMEX_TESTNET_API_KEY
					: process.env.BITMEX_API_KEY,
			secret:
				process.env.BITMEX_TESTNET_ENABLED === 'true'
					? process.env.BITMEX_TESTNET_API_SECRET
					: process.env.BITMEX_API_SECRET,
			setSandboxMode: true
		};
	}

	static async executeBuy(size, params = {}) {
		return this.exchange.privatePostOrder(
			Object.assign({ symbol: this.tradingSymbol, orderQty: size }, params)
		);
	}

	static async executeSell(size, params = {}) {
		if (size > 0) {
			size = size * -1;
		}

		return this.exchange.privatePostOrder(
			Object.assign({ symbol: this.tradingSymbol, orderQty: size }, params)
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

	static async leverage() {
		const response = await this.exchange.privateGetPosition();

		return response[0].leverage;
	}

	static async bid() {
		const response = await this.exchange.loadMarkets();

		return response['BTC/USD'].info.bidPrice;
	}

	static async ask() {
		const response = await this.exchange.loadMarkets();

		return response['BTC/USD'].info.askPrice;
	}

	static async autoLong({ price, amount, risk, reward }) {
		const leverage = await this.leverage();
		let balance = await this.sellBalance();
		balance = parseFloat(balance).toFixed(15);
		const bid = await this.bid();

		if (parseFloat(price) < parseFloat(bid)) {
			return 'Your trigger price is less than the current bid price';
		}

		const baseCost = BigNumber(amount)
			.dividedBy(price)
			.dividedBy(leverage);

		const exitPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(reward).dividedBy(leverage)))
			.toFixed(0);
		const stopPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(-risk).dividedBy(leverage)))
			.toFixed(0);

		const gain = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		const data = {
			contracts: amount,
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
		await this.prompt();

		const linkId = uuid().substr(0, 8);

		const entry = await this.stopMarket(amount, price, {
			contingencyType: 'OneTriggersTheOther',
			execInst: 'LastPrice',
			clOrdLinkID: linkId
		});
		const exit = await this.executeSell(amount, {
			price: data.profit.price,
			clOrdLinkID: linkId
		});
		const stop = await this.executeSell(amount, {
			clOrdLinkID: linkId,
			execInst: 'LastPrice,Close',
			pegPriceType: 'TrailingStopPeg',
			pegOffsetValue: BigNumber(stopPrice)
				.minus(price)
				.toFixed(0)
		});

		return { entry, exit, stop };
	}

	static async autoShort({ price, amount, risk, reward }) {
		const leverage = await this.leverage();
		let balance = await this.sellBalance();
		balance = parseFloat(balance).toFixed(15);
		const ask = await this.ask();

		if (parseFloat(price) > parseFloat(ask)) {
			return 'Your trigger price greater than the current ask price';
		}

		const baseCost = BigNumber(amount)
			.dividedBy(price)
			.dividedBy(leverage);

		const exitPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(-reward).dividedBy(leverage)))
			.toFixed(0);
		const stopPrice = BigNumber(price)
			.times(BigNumber(1).plus(BigNumber(risk).dividedBy(leverage)))
			.toFixed(0);

		const gain = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(price)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		const data = {
			contracts: amount,
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
		await this.prompt();

		const linkId = uuid().substr(0, 8);

		const entry = await this.stopMarket(`-${amount}`, price, {
			contingencyType: 'OneTriggersTheOther',
			execInst: 'LastPrice',
			clOrdLinkID: linkId
		});
		const exit = await this.executeBuy(amount, {
			price: data.profit.price,
			clOrdLinkID: linkId
		});
		const stop = await this.executeBuy(amount, {
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

module.exports = BitmexWallet;
