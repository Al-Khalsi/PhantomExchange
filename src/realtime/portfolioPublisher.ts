import WebSocket from "ws";
import { portfolioStore } from "../store/portfolioStore";

let clients: Set<WebSocket> = new Set();

export function registerPortfolioClient(ws: WebSocket) {
  clients.add(ws);

  ws.on("close", () => {
    clients.delete(ws);
  });
}

export function broadcastPortfolioUpdate() {
  const payload = JSON.stringify({
    type: "portfolio:update",
    data: portfolioStore.getPortfolio()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
