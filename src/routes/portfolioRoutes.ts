import { FastifyInstance } from "fastify";
import { portfolioStore } from "../store/portfolioStore";

export async function portfolioRoutes(app: FastifyInstance) {
    app.get("/portfolio", async () => {
        return portfolioStore.getPortfolio();
    });
}
