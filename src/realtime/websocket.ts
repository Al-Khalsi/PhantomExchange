import { WebSocketServer } from "ws";
import { marketStore } from "../store/marketStore";
import { registerPortfolioClient } from "./portfolioPublisher";
import { eventBus } from "../utils/eventBus";

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("client connected");

    // Register client for portfolio live updates
    registerPortfolioClient(ws);

    // Send ticker updates every 500ms
    const tickerInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: "TICKER_UPDATE",
            data: marketStore.getAll(),
          })
        );
      }
    }, 500);

    // Event-driven: Forward exchange events → WS
    const eventHandlers = {
      orderCreated: (order: any) => {
        safeSend(ws, {
          type: "ORDER_CREATED",
          data: order,
        });
      },

      orderFilled: (order: any) => {
        safeSend(ws, {
          type: "ORDER_FILLED",
          data: order,
        });
      },

      orderRejected: (data: any) => {
        safeSend(ws, {
          type: "ORDER_REJECTED",
          data,
        });
      },

      positionOpened: (position: any) => {
        safeSend(ws, {
          type: "POSITION_OPENED",
          data: position,
        });
      },

      positionClosed: (position: any) => {
        safeSend(ws, {
          type: "POSITION_CLOSED",
          data: position,
        });
      },
    };

    // Subscribe to eventBus
    eventBus.on("order:created", eventHandlers.orderCreated);
    eventBus.on("order:filled", eventHandlers.orderFilled);
    eventBus.on("order:rejected", eventHandlers.orderRejected);
    eventBus.on("position:opened", eventHandlers.positionOpened);
    eventBus.on("position:closed", eventHandlers.positionClosed);

    // Cleanup when client disconnects
    ws.on("close", () => {
      clearInterval(tickerInterval);
      console.log("client disconnected");

      eventBus.off("order:created", eventHandlers.orderCreated);
      eventBus.off("order:filled", eventHandlers.orderFilled);
      eventBus.off("order:rejected", eventHandlers.orderRejected);
      eventBus.off("position:opened", eventHandlers.positionOpened);
      eventBus.off("position:closed", eventHandlers.positionClosed);
    });
  });
}

// Helper: safe JSON WebSocket send
function safeSend(ws: any, payload: any) {
  if (ws.readyState !== ws.OPEN) return;

  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    console.error("WS send error:", err);
  }
}