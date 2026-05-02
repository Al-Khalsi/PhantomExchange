import { FastifyInstance } from "fastify"
import { candleStore } from "../store/candleStore"

export async function candleRoutes(app: FastifyInstance) {
  app.get("/candles", async (req: any) => {
    const { symbol, interval } = req.query

    if (!symbol || !interval) {
      return { error: "symbol and interval are required" }
    }

    const candles = candleStore.getCandles(symbol, interval)
    return candles
  })
}
