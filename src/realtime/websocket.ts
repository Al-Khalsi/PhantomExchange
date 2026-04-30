import { WebSocketServer } from "ws";
import { marketStore } from "../store/marketStore";

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("client connected");

    const interval = setInterval(() => {
      ws.send(
        JSON.stringify({
          type: "TICKER_UPDATE",
          data: marketStore.getAll()
        })
      );
    }, 500);

    ws.on("close", () => {
      clearInterval(interval);
      console.log("client disconnected");
    });
  });
}
