import { FastifyInstance } from "fastify";
import { marketStore } from "../store/marketStore";

export async function marketRoutes(app: FastifyInstance) {
  // Get all tickers
  app.get("/market/tickers", async () => {
    return marketStore.getAll();
  });

  // Get single ticker
  app.get("/market/ticker/:symbol", async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    const ticker = marketStore.get(symbol.toUpperCase());

    if (!ticker) {
      return reply.status(404).send({ error: "Symbol not found" });
    }

    return ticker;
  });
}
