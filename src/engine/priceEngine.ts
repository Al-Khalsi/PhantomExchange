import { marketStore, Ticker } from "../store/marketStore";
import { portfolioStore } from "../store/portfolioStore";
import { SYMBOLS, getSymbolConfig } from "../config/symbols";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function initializeMarket() {
  SYMBOLS.forEach((config) => {
    const { symbol, basePrice, volatility } = config;
    
    const initialVariation = randomBetween(-0.1, 0.1);
    const initialPrice = basePrice * (1 + initialVariation);
    
    marketStore.set(symbol, {
      symbol,
      price: Number(initialPrice.toFixed(8)),
      change24h: randomBetween(-5, 5),
      volume24h: randomBetween(100000, 900000000),
      high24h: initialPrice * 1.05,
      low24h: initialPrice * 0.95
    });
  });
  
  console.log(`✅ Initialized ${SYMBOLS.length} trading pairs`);
}

function updatePrices() {
  const tickers = marketStore.getAll();

  tickers.forEach((ticker: Ticker) => {
    const config = getSymbolConfig(ticker.symbol);
    if (!config) return;
    
    const volatility = ticker.price * config.volatility;
    const change = randomBetween(-volatility, volatility);
    const newPrice = Math.max(0.0000001, ticker.price + change);
    
    const newHigh = Math.max(ticker.high24h, newPrice);
    const newLow = Math.min(ticker.low24h, newPrice);
    
    const updated: Ticker = {
      ...ticker,
      price: Number(newPrice.toFixed(8)),
      change24h: Number(((ticker.change24h || 0) + (change / ticker.price) * 100).toFixed(2)),
      high24h: newHigh,
      low24h: newLow,
      volume24h: ticker.volume24h + randomBetween(1000, 100000)
    };

    marketStore.set(ticker.symbol, updated);

    portfolioStore.updatePrice(ticker.symbol, updated.price);
  });
}

export function startPriceEngine() {
  initializeMarket();
  console.log("🚀 Price engine started - updating pairs every 500ms");

  setInterval(() => {
    updatePrices();
  }, 500);
}