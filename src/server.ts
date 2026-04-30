import Fastify from "fastify";
import { startPriceEngine } from "./engine/priceEngine";
import { setupWebSocket } from "./realtime/websocket";
import { marketRoutes } from "./routes/marketRoutes";
import { orderRoutes } from "./routes/orderRoutes";

const app = Fastify({
  logger: true
});

app.register(marketRoutes);

app.register(orderRoutes);

app.get("/", async () => {
  return { status: "PhantomExchange running" };
});

const start = async () => {
  try {
    const server = await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });

    // Start market simulation
    startPriceEngine();

    // Attach WebSocket
    setupWebSocket(app.server);

    console.log("🚀 PhantomExchange started on 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
