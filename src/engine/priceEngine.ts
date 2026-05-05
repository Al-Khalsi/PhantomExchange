import { marketStore, Ticker } from "../store/marketStore";
import { portfolioStore } from "../store/portfolioStore";
import { SYMBOLS, getSymbolConfig, SymbolConfig } from "../config/symbols";

interface PriceState {
  lastChange: number;
  momentum: number;
  volatilityRegime: "low" | "normal" | "high";
  lastUpdate: number;
}

class RealisticPriceEngine {
  private states: Map<string, PriceState> = new Map();
  private btcBasePrice: number = 65000;
  private lastBtcChangePercent: number = 0;

  constructor() {
    SYMBOLS.forEach((symbol) => {
      this.states.set(symbol.symbol, {
        lastChange: 0,
        momentum: 0,
        volatilityRegime: "normal",
        lastUpdate: Date.now(),
      });
    });
  }

  private randomLaplace(scale: number): number {
    const u = Math.random() - 0.5;
    if (Math.abs(u) < 1e-9) return 0;
    return (
      scale *
      (u > 0 ? -Math.log(1 - 2 * Math.abs(u)) : Math.log(1 - 2 * Math.abs(u)))
    );
  }

  private getVolatilityMultiplier(regime: "low" | "normal" | "high"): number {
    switch (regime) {
      case "low":
        return 0.5;
      case "high":
        return 2.2;
      default:
        return 1.0;
    }
  }

  private updateVolatilityRegime(
    symbol: string,
    changePercent: number,
  ): "low" | "normal" | "high" {
    const absChange = Math.abs(changePercent);
    if (absChange > 0.008) return "high";
    if (absChange > 0.0025) return "normal";
    return "low";
  }

  private calculateBeta(symbol: string): number {
    const baseSymbol = symbol.replace("USDT", "");
    const highBetaCoins = ["ETH", "SOL", "AVAX", "MATIC"];
    const midBetaCoins = ["BNB", "XRP", "ADA", "DOT", "LINK"];
    const lowBetaCoins = ["USDC", "USDT", "DAI", "BUSD"];

    if (highBetaCoins.includes(baseSymbol)) return 0.85;
    if (midBetaCoins.includes(baseSymbol)) return 0.7;
    if (lowBetaCoins.includes(baseSymbol)) return 0.15;

    const memeCoins = ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"];
    if (memeCoins.includes(baseSymbol)) return 0.9;

    const gamingCoins = ["SAND", "MANA", "AXS", "GALA", "ENJ", "ILV"];
    if (gamingCoins.includes(baseSymbol)) return 0.75;

    return 0.6;
  }

  private calculateAlpha(symbol: string): number {
    const baseSymbol = symbol.replace("USDT", "");
    const highVolCoins = ["PEPE", "BONK", "WIF", "FLOKI", "SHIB"];
    const lowVolCoins = ["USDC", "DAI", "BUSD"];

    if (highVolCoins.includes(baseSymbol)) return 1.5;
    if (lowVolCoins.includes(baseSymbol)) return 0.2;
    return 1.0;
  }

  private applyMeanReversion(
    currentPrice: number,
    initialBasePrice: number,
    config: SymbolConfig,
  ): number {
    const deviation = (currentPrice - initialBasePrice) / initialBasePrice;
    if (Math.abs(deviation) > 0.15) {
      return currentPrice * (1 - deviation * 0.05);
    }
    return currentPrice;
  }

  private generatePriceChangeForBTC(
    ticker: Ticker,
    config: SymbolConfig,
  ): number {
    const state = this.states.get("BTCUSDT")!;
    const volMultiplier = this.getVolatilityMultiplier(state.volatilityRegime);
    const effectiveVol = ticker.price * config.volatility * volMultiplier;

    const randomComponent = this.randomLaplace(effectiveVol * 0.6);
    const momentumComponent = state.momentum * effectiveVol * 0.4;

    let change = randomComponent + momentumComponent;

    if (Math.abs(change) > ticker.price * 0.012) {
      change = (change > 0 ? 1 : -1) * ticker.price * 0.012;
    }

    return change;
  }

  private generatePriceChangeForAltcoin(
    ticker: Ticker,
    config: SymbolConfig,
    btcChangePercent: number,
    btcDirectionalBias: number,
  ): number {
    const state = this.states.get(ticker.symbol)!;
    const beta = this.calculateBeta(ticker.symbol);
    const alpha = this.calculateAlpha(ticker.symbol);
    const volMultiplier = this.getVolatilityMultiplier(state.volatilityRegime);

    const effectiveVol =
      ticker.price * config.volatility * volMultiplier * alpha;

    const btcInfluence = btcChangePercent * beta * ticker.price;
    const randomComponent = this.randomLaplace(effectiveVol * 0.5);
    const momentumComponent = state.momentum * effectiveVol * 0.3;
    const directionalBias = btcDirectionalBias * ticker.price * 0.001 * beta;

    let change =
      btcInfluence + randomComponent + momentumComponent + directionalBias;

    const maxChange = ticker.price * 0.025;
    if (Math.abs(change) > maxChange) {
      change = (change > 0 ? 1 : -1) * maxChange;
    }

    return change;
  }

  private updateMomentum(symbol: string, changePercent: number): void {
    const state = this.states.get(symbol)!;
    const newMomentum = state.momentum * 0.7 + changePercent * 0.3;
    state.momentum = Math.min(0.02, Math.max(-0.02, newMomentum));
    state.lastChange = changePercent;
    state.volatilityRegime = this.updateVolatilityRegime(symbol, changePercent);
    state.lastUpdate = Date.now();
  }

  initializeMarket(): void {
    SYMBOLS.forEach((config) => {
      const { symbol, basePrice, volatility } = config;

      const randomWalk = this.randomLaplace(volatility * basePrice * 2);
      const initialPrice = Math.max(0.0000001, basePrice + randomWalk);
      const roundedPrice = Number(initialPrice.toFixed(8));

      marketStore.set(symbol, {
        symbol,
        price: roundedPrice,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 800000000 + 100000,
        high24h: roundedPrice * (1 + Math.random() * 0.05),
        low24h: roundedPrice * (1 - Math.random() * 0.05),
      });

      if (symbol === "BTCUSDT") {
        this.btcBasePrice = roundedPrice;
      }
    });

    console.log(`[PriceEngine] Initialized ${SYMBOLS.length} trading pairs`);
  }

  updatePrices(): void {
    const tickers = marketStore.getAll();
    const btcTicker = tickers.find((t) => t.symbol === "BTCUSDT");

    if (!btcTicker) return;

    const btcConfig = getSymbolConfig("BTCUSDT")!;
    const btcChange = this.generatePriceChangeForBTC(btcTicker, btcConfig);
    const newBtcPrice = Math.max(0.0000001, btcTicker.price + btcChange);
    const btcChangePercent = (newBtcPrice - btcTicker.price) / btcTicker.price;

    this.updateMomentum("BTCUSDT", btcChangePercent);

    let btcDirectionalBias = 0;
    const btcState = this.states.get("BTCUSDT")!;
    if (Math.abs(btcState.momentum) > 0.005) {
      btcDirectionalBias = btcState.momentum * 100;
    }

    const roundedBtcPrice = Number(newBtcPrice.toFixed(8));
    const newBtcHigh = Math.max(btcTicker.high24h, roundedBtcPrice);
    const newBtcLow = Math.min(btcTicker.low24h, roundedBtcPrice);

    marketStore.set("BTCUSDT", {
      ...btcTicker,
      price: roundedBtcPrice,
      change24h: Number(
        ((btcTicker.change24h || 0) + btcChangePercent * 100).toFixed(2),
      ),
      high24h: newBtcHigh,
      low24h: newBtcLow,
      volume24h: btcTicker.volume24h + Math.random() * 50000 + 5000,
    });

    portfolioStore.updatePrice("BTCUSDT", roundedBtcPrice);

    const finalBtcPrice = roundedBtcPrice;
    const finalBtcChangePercent =
      (finalBtcPrice - this.btcBasePrice) / this.btcBasePrice;
    this.lastBtcChangePercent = finalBtcChangePercent;

    for (const ticker of tickers) {
      if (ticker.symbol === "BTCUSDT") continue;

      const config = getSymbolConfig(ticker.symbol);
      if (!config) continue;

      const change = this.generatePriceChangeForAltcoin(
        ticker,
        config,
        finalBtcChangePercent,
        btcDirectionalBias,
      );

      let newPrice = ticker.price + change;
      newPrice = Math.max(config.minQty, newPrice);
      newPrice = this.applyMeanReversion(newPrice, config.basePrice, config);

      const changePercent = (newPrice - ticker.price) / ticker.price;
      this.updateMomentum(ticker.symbol, changePercent);

      const roundedPrice = Number(newPrice.toFixed(8));
      const newHigh = Math.max(ticker.high24h, roundedPrice);
      const newLow = Math.min(ticker.low24h, roundedPrice);

      marketStore.set(ticker.symbol, {
        ...ticker,
        price: roundedPrice,
        change24h: Number(
          ((ticker.change24h || 0) + changePercent * 100).toFixed(2),
        ),
        high24h: newHigh,
        low24h: newLow,
        volume24h: ticker.volume24h + Math.random() * 20000 + 1000,
      });

      portfolioStore.updatePrice(ticker.symbol, roundedPrice);
    }
  }

  getStats(): Map<string, PriceState> {
    return this.states;
  }
}

export const priceEngine = new RealisticPriceEngine();

export function startPriceEngine(): void {
  priceEngine.initializeMarket();
  console.log("[PriceEngine] Started - updating prices every 800ms");

  setInterval(() => {
    priceEngine.updatePrices();
  }, 800);
}
