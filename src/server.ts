import Fastify from "fastify";
import { startPriceEngine } from "./engine/priceEngine";
import { setupWebSocket } from "./realtime/websocket";
import { marketRoutes } from "./routes/marketRoutes";
import { orderRoutes } from "./routes/orderRoutes";
import { portfolioRoutes } from "./routes/portfolioRoutes";
import { setupEventListeners } from "./realtime/eventListener";

const app = Fastify({
  logger: true
});

// Register Routes
app.register(marketRoutes);
app.register(orderRoutes);
app.register(portfolioRoutes);

app.get("/", async () => {
  return { status: "PhantomExchange running" };
});

// Start Server
const start = async () => {
  try {

    const server = await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });

    // Setup Event System
    setupEventListeners();

    // Start Market Price Simulation
    startPriceEngine();

    // Setup WebSocket
    setupWebSocket(app.server);

    app.log.info("🚀 PhantomExchange started on port 3000");

  } catch (err) {

    app.log.error(err);
    process.exit(1);

  }
};

start();
