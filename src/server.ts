import Fastify from "fastify";
import { startPriceEngine } from "./engine/priceEngine";
import { startCandleEngine } from "./engine/candleEngine";
import { setupWebSocket } from "./realtime/websocket";
import { setupEventListeners } from "./realtime/eventListener";
import { marketRoutes } from "./routes/marketRoutes";
import { orderRoutes } from "./routes/orderRoutes";
import { portfolioRoutes } from "./routes/portfolioRoutes";
import { accountRoutes } from "./routes/accountRoutes";
import { candleRoutes } from "./routes/candleRoutes";
import { marketDataStore } from "./store/marketDataStore";
import { generateMockCandles } from "./utils/mockMarketData";
import { orderBookRoutes } from "./routes/orderBookRoutes";
import { tradeRoutes } from "./routes/tradeRoutes";
import positionRoutes from "./routes/positionRoutes";
import activityLogRoutes from "./routes/activityLogRoutes";
import reportRoutes from "./routes/reportRoutes";
import { SYMBOLS } from "./config/symbols";

const app = Fastify({ logger: true });

// Register all routes
app.register(marketRoutes);
app.register(orderRoutes);
app.register(portfolioRoutes);
app.register(accountRoutes);
app.register(candleRoutes);
app.register(orderBookRoutes);
app.register(tradeRoutes);
app.register(positionRoutes);
app.register(activityLogRoutes);
app.register(reportRoutes);

app.get("/", async () => ({ 
  status: "PhantomExchange running - Futures Mode",
  symbols: SYMBOLS.length,
  leverage: "1x - 100x"
}));

// Start server
const start = async () => {
  try {
    // Inject mock 1h OHLCV for all symbols
    console.log(`📊 Loading historical data for ${SYMBOLS.length} symbols...`);
    
    for (const config of SYMBOLS) {
      marketDataStore.set(
        config.symbol, 
        "1h", 
        generateMockCandles(config.basePrice, 200)
      );
    }

    // Listen
    const server = await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });

    // Setup event listeners
    setupEventListeners();

    // Start price engine (L1 tick data for 50 pairs)
    startPriceEngine();

    // Start candle engine (1m + aggregation)
    startCandleEngine();

    // WebSocket system
    setupWebSocket(app.server);

    app.log.info(`PhantomExchange Futures started on port 3000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();