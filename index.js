#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/.env' });

const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const fs = require('fs');
const ethUnit = require('ethjs-unit');

const schema = [
	{ name: 'command', defaultOption: true },
	{ name: 'price', alias: 'p', type: String },
	{ name: 'exchange', alias: 'e', type: String },
	{ name: 'amount', alias: 'a', type: String },
	{ name: 'address', type: String },
	{ name: 'order', type: String },
	{ name: 'risk', type: String, defaultValue: 0.05 },
	{ name: 'reward', type: String, defaultValue: 0.4 },
	{ name: 'help', alias: 'h', type: String },
	{ name: 'contract', type: String },
	{ name: 'abi', type: String },
	{ name: 'bytecode', type: String },
	{ name: 'gasLimit', type: Number, defaultValue: 5000000 },
	{ name: 'gasPrice', type: Number, defaultValue: 1 }
];

const usageSchema = [
	{
		header: "Harry's Crypto CLI",
		content: 'CLI tool for crypto'
	},
	{
		header: 'Commands',
		content: [
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
				name: '[bold]{address}',
				label: 'Get a deposit address'
			},
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
				name: '[bold]{cancelOrder}',
				label: 'Cancel an open order'
			},
			{
				name: '[bold]{cancel}',
				label: 'Cancel all open orders'
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
				name: '[bold]{autoLong}',
				label: 'Go long at a set price protected by stops'
			},
			{
				name: '[bold]{autoShort}',
				label: 'Go short at a set price protected by stops'
			},
			{
				name: '[bold]{compile}',
				label: 'Compile an ethereum smart contract'
			},
			{
				name: '[bold]{deploy}',
				label: 'Deploy an ethereum smart contract'
			}
		]
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'exchange',
				typeLabel: '[underline]{exchange}',
				description: 'The exchange to use.'
			},
			{
				name: 'price',
				typeLabel: '[underline]{price}',
				description: 'The price to buy/sell at. Defaults to the current market bid/ask.'
			},
			{
				name: 'amount',
				typeLabel: '[underline]{amount}',
				description: 'The amount to buy/sell. Defaults to full balance.'
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
				description: 'The address to withdraw to'
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
args.gasPrice = ethUnit.toWei(args.gasPrice, 'gwei').toString();

if (args.help === null) {
	usage();
}

const lastExchange = fs.readFileSync(__dirname + '/lastExchange.txt');
const e = {
	ETH: './lib/wallets/ethereum',
	SCHB: './lib/wallets/ethereum/schrute-bucks',
	BTC: './lib/wallets/bitcoin',
	nicehash: './lib/wallets/nicehash',
	'gdax.ETH-USD': './lib/exchanges/gdax/eth-usd',
	'gdax.BTC-USD': './lib/exchanges/gdax/btc-usd',
	'gdax.LTC-USD': './lib/exchanges/gdax/ltc-usd',
	'gdax.BCH-USD': './lib/exchanges/gdax/bch-usd',
	'bitmex.XBTUSD-BTC': './lib/exchanges/bitmex/xbt-usd'
}[args.exchange || lastExchange];

if (!e) {
	console.log('Exchange Not Found');
	process.exit();
}

const exchange = require(e);
const command = exchange[args.command];

fs.writeFileSync(__dirname + '/lastExchange.txt', args.exchange || lastExchange, { flag: 'w' });

run();

async function run() {
	if (!command) {
		return usage();
	}

	try {
		const result = await exchange[args.command](args);
		if (result) {
			console.log(result);
		}
	} catch (e) {
		console.log(e);
	}

	process.exit();
}

function usage() {
	console.log(getUsage(usageSchema));
	process.exit();
}
