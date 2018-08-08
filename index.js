#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/.env' });

const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const fs = require('fs');

const persistantArgs = JSON.parse(
	fs.readFileSync(__dirname + '/args.json', { flag: 'a+' }).toString() || '{}'
);

const schema = [
	{ name: 'command', defaultOption: true },
	{ name: 'price', alias: 'p', type: String },
	{ name: 'wallet', alias: 'w', type: String, defaultValue: persistantArgs.wallet },
	{ name: 'symbol', alias: 's', type: String, defaultValue: persistantArgs.symbol },
	{ name: 'exchange', alias: 'e', type: String, defaultValue: persistantArgs.exchange },
	{ name: 'amount', alias: 'a', type: String },
	{ name: 'address', type: String },
	{ name: 'order', type: String },
	{ name: 'risk', type: String, defaultValue: 0.05 },
	{ name: 'reward', type: String, defaultValue: 0.4 },
	{ name: 'help', alias: 'h', type: String },
	{ name: 'contract', alias: 'c', type: String, defaultValue: persistantArgs.contract },
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
		header: 'Wallet Commands',
		content: [
			{
				name: '{bold balance}',
				label: 'See your current balance'
			},
			{
				name: '{bold send}',
				label: 'Send funds to an address'
			},
			{
				name: '{bold address}',
				label: 'Get a deposit address'
			},
			{
				name: '{bold seed}',
				label: 'Generate a seed phrase'
			},
			{
				name: '{bold transactions}',
				label: 'Get a list of transactions'
			},
			{
				name: '{bold compile}',
				label: 'Compile an ethereum smart contract (Ethereum Only)'
			},
			{
				name: '{bold deploy}',
				label: 'Deploy an ethereum smart contract (Ethereum Only)'
			}
		]
	},
	{
		header: 'Exchange Commands',
		content: [
			{
				name: '{bold tradingPairs}',
				label: 'List the trading pairs for an exchange'
			},
			{
				name: '{bold buy}',
				label: 'Place a buy order'
			},
			{
				name: '{bold sell}',
				label: 'Place a sell order'
			},
			{
				name: '{bold bid}',
				label: 'See the current bid price'
			},
			{
				name: '{bold ask}',
				label: 'See the current ask price'
			},
			{
				name: '{bold cancelOrder}',
				label: 'Cancel an open order'
			},
			{
				name: '{bold openOrders}',
				label: 'Fetch open orders'
			},
			{
				name: '{bold closedOrders}',
				label: 'Fetch closed orders'
			},
			{
				name: '{bold autoLong}',
				label: 'Go long at a set price protected by stops (Bitmex Only)'
			},
			{
				name: '{bold autoShort}',
				label: 'Go short at a set price protected by stops (Bitmex Only)'
			}
		]
	},
	{
		header: 'Wallet Options',
		optionList: [
			{
				name: 'wallet',
				typeLabel: '{underline wallet}',
				description: 'The wallet to use.'
			},
			{
				name: 'amount',
				typeLabel: '{underline amount}',
				description: 'The amount of coin to use'
			},
			{
				name: 'address',
				typeLabel: '{underline address}',
				description: 'The address to use'
			},
			{
				name: 'contract',
				typeLabel: '{underline contract}',
				description: 'The path to a solidity smart contract (Ethereum Only)'
			},
			{
				name: 'abi',
				typeLabel: '{underline abi}',
				description: 'The path to a compiled solidity abi (Ethereum Only)'
			},
			{
				name: 'bytecode',
				typeLabel: '{underline bytecode}',
				description: 'The path to a compiled solidity bytecode (Ethereum Only)'
			},
			{
				name: 'gasPrice',
				typeLabel: '{underline gasPrice}',
				description: 'The price, in gwei, for an ethereum transaction (Ethereum Only)'
			},
			{
				name: 'gasLimit',
				typeLabel: '{underline gasLimit}',
				description: 'The limit, in mwei, for an ethereum transaction (Ethereum Only)'
			},
			{
				name: 'help',
				description: 'Print this usage guide'
			}
		]
	},
	{
		header: 'Exchange Options',
		optionList: [
			{
				name: 'exchange',
				typeLabel: '{underline exchange}',
				description: 'The symbol to trade against'
			},
			{
				name: 'symbol',
				typeLabel: '{underline exchange}',
				description: 'The symbol to trade with'
			},
			{
				name: 'price',
				typeLabel: '{underline price}',
				description: 'The price to buy/sell at. Defaults to the current market bid/ask'
			},
			{
				name: 'amount',
				typeLabel: '{underline amount}',
				description: 'The amount to buy/sell. Defaults to full balance'
			},
			{
				name: 'order',
				typeLabel: '{underline order}',
				description: 'The id of the order'
			},
			{
				name: 'contract',
				typeLabel: '{underline contract}',
				description: 'The path to a solidity smart contract'
			},
			{
				name: 'risk',
				typeLabel: '{underline risk}',
				description: 'The percent risk to take in an auto long/short'
			},
			{
				name: 'reward',
				typeLabel: '{underline reward}',
				description: 'The percent reward to take in an auto long/short'
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
	binance: './lib/wallets/BinanceWallet',
	bitmex: './lib/wallets/BitmexWallet',
	coinbase: './lib/wallets/CoinbaseWallet',
	coinbasepro: './lib/wallets/CoinbaseProWallet',
	gdax: './lib/wallets/GdaxWallet',
	hitbtc: './lib/wallets/HitBTCWallet',
	nicehash: './lib/wallets/NicehashWallet',
	bancor: './lib/wallets/BancorWallet'
}[args.wallet];

fs.writeFileSync(__dirname + '/args.json', JSON.stringify(args));

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

	static get contractSymbol() {
		return args.contract;
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
