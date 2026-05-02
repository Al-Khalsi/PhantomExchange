import { FastifyInstance } from "fastify";
import { orderBookStore } from "../store/orderBookStore";
import { marketDataStore } from "../store/marketDataStore";

export async function orderBookRoutes(fastify: FastifyInstance) {

  fastify.get("/market/orderbook", async (request, reply) => {

    const { symbol = "BTCUSDT", depth = "20" } = request.query as {
      symbol?: string
      depth?: string
    };

    try {

      const price = marketDataStore.getPrice(symbol);
      const book = orderBookStore.generate(symbol, price, Number(depth));

      return book;

    } catch (err) {

      reply.code(400);

      return {
        error: "Symbol not found or price not initialized"
      };

    }

  });

}
