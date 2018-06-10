const Wallet = require('./Wallet');
const _ = require('lodash');
const moment = require('moment');
const prompt = require('prompt-async');
const BigNumber = require('bignumber.js');

class Exchange extends Wallet {
	static get symbol() {
		return this.tradingPair.join('/');
	}

	static async buy({ amount, price }, params = {}) {
		const defaultAmount = await this.buyBalance();
		const defaultPrice = await this.bid();

		if (parseFloat(price) > parseFloat(defaultPrice)) {
			return 'Your buy price is larger than the current bid price';
		}

		const payload = {
			amount: amount || (new BigNumber(defaultAmount).dividedBy(price || defaultPrice).toFixed(8)),
			price: price || defaultPrice
		}

		console.log(`Buy ${payload.amount} ${this.tradingPair[0]} at ${payload.price} ${this.tradingPair[1]}`);
		console.log(`Type 'yes' to continue`)
		prompt.start();

		const { proceed } = await prompt.get(['proceed']);

		if (proceed !== 'yes') {
			return 'aborted operation';
		}

		const result = await this.buyLimit(payload.amount, payload.price, params);

		return result;
	}

	static async sell({ amount, price }, params = {}) {
		const defaultAmount = await this.sellBalance();
		const defaultPrice = await this.ask();

		if (parseFloat(price) < parseFloat(defaultPrice)) {
			return 'Your sell price is less than the current ask price';
		}

		const payload = {
			amount: amount || defaultAmount,
			price: price || defaultPrice
		}

		console.log(`Sell ${payload.amount} ${this.tradingPair[0]} at ${payload.price} ${this.tradingPair[1]}`);
		console.log(`Type 'yes' to continue`)
		prompt.start();

		const { proceed } = await prompt.get(['proceed']);

		if (proceed !== 'yes') {
			return 'aborted operation';
		}

		const result = await this.sellLimit(payload.amount, payload.price, params);

		return result;
	}

	static async balance() {
		const buyBalance = await this.buyBalance();
		const sellBalance = await this.sellBalance();

		return console.log({
			[this.tradingPair[0]]: sellBalance,
			[this.tradingPair[1]]: buyBalance
		});
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

	static async cancel() {
		return await this.cancelAllOrders();
	}

	static get tradingPair() {
		throw new Error('You must implement `tradingPair`');
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

	static async cancelAllOrders() {
		throw new Error('You must implement `cancelAllOrders`');
	}

	static async buyBalance() {
		throw new Error('You must implement `buyBalance`.');
	}

	static async sellBalance() {
		throw new Error('You must implement `sellBalance`');
	}

	static async deposit() {
		throw new Error('You must implement `deposit`');
	}

	static async withdraw() {
		throw new Error('You must implement `withdraw`');
	}

	static async _openOrders() {
		throw new Error('You must implement `_openOrders`');
	}

	static async _closedOrders() {
		throw new Error('You must implement `_closedOrders`');
	}
}

module.exports = Exchange;
