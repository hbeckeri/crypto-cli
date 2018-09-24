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
		const response = await this.loadMarkets();

		return response.info.bidPrice;
	}

	static async ask() {
		const response = await this.loadMarkets();

		return response.info.askPrice;
	}

	static async isInverse() {
		const response = await this.loadMarkets();

		return response.info.isInverse;
	}

	static async loadMarkets() {
		const response = await this.exchange.loadMarkets();

		if (this.tradingSymbol === 'XBTUSD') {
			return response['BTC/USD'];
		}

		return response[this.tradingSymbol];
	}

	static async createPosition(action, { price, stop, target, risk, reward }) {
		let balance = await this.totalBalance();
		const bid = await this.bid();
		const ask = await this.ask();
		const isInverse = await this.isInverse();

		const entryPrice = BigNumber(price || (action === 'long' ? bid : ask));
		const stopPrice = BigNumber(stop);
		const exitPrice = BigNumber(target);
		const entryStopPercentDiff = entryPrice
			.minus(stopPrice)
			.abs()
			.dividedBy(entryPrice.plus(stopPrice).dividedBy(2));

		const baseCost = balance.times(risk).dividedBy(entryStopPercentDiff);

		const amount = isInverse ? baseCost.times(entryPrice) : baseCost.dividedBy(entryPrice);

		const gain = amount
			.times(
				isInverse
					? BigNumber(1)
							.dividedBy(entryPrice)
							.minus(BigNumber(1).dividedBy(exitPrice))
					: exitPrice.minus(entryPrice)
			)
			.abs();
		const loss = amount
			.times(
				isInverse
					? BigNumber(1)
							.dividedBy(entryPrice)
							.minus(BigNumber(1).dividedBy(stopPrice))
					: stopPrice.minus(entryPrice)
			)
			.abs();
		const exitBalance = balance.plus(gain);
		const stopBalance = balance.minus(loss);
		const balanceGainPercentDiff = balance
			.minus(exitBalance)
			.abs()
			.dividedBy(balance.plus(exitBalance).dividedBy(2));
		const balanceLossPercentDiff = balance
			.minus(stopBalance)
			.abs()
			.dividedBy(balance.plus(stopBalance).dividedBy(2));

		console.log(
			`${action === 'long' ? 'Buy' : 'Sell'} ${BigNumber(amount.toFixed(0)).toFormat()} ${
				this.tradingSymbol
			} contracts at ${entryPrice.toFormat()} ${
				this.tradingPair[1]
			} for a total of ${baseCost.toFixed(10)} ${this.tradingPair[0]}?\n`
		);

		console.log(
			`At ${exitPrice.toFormat(8)} ${this.tradingPair[1]} you'll make ${gain.toFixed(10)} ${
				this.tradingPair[0]
			} for a total balance of ${exitBalance.toFixed(10)} (${balanceGainPercentDiff
				.times(100)
				.toFixed(2)}%) ${this.tradingPair[0]}`
		);
		console.log(
			`At ${stopPrice.toFormat(8)} ${this.tradingPair[1]} you'll loose ${loss.toFixed(10)} ${
				this.tradingPair[0]
			} for a total balance of ${stopBalance.toFixed(10)} (${balanceLossPercentDiff
				.times(100)
				.toFixed(2)}%) ${this.tradingPair[0]}\n`
		);

		console.log(
			`Entry: ${entryPrice.toFormat(8)}\nTarget: ${exitPrice.toFormat(
				8
			)}\nStop: ${stopPrice.toFormat(8)}\nR: ${entryPrice
				.minus(exitPrice)
				.abs()
				.dividedBy(entryPrice.minus(stopPrice).abs())}`
		);

		await this.prompt();

		return { amount, entryPrice, exitPrice, stopPrice, bid, ask };
	}

	static async long(params) {
		const { amount, entryPrice, exitPrice, stopPrice, bid } = await this.createPosition(
			'long',
			params
		);

		if (entryPrice.lte(stopPrice) || entryPrice.gte(exitPrice)) {
			return 'Invalid Long Position';
		}

		const linkId = uuid().substr(0, 8);

		const entryParams = {
			contingencyType: 'OneTriggersTheOther',
			clOrdLinkID: linkId,
			price: entryPrice.toFixed(8)
		};

		if (BigNumber(bid).lt(entryPrice)) {
			entryParams.stopPx = entryPrice.toFixed(8);
			entryParams.execInst = 'LastPrice';
			delete entryParams.price;
		}

		const entry = await this.executeBuy(amount.toFixed(0), entryParams);
		const exit = await this.executeSell(amount.toFixed(0), {
			price: exitPrice.toFixed(8),
			clOrdLinkID: linkId
		});
		const stopLoss = await this.executeSell(amount.toFixed(0), {
			stopPx: stopPrice.toFixed(8),
			clOrdLinkID: linkId
		});

		return { entry, exit, stopLoss };
	}

	static async short(params) {
		const { amount, entryPrice, exitPrice, stopPrice, ask } = await this.createPosition(
			'short',
			params
		);

		if (entryPrice.gte(stopPrice) || entryPrice.lte(exitPrice)) {
			return 'Invalid Short Position';
		}

		const linkId = uuid().substr(0, 8);

		const entryParams = {
			contingencyType: 'OneTriggersTheOther',
			clOrdLinkID: linkId,
			price: entryPrice.toFixed(8)
		};

		if (BigNumber(ask).gt(entryPrice)) {
			entryParams.stopPx = entryPrice.toFixed(0);
			entryParams.execInst = 'LastPrice';
			delete entryParams.price;
		}

		const entry = await this.executeSell(amount.toFixed(0), entryParams);
		const exit = await this.executeBuy(amount.toFixed(0), {
			price: exitPrice.toFixed(8),
			clOrdLinkID: linkId
		});
		const stop = await this.executeBuy(amount.toFixed(0), {
			stopPx: stopPrice.toFixed(8),
			clOrdLinkID: linkId
		});

		return { entry, exit, stop };
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
