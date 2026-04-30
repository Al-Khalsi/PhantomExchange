import { marketStore } from "../store/marketStore";
import { portfolioStore } from "../store/portfolioStore";

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function initializeMarket() {
  symbols.forEach((symbol) => {
    const basePrice =
      symbol === "BTCUSDT"
        ? 65000
        : symbol === "ETHUSDT"
        ? 3200
        : symbol === "SOLUSDT"
        ? 140
        : symbol === "BNBUSDT"
        ? 600
        : 0.6;

    marketStore.set(symbol, {
      symbol,
      price: basePrice,
      change24h: 0,
      volume24h: randomBetween(100_000_000, 900_000_000)
    });
  });
}

function updatePrices() {
  const tickers = marketStore.getAll();

  tickers.forEach((ticker) => {
    const volatility = ticker.price * 0.001;
    const change = randomBetween(-volatility, volatility);
    const newPrice = Math.max(0.0001, ticker.price + change);

    const updated = {
      ...ticker,
      price: Number(newPrice.toFixed(2)),
      change24h: Number((ticker.change24h + change).toFixed(2))
    };

    marketStore.set(ticker.symbol, updated);

    // Update unrealized PnL for this symbol
    portfolioStore.updateUnrealizedPnL(updated.price);
  });
}

export function startPriceEngine() {
  initializeMarket();

  setInterval(() => {
    updatePrices();
  }, 500);
}
