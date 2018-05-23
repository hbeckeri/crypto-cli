#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const _ = require('lodash');
const moment = require('moment');

const schema = [
	{ name: 'command', defaultOption: true },
	{ name: 'price', alias: 'p', type: String },
	{ name: 'exchange', alias: 'e', type: String, defaultValue: 'XBTUSD-BTC' },
	{ name: 'ammount', alias: 'a', type: String },
	{ name: 'address', type: String },
	{ name: 'order', type: String },
	{ name: 'risk', alias: 'l', type: String, defaultValue: 0.05 },
	{ name: 'reward', alias: 'g', type: String, defaultValue: 0.4 },
	{ name: 'help', alias: 'h', type: String }
];

const usageSchema = [
	{
		header: 'Harry\'s Crypto CLI',
		content: 'CLI tool for crypto'
	},
	{
		header: 'Commands',
		content: [
			{
				name: '[bold]{buy}',
				label: 'Place a buy order'
			},
			{
				name: '[bold]{sell}',
				label: 'Place a sell order'
			},
			{
				name: '[bold]{bid}',
				label: 'See the current bid price'
			},
			{
				name: '[bold]{ask}',
				label: 'See the current ask price'
			},
			{
				name: '[bold]{cancel}',
				label: 'Cancel all open bids'
			},
			{
				name: '[bold]{openOrders}',
				label: 'Fetch open orders'
			},
			{
				name: '[bold]{closedOrders}',
				label: 'Fetch closed orders'
			},
			{
				name: '[bold]{cancelOrders}',
				label: 'Cancel an order'
			},
			{
				name: '[bold]{balance}',
				label: 'See your current balance'
			},
			{
				name: '[bold]{deposit}',
				label: 'Deposit funds'
			},
			{
				name: '[bold]{withdraw}',
				label: 'Withdraw funds'
			},
			{
				name: '[bold]{depositAddress}',
				label: 'Get a deposit address'
			},
			{
				name: '[bold]{autoLong}',
				label: 'Go long at a set price protected by stops'
			},
			{
				name: '[bold]{autoShort}',
				label: 'Go short at a set price protected by stops'
			}
		]
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'price',
				typeLabel: '[underline]{price}',
				description: 'The price to buy/sell at. Defaults to the current market bid/ask.'
			},
			{
				name: 'exchange',
				typeLabel: '[underline]{exchange}',
				description: 'The exchange to use.'
			},
			{
				name: 'ammount',
				typeLabel: '[underline]{ammount}',
				description: 'The ammount to buy/sell.'
			},
			{
				name: 'risk',
				typeLabel: '[underline]{risk}',
				description: 'The percent risk to take in an auto long/short'
			},
			{
				name: 'reward',
				typeLabel: '[underline]{reward}',
				description: 'The percent reward to take in an auto long/short.'
			},
			{
				name: 'address',
				typeLabel: '[underline]{address}',
				description: 'The address to deposit to'
			},
			{
				name: 'order',
				typeLabel: '[underline]{order}',
				description: 'The id of the order'
			},
			{
				name: 'help',
				description: 'Print this usage guide.'
			}
		]
	}
];

const args = commandLineArgs(schema);

if (args.help === null) {
	usage();
}

const exchange = {
	'ETH-USD': require('./lib/exchanges/gdax/eth-usd'),
	'BTC-USD': require('./lib/exchanges/gdax/btc-usd'),
	'LTC-USD': require('./lib/exchanges/gdax/ltc-usd'),
	'BCH-USD': require('./lib/exchanges/gdax/bch-usd'),
	'XBTUSD-BTC': require('./lib/exchanges/bitmex/xbt-usd')
}[args.exchange];

const command = {
	buy: buy,
	sell: sell,
	bid: bid,
	ask: ask,
	cancel: cancel,
	balance: balance,
	deposit: deposit,
	withdraw: withdraw,
	depositAddress: depositAddress,
	autoLong: autoLong,
	autoShort: autoShort,
	openOrders: openOrders,
	closedOrders: closedOrders,
	cancelOrder: cancelOrder 
}[args.command];

if (command) {
	try {
		command();
	} catch (e) {
		console.log('here');
	}
} else {
	usage();
}

async function buy() {
	const response = await exchange.buy(args.ammount, args.price);

	console.log(response);
}

async function sell() {
	const response = await exchange.sell(args.ammount, args.price);

	console.log(response);
}

async function stopMarket() {
	const response = await exchange.stopMarket(args.ammount, args.price);

	console.log(response);
}

async function cancel() {
	const response = await exchange.cancelAllOrders();

	console.log(response);
}

async function bid() {
	const bid = await exchange.bid();

	console.log(bid);
}

async function ask() {
	const ask = await exchange.ask();

	console.log(ask);
}

async function balance() {
	const buyBalance = await exchange.buyBalance();
	const sellBalance = await exchange.sellBalance();

	return console.log({
		[exchange.tradingPair[0]]: sellBalance,
		[exchange.tradingPair[1]]: buyBalance
	});
}

async function deposit() {
	const response = await exchange.deposit(args.ammount);

	console.log(response);
}

async function withdraw() {
	const response = await exchange.withdraw(args.ammount, args.address);

	console.log(response);
}

async function depositAddress() {
	const response = await exchange.depositAddress();

	console.log(response);
}

async function autoLong() {
	const response = await exchange.autoLong(args.price, args.ammount, args.risk, args.reward);

	console.log(response);
}

async function autoShort() {
	const response = await exchange.autoShort(args.price, args.ammount, args.risk, args.reward);

	console.log(response);
}

async function openOrders() {
	const response = await exchange.openOrders();

	const os = response.map(o =>
		Object.assign(_.pick(o, [
			'id',
			'side',
			'type',
			'price',
			'symbol',
			'status',
			'info.stopPx',
			'info.execInst',
			'info.pegOffsetValue',
			'info.clOrdLinkID',
		]), { time: moment(o.timestamp).fromNow() })
	);

	console.log(JSON.stringify(_.groupBy(os, 'info.clOrdLinkID'), null, 2));
}

async function closedOrders() {
	const response = await exchange.closedOrders();

	const os = response.map(o =>
		Object.assign(_.pick(o, [
			'id',
			'side',
			'type',
			'price',
			'symbol',
			'status',
			'filled',
			'info.stopPx',
			'info.execInst',
			'info.pegOffsetValue',
			'info.clOrdLinkID',
		]), { time: moment(o.timestamp).fromNow() })
	);

	console.log(JSON.stringify(_.groupBy(os, 'info.clOrdLinkID'), null, 2));
}

async function cancelOrder() {
	const response = await exchange.cancelOrder(args.order)
}

function usage() {
	console.log(getUsage(usageSchema));
	process.exit();
}
