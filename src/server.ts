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

const app = Fastify({ logger: true });

// Register routes
app.register(marketRoutes);
app.register(orderRoutes);
app.register(portfolioRoutes);
app.register(accountRoutes);
app.register(candleRoutes);
app.register(orderBookRoutes);

app.get("/", async () => ({ status: "PhantomExchange running" }));

// Start server
const start = async () => {
  try {
    // Inject mock 1h OHLCV
    marketDataStore.set("BTCUSDT", "1h", generateMockCandles(62000, 200));
    marketDataStore.set("ETHUSDT", "1h", generateMockCandles(3200, 200));

    // Listen
    const server = await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });

    // Setup event listeners
    setupEventListeners();

    // Start price engine (L1 tick data)
    startPriceEngine();

    // Start candle engine (1m + aggregation)
    startCandleEngine();

    // WebSocket system
    setupWebSocket(app.server);

    app.log.info("🚀 PhantomExchange started on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();