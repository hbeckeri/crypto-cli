const CCXTWallet = require('../CCXTWallet');
const BigNumber = require('bignumber.js');
const uuid = require('uuid/v1');
const ccxt = require('ccxt');

class BitmexWallet extends CCXTWallet {
	static get exchange() {
		if (!this._exchange) {
			this._exchange = new ccxt[this.exchangeName](this.exchangeParams);
		}

		if (process.env.BITMEX_TESTNET_ENABLED === 'true') {
			this._exchange.urls['api'] = this._exchange.urls['test'];
		}

		return this._exchange;
	}

	static get exchangeName() {
		return 'bitmex';
	}

	static get tradingSymbol() {
		return this.contractSymbol;
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

	static async buyLimit({ amount, price }) {
		return this.executeBuy(amount, { price });
	}

	static async sellLimit({ amount, price }) {
		return this.executeSell(amount, { price });
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

	static async leverage({ amount }) {
		if (amount) {
			await this.exchange.privatePostPositionLeverage({
				leverage: amount,
				symbol: this.tradingSymbol
			});
		}

		const response = await this.exchange.privateGetPosition();

		return response.find(e => e.symbol === this.tradingSymbol).leverage;
	}

	static async bid() {
		const response = await this.exchange.loadMarkets();

		if (this.tradingSymbol === 'XBTUSD') {
			return response[this.tradingPair.join('/')].info.bidPrice;
		}

		return response[this.tradingSymbol].info.bidPrice;
	}

	static async ask() {
		const response = await this.exchange.loadMarkets();

		if (this.tradingSymbol === 'XBTUSD') {
			return response[this.tradingPair.join('/')].info.bidPrice;
		}

		return response[this.tradingSymbol].info.askPrice;
	}

	static async buy({ price, amount, risk, reward }) {
		if (risk > 0.95) {
			return 'To protect from liquidation, you may not risk more than 95%';
		}

		const leverage = await this.leverage({});
		const sellBalance = await this.sellBalance();
		const balance = BigNumber(sellBalance);
		const bid = await this.bid();

		const entryPrice = BigNumber(price || bid);

		const baseCost = BigNumber(amount)
			.dividedBy(entryPrice)
			.dividedBy(leverage);

		if (baseCost.gt(balance)) {
			return 'Insufficient funds';
		}

		const exitPrice = BigNumber(entryPrice).times(
			BigNumber(1).plus(BigNumber(reward).dividedBy(leverage))
		);
		const stopPrice = BigNumber(entryPrice).times(
			BigNumber(1).plus(BigNumber(-risk).dividedBy(leverage))
		);

		const gain = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(entryPrice)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(entryPrice)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		console.log(
			`Buy ${BigNumber(amount).toFormat()} ${
				this.tradingSymbol
			} contracts at ${entryPrice.toFormat()} ${
				this.tradingPair[1]
			} for a total of ${baseCost.toFixed(10)} ${this.tradingPair[0]}?\n`
		);

		console.log(
			`At ${exitPrice.toFormat(2)} ${this.tradingPair[1]} you'll make ${gain.toFixed(10)} ${
				this.tradingPair[0]
			} for a total balance of ${balance.plus(gain).toFixed(10)} (${reward * 100}%) ${
				this.tradingPair[0]
			}`
		);
		console.log(
			`At ${stopPrice.toFormat(2)} ${this.tradingPair[1]} you'll loose ${loss
				.times(-1)
				.toFixed(10)} ${this.tradingPair[0]} for a total balance of ${balance
				.plus(loss)
				.toFixed(10)} (${risk * 100}%) ${this.tradingPair[0]}`
		);

		await this.prompt();

		const linkId = uuid().substr(0, 8);

		const entryParams = {
			contingencyType: 'OneTriggersTheOther',
			clOrdLinkID: linkId,
			price: entryPrice.toFixed(0)
		};

		if (BigNumber(bid).lt(entryPrice)) {
			entryParams.stopPx = entryPrice.minus(2).toFixed(0);
			entryParams.execInst = 'LastPrice';
		}

		const entry = await this.executeBuy(amount, entryParams);
		const exit = await this.executeSell(amount, {
			price: exitPrice.toFixed(0),
			clOrdLinkID: linkId
		});
		const stop = await this.executeSell(amount, {
			stopPx: stopPrice.toFixed(0),
			clOrdLinkID: linkId
		});

		return { entry, exit, stop };
	}

	static async sell({ price, amount, risk, reward }) {
		if (risk > 0.95) {
			return 'To protect from liquidation, you may not risk more than 95%';
		}

		const leverage = await this.leverage({});
		const sellBalance = await this.sellBalance();
		const balance = BigNumber(sellBalance);
		const ask = await this.ask();

		const entryPrice = BigNumber(price || ask);

		const baseCost = BigNumber(amount)
			.dividedBy(entryPrice)
			.dividedBy(leverage);

		if (baseCost.gt(balance)) {
			return 'Insufficient funds';
		}

		const exitPrice = BigNumber(entryPrice).times(
			BigNumber(1).plus(BigNumber(-reward).dividedBy(leverage))
		);
		const stopPrice = BigNumber(entryPrice).times(
			BigNumber(1).plus(BigNumber(risk).dividedBy(leverage))
		);

		const gain = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(entryPrice)
				.minus(BigNumber(1).dividedBy(exitPrice))
		);
		const loss = BigNumber(amount).times(
			BigNumber(1)
				.dividedBy(entryPrice)
				.minus(BigNumber(1).dividedBy(stopPrice))
		);

		console.log(
			`Sell ${BigNumber(amount).toFormat()} ${
				this.tradingSymbol
			} contracts at ${entryPrice.toFormat()} ${
				this.tradingPair[1]
			} for a total of ${baseCost.toFixed(10)} ${this.tradingPair[0]}?`
		);

		if (leverage > 1) {
			console.log(
				`\nAt ${exitPrice.toFormat(2)} ${this.tradingPair[1]} you'll make ${gain
					.times(-1)
					.toFixed(10)} ${this.tradingPair[0]} for a total balance of ${balance
					.minus(gain)
					.toFixed(10)} (${reward * 100}%) ${this.tradingPair[0]}`
			);
			console.log(
				`At ${stopPrice.toFormat(2)} ${this.tradingPair[1]} you'll loose ${loss.toFixed(10)} ${
					this.tradingPair[0]
				} for a total balance of ${balance.minus(loss).toFixed(10)} (${risk * 100}%) ${
					this.tradingPair[0]
				}`
			);
		}
		await this.prompt();

		const linkId = uuid().substr(0, 8);

		const entryParams = {
			contingencyType: 'OneTriggersTheOther',
			clOrdLinkID: linkId,
			price: entryPrice.toFixed(0)
		};

		if (BigNumber(ask).gt(entryPrice)) {
			entryParams.stopPx = entryPrice.plus(2).toFixed(0);
			entryParams.execInst = 'LastPrice';
		}

		const entry = await this.executeSell(amount, entryParams);
		if (leverage > 1) {
			const exit = await this.executeBuy(amount, {
				price: exitPrice.toFixed(0),
				clOrdLinkID: linkId
			});
			const stop = await this.executeBuy(amount, {
				stopPx: stopPrice.toFixed(0),
				clOrdLinkID: linkId
			});

			return { entry, exit, stop };
		}

		return { entry };
	}

	static async depositAddress() {
		const result = await this.exchange.privateGetUserWallet();

		return result.addr;
	}

	static async _openOrders() {
		const result = await this.exchange.fetchOpenOrders();

		return result.filter(e => e.symbol === this.tradingPair.join('/'));
	}

	static async _closedOrders() {
		const result = await this.exchange.fetchClosedOrders();

		return result.filter(e => e.symbol === this.tradingPair.join('/'));
	}
}

module.exports = BitmexWallet;
