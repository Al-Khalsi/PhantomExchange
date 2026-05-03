export interface SymbolConfig {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  basePrice: number;
  volatility: number;      // Volatility factor for price updates
  minQty: number;
  stepSize: number;
}

export const SYMBOLS: SymbolConfig[] = [
  // Major Coins
  { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", basePrice: 65000, volatility: 0.002, minQty: 0.0001, stepSize: 0.0001 },
  { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT", basePrice: 3200, volatility: 0.003, minQty: 0.001, stepSize: 0.001 },
  { symbol: "BNBUSDT", baseAsset: "BNB", quoteAsset: "USDT", basePrice: 600, volatility: 0.004, minQty: 0.01, stepSize: 0.01 },
  { symbol: "SOLUSDT", baseAsset: "SOL", quoteAsset: "USDT", basePrice: 140, volatility: 0.005, minQty: 0.01, stepSize: 0.01 },
  { symbol: "XRPUSDT", baseAsset: "XRP", quoteAsset: "USDT", basePrice: 0.6, volatility: 0.006, minQty: 1, stepSize: 0.1 },
  
  // Layer 1 Coins
  { symbol: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT", basePrice: 0.45, volatility: 0.005, minQty: 1, stepSize: 0.1 },
  { symbol: "AVAXUSDT", baseAsset: "AVAX", quoteAsset: "USDT", basePrice: 35, volatility: 0.005, minQty: 0.1, stepSize: 0.01 },
  { symbol: "DOTUSDT", baseAsset: "DOT", quoteAsset: "USDT", basePrice: 7.5, volatility: 0.005, minQty: 0.1, stepSize: 0.01 },
  { symbol: "MATICUSDT", baseAsset: "MATIC", quoteAsset: "USDT", basePrice: 0.8, volatility: 0.006, minQty: 1, stepSize: 0.1 },
  { symbol: "ATOMUSDT", baseAsset: "ATOM", quoteAsset: "USDT", basePrice: 10, volatility: 0.005, minQty: 0.1, stepSize: 0.01 },
  { symbol: "NEARUSDT", baseAsset: "NEAR", quoteAsset: "USDT", basePrice: 5, volatility: 0.006, minQty: 0.1, stepSize: 0.01 },
  { symbol: "ALGOUSDT", baseAsset: "ALGO", quoteAsset: "USDT", basePrice: 0.18, volatility: 0.007, minQty: 1, stepSize: 0.1 },
  { symbol: "VETUSDT", baseAsset: "VET", quoteAsset: "USDT", basePrice: 0.025, volatility: 0.007, minQty: 10, stepSize: 1 },
  { symbol: "EGLDUSDT", baseAsset: "EGLD", quoteAsset: "USDT", basePrice: 45, volatility: 0.005, minQty: 0.01, stepSize: 0.01 },
  { symbol: "FTMUSDT", baseAsset: "FTM", quoteAsset: "USDT", basePrice: 0.65, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  
  // DeFi Coins
  { symbol: "UNIUSDT", baseAsset: "UNI", quoteAsset: "USDT", basePrice: 7, volatility: 0.006, minQty: 0.1, stepSize: 0.01 },
  { symbol: "AAVEUSDT", baseAsset: "AAVE", quoteAsset: "USDT", basePrice: 90, volatility: 0.005, minQty: 0.01, stepSize: 0.01 },
  { symbol: "LINKUSDT", baseAsset: "LINK", quoteAsset: "USDT", basePrice: 15, volatility: 0.005, minQty: 0.1, stepSize: 0.01 },
  { symbol: "CRVUSDT", baseAsset: "CRV", quoteAsset: "USDT", basePrice: 0.5, volatility: 0.007, minQty: 1, stepSize: 0.1 },
  { symbol: "CAKEUSDT", baseAsset: "CAKE", quoteAsset: "USDT", basePrice: 2.5, volatility: 0.008, minQty: 0.1, stepSize: 0.01 },
  { symbol: "SUSHIUSDT", baseAsset: "SUSHI", quoteAsset: "USDT", basePrice: 1.2, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "COMPUSDT", baseAsset: "COMP", quoteAsset: "USDT", basePrice: 50, volatility: 0.006, minQty: 0.01, stepSize: 0.01 },
  { symbol: "MKRUSDT", baseAsset: "MKR", quoteAsset: "USDT", basePrice: 1200, volatility: 0.005, minQty: 0.001, stepSize: 0.0001 },
  { symbol: "SNXUSDT", baseAsset: "SNX", quoteAsset: "USDT", basePrice: 3, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "LDOUSDT", baseAsset: "LDO", quoteAsset: "USDT", basePrice: 2, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  
  // Meme Coins
  { symbol: "DOGEUSDT", baseAsset: "DOGE", quoteAsset: "USDT", basePrice: 0.12, volatility: 0.01, minQty: 10, stepSize: 1 },
  { symbol: "SHIBUSDT", baseAsset: "SHIB", quoteAsset: "USDT", basePrice: 0.00002, volatility: 0.012, minQty: 100000, stepSize: 10000 },
  { symbol: "PEPEUSDT", baseAsset: "PEPE", quoteAsset: "USDT", basePrice: 0.00001, volatility: 0.015, minQty: 100000, stepSize: 10000 },
  { symbol: "FLOKIUSDT", baseAsset: "FLOKI", quoteAsset: "USDT", basePrice: 0.0002, volatility: 0.012, minQty: 10000, stepSize: 1000 },
  { symbol: "BONKUSDT", baseAsset: "BONK", quoteAsset: "USDT", basePrice: 0.000025, volatility: 0.014, minQty: 100000, stepSize: 10000 },
  { symbol: "WIFUSDT", baseAsset: "WIF", quoteAsset: "USDT", basePrice: 2.5, volatility: 0.01, minQty: 0.1, stepSize: 0.01 },
  
  // Gaming Coins
  { symbol: "SANDUSDT", baseAsset: "SAND", quoteAsset: "USDT", basePrice: 0.45, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  { symbol: "MANAUSDT", baseAsset: "MANA", quoteAsset: "USDT", basePrice: 0.5, volatility: 0.007, minQty: 1, stepSize: 0.1 },
  { symbol: "AXSUSDT", baseAsset: "AXS", quoteAsset: "USDT", basePrice: 7, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "GALAUSDT", baseAsset: "GALA", quoteAsset: "USDT", basePrice: 0.03, volatility: 0.009, minQty: 10, stepSize: 1 },
  { symbol: "ENJUSDT", baseAsset: "ENJ", quoteAsset: "USDT", basePrice: 0.35, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  { symbol: "ILVUSDT", baseAsset: "ILV", quoteAsset: "USDT", basePrice: 80, volatility: 0.006, minQty: 0.01, stepSize: 0.01 },
  
  // Layer 2 Coins
  { symbol: "ARBUSDT", baseAsset: "ARB", quoteAsset: "USDT", basePrice: 1.2, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "OPUSDT", baseAsset: "OP", quoteAsset: "USDT", basePrice: 2.5, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "METISUSDT", baseAsset: "METIS", quoteAsset: "USDT", basePrice: 60, volatility: 0.006, minQty: 0.01, stepSize: 0.01 },
  { symbol: "BOBAUSDT", baseAsset: "BOBA", quoteAsset: "USDT", basePrice: 0.25, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  
  // Storage Coins
  { symbol: "FILUSDT", baseAsset: "FIL", quoteAsset: "USDT", basePrice: 5, volatility: 0.006, minQty: 0.1, stepSize: 0.01 },
  { symbol: "ARUSDT", baseAsset: "AR", quoteAsset: "USDT", basePrice: 12, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "BLZUSDT", baseAsset: "BLZ", quoteAsset: "USDT", basePrice: 0.15, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  
  // Oracle Coins
  { symbol: "PYTHUSDT", baseAsset: "PYTH", quoteAsset: "USDT", basePrice: 0.4, volatility: 0.007, minQty: 1, stepSize: 0.1 },
  { symbol: "API3USDT", baseAsset: "API3", quoteAsset: "USDT", basePrice: 2, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  
  // AI Coins
  { symbol: "FETUSDT", baseAsset: "FET", quoteAsset: "USDT", basePrice: 2.2, volatility: 0.008, minQty: 0.1, stepSize: 0.01 },
  { symbol: "AGIXUSDT", baseAsset: "AGIX", quoteAsset: "USDT", basePrice: 0.8, volatility: 0.009, minQty: 0.1, stepSize: 0.01 },
  { symbol: "OCEANUSDT", baseAsset: "OCEAN", quoteAsset: "USDT", basePrice: 0.6, volatility: 0.008, minQty: 0.1, stepSize: 0.01 },
  
  // Other Popular Coins
  { symbol: "RNDRUSDT", baseAsset: "RNDR", quoteAsset: "USDT", basePrice: 8, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "GRTUSDT", baseAsset: "GRT", quoteAsset: "USDT", basePrice: 0.2, volatility: 0.008, minQty: 1, stepSize: 0.1 },
  { symbol: "CHZUSDT", baseAsset: "CHZ", quoteAsset: "USDT", basePrice: 0.1, volatility: 0.009, minQty: 1, stepSize: 0.1 },
  { symbol: "1INCHUSDT", baseAsset: "1INCH", quoteAsset: "USDT", basePrice: 0.45, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "KAVAUSDT", baseAsset: "KAVA", quoteAsset: "USDT", basePrice: 0.7, volatility: 0.007, minQty: 0.1, stepSize: 0.01 },
  { symbol: "ZILUSDT", baseAsset: "ZIL", quoteAsset: "USDT", basePrice: 0.025, volatility: 0.008, minQty: 10, stepSize: 1 },
];

export const getSymbolConfig = (symbol: string): SymbolConfig | undefined => {
  return SYMBOLS.find(s => s.symbol === symbol);
};

export const getAllSymbols = (): string[] => {
  return SYMBOLS.map(s => s.symbol);
};