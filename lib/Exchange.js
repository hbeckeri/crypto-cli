const Wallet = require('./Wallet');
const _ = require('lodash');
const moment = require('moment');
const BigNumber = require('bignumber.js');

class Exchange extends Wallet {
	static get type() {
		return 'exchange';
	}

	static async buy({ amount, price }, params = {}) {
		const defaultAmount = await this.buyBalance();
		const defaultPrice = await this.bid();

		const payload = {
			amount: amount || new BigNumber(defaultAmount).dividedBy(price || defaultPrice).toFixed(8),
			price: price || defaultPrice
		};

		if (parseFloat(payload.price) > parseFloat(defaultPrice)) {
			return 'Your buy price is larger than the current bid price';
		}

		if (
			parseFloat(payload.ammount) >
			parseFloat(new BigNumber(defaultAmount).dividedBy(payload.price).toFixed(8))
		) {
			return 'Insufficient funds';
		}

		console.log(
			`Buy ${payload.amount} ${this.tradingPair[0]} at ${payload.price} ${
				this.tradingPair[1]
			} for a total of ${new BigNumber(payload.amount).times(payload.price).toFixed(2)} ${
				this.tradingPair[1]
			}?`
		);
		await this.prompt();

		return await this.buyLimit(payload.amount, payload.price, params);
	}

	static async sell({ amount, price }, params = {}) {
		const defaultAmount = await this.sellBalance();
		const defaultPrice = await this.ask();

		const payload = {
			amount: amount || defaultAmount,
			price: price || defaultPrice
		};

		if (parseFloat(payload.price) < parseFloat(defaultPrice)) {
			return 'Your sell price is less than the current ask price';
		}

		if (parseFloat(payload.ammount) > parseFloat(defaultAmount)) {
			return 'Insufficient funds';
		}

		console.log(
			`Sell ${payload.amount} ${this.tradingPair[0]} at ${payload.price} ${
				this.tradingPair[1]
			} for a total of ${new BigNumber(payload.amount).times(payload.price).toFixed(2)} ${
				this.tradingPair[1]
			}?`
		);
		await this.prompt();

		return await this.sellLimit(payload.amount, payload.price, params);
	}

	static async openOrders() {
		const response = await this._openOrders();

		const os = response.map(o =>
			Object.assign(
				_.pick(o, [
					'id',
					'side',
					'type',
					'price',
					'symbol',
					'status',
					'amount',
					'info.stopPx',
					'info.execInst',
					'info.pegOffsetValue',
					'info.clOrdLinkID'
				]),
				{ time: moment(o.timestamp).fromNow() }
			)
		);

		return JSON.stringify(_.groupBy(os, 'info.clOrdLinkID'), null, 2);
	}

	static async closedOrders() {
		const response = await this._closedOrders();

		const os = response.map(o =>
			Object.assign(
				_.pick(o, [
					'id',
					'side',
					'type',
					'price',
					'symbol',
					'status',
					'filled',
					'amount',
					'info.stopPx',
					'info.execInst',
					'info.pegOffsetValue',
					'info.clOrdLinkID'
				]),
				{ time: moment(o.timestamp).fromNow() }
			)
		);

		return JSON.stringify(_.groupBy(os, 'info.clOrdLinkID'), null, 2);
	}

	static get tradingPair() {
		return [this.symbol, this.exchangeSymbol];
	}

	static get tradingSymbol() {
		return this.tradingPair.join('/');
	}

	static get exchangeSymbol() {
		throw new Error('You must implement `exchangeSymbol`');
	}

	static async buyLimit() {
		throw new Error('You must implement `buyLimit`');
	}

	static async sellLimit() {
		throw new Error('You must implement `sellLimit`');
	}

	static async bid() {
		throw new Error('You must implement `bid`');
	}

	static async ask() {
		throw new Error('You must implement `ask`');
	}

	static async buyBalance() {
		throw new Error('You must implement `buyBalance`.');
	}

	static async sellBalance() {
		throw new Error('You must implement `sellBalance`');
	}

	static async portfolio() {
		throw new Error('You must implement `porfolio`');
	}

	static async deposit() {
		throw new Error('You must implement `deposit`');
	}

	static async _openOrders() {
		throw new Error('You must implement `_openOrders`');
	}

	static async _closedOrders() {
		throw new Error('You must implement `_closedOrders`');
	}
}

module.exports = Exchange;
