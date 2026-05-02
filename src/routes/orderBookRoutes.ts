import { FastifyInstance } from "fastify";
import { orderBookStore } from "../store/orderBookStore";

export async function orderBookRoutes(fastify: FastifyInstance) {
  fastify.get("/market/orderbook", async (request, reply) => {
    const { symbol = "BTCUSDT", depth = "20" } = request.query as {
      symbol?: string;
      depth?: string;
    };

    const depthNum = parseInt(depth, 10);
    
    try {
      // Build real orderbook from open orders
      const book = orderBookStore.build(symbol.toUpperCase(), depthNum);
      return book;
    } catch (err) {
      reply.code(400);
      return {
        error: "Failed to build orderbook for symbol"
      };
    }
  });
}