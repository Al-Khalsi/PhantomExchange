import { FastifyInstance } from "fastify";
import { marketStore } from "../store/marketStore";
import { marketDataStore } from "../store/marketDataStore";

export async function marketRoutes(app: FastifyInstance) {

  // Existing: Get all tickers
  app.get("/market/tickers", async () => {
    return marketStore.getAll();
  });

  // Existing: Get single ticker
  app.get("/market/ticker/:symbol", async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    const ticker = marketStore.get(symbol.toUpperCase());

    if (!ticker)
      return reply.status(404).send({ error: "Symbol not found" });

    return ticker;
  });

  // OHLCV API (uses MarketDataStore)
  app.get("/market/ohlcv", async (req: any, reply) => {
    const { symbol, timeframe } = req.query;

    if (!symbol || !timeframe) {
      return reply.status(400).send({
        error: "symbol and timeframe are required"
      });
    }

    const data = marketDataStore.get(symbol.toUpperCase(), timeframe);

    return {
      symbol,
      timeframe,
      data
    };
  });

  // Last Candle API
  app.get("/market/last-candle", async (req: any, reply) => {
    const { symbol, timeframe } = req.query;

    if (!symbol || !timeframe) {
      return reply.status(400).send({
        error: "symbol and timeframe are required"
      });
    }

    const candle = marketDataStore.getLast(symbol.toUpperCase(), timeframe);

    if (!candle) {
      return reply.status(404).send({
        error: "Candle not found"
      });
    }

    return candle;
  });
}
