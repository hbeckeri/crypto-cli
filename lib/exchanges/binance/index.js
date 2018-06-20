const CCXTExchange = require('../../CCXTExchange');
const ccxt = require('ccxt');

const ExchangeClient = new ccxt.binance({
	apiKey: process.env.BINANCE_API_KEY,
	secret: process.env.BINANCE_API_SECRET
});

class BinanceExchange extends CCXTExchange {
	static get exchange() {
		return ExchangeClient;
	}
}

module.exports = BinanceExchange;
