import Fastify from "fastify";
import { startPriceEngine } from "./engine/priceEngine";
import { setupWebSocket } from "./realtime/websocket";

const app = Fastify({
  logger: true
});

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
