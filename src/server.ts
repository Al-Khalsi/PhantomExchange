import Fastify from "fastify";
import { startPriceEngine } from "./engine/priceEngine";
import { setupWebSocket } from "./realtime/websocket";
import { setupEventListeners } from "./realtime/eventListener";
import { marketRoutes } from "./routes/marketRoutes";
import { orderRoutes } from "./routes/orderRoutes";
import { portfolioRoutes } from "./routes/portfolioRoutes";
import { accountRoutes } from "./routes/accountRoutes";
import { orderBookRoutes } from "./routes/orderBookRoutes";
import { tradeRoutes } from "./routes/tradeRoutes";
import positionRoutes from "./routes/positionRoutes";
import activityLogRoutes from "./routes/activityLogRoutes";
import reportRoutes from "./routes/reportRoutes";
import { networkRoutes } from "./routes/networkRoutes";
import { networkBalanceStore } from "./store/networkBalanceStore";
import { SYMBOLS } from "./config/symbols";
import { NETWORKS } from "./config/networks";

const app = Fastify({ logger: true });

app.register(marketRoutes);
app.register(orderRoutes);
app.register(portfolioRoutes);
app.register(accountRoutes);
app.register(orderBookRoutes);
app.register(tradeRoutes);
app.register(positionRoutes);
app.register(activityLogRoutes);
app.register(reportRoutes);
app.register(networkRoutes);

app.get("/", async () => ({
  status: "PhantomExchange Running - Futures Mode",
  version: "1.1.0",
  symbols: SYMBOLS.length,
  networks: NETWORKS.filter((n) => n.isActive).length,
  leverage: "1x - 100x",
  priceEngine: "Realistic with BTC correlation & momentum",
}));

const start = async () => {
  try {
    networkBalanceStore.initializeDefaultBalances();
    console.log("[Server] Network balances initialized");

    const server = await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    setupEventListeners();
    startPriceEngine();
    setupWebSocket(app.server);

    app.log.info("[Server] PhantomExchange Futures started on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
