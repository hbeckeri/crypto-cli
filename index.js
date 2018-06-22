#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/.env' });

const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');

const schema = [
	{ name: 'command', defaultOption: true },
	{ name: 'price', alias: 'p', type: String },
	{ name: 'wallet', alias: 'w', type: String },
	{ name: 'symbol', alias: 's', type: String },
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
	{ name: 'gasLimit', type: Number, defaultValue: 5 },
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
				name: '[bold]{send}',
				label: 'Send funds to an address'
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
				name: 'contract',
				typeLabel: '[underline]{contract}',
				description: 'The path to a solidity smart contract'
			},
			{
				name: 'abi',
				typeLabel: '[underline]{abi}',
				description: 'The path to a compiled solidity abi'
			},
			{
				name: 'bytecode',
				typeLabel: '[underline]{bytecode}',
				description: 'The path to a compiled solidity bytecode'
			},
			{
				name: 'gasPrice',
				typeLabel: '[underline]{gasPrice}',
				description: 'The price, in gwei, for an ethereum transaction'
			},
			{
				name: 'gasLimit',
				typeLabel: '[underline]{gasLimit}',
				description: 'The limit, in gwei, for an ethereum transaction'
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
				name: 'help',
				description: 'Print this usage guide.'
			}
		]
	}
];

let args = commandLineArgs(schema);

if (args.help === null) {
	usage();
}

const e = {
	BTC: './lib/wallets/BitcoinWallet',
	DAI: './lib/wallets/DAIWallet',
	ETH: './lib/wallets/EthereumWallet',
	NOBS: './lib/wallets/NOBSWallet',
	SCHB: './lib/wallets/SCHBWallet',
	ZRX: './lib/wallets/ZRXWallet',
	coinbase: './lib/wallets/CoinbaseWallet',
	nicehash: './lib/wallets/NicehashWallet',
	gdax: './lib/wallets/GdaxWallet',
	binance: './lib/wallets/BinanceWallet',
	bitmex: './lib/wallets/BitmexWallet',
	hitbtc: './lib/wallets/HitBTCWallet'
}[args.wallet];

if (!e) {
	console.log('Exchange Not Found');
	process.exit();
}

const _Wallet = require(e);
class Wallet extends _Wallet {
	static get symbol() {
		try {
			const symbol = super.symbol;

			return symbol;
		} catch (e) {
			return args.symbol || args.wallet;
		}
	}

	static get exchangeSymbol() {
		return args.exchange;
	}
}

args = Wallet.parseArgs(args);
const command = Wallet[args.command];

run();

async function run() {
	if (!command) {
		return usage();
	}

	try {
		const result = await Wallet[args.command](args);

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
