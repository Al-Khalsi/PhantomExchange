import { WebSocketServer } from "ws";
import { marketStore } from "../store/marketStore";
import { registerPortfolioClient } from "./portfolioPublisher";
import { eventBus } from "../utils/eventBus";
import { orderBookStore } from "../store/orderBookStore";

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("client connected");

    // Store intervals for cleanup
    const intervals: NodeJS.Timeout[] = [];
    let subscribedSymbols: Set<string> = new Set();
    let depthInterval: NodeJS.Timeout | null = null;

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
    intervals.push(tickerInterval);

    // Handle client messages (subscriptions)
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // Subscribe to depth stream for a symbol
        if (msg.type === "SUBSCRIBE_DEPTH" && msg.symbol) {
          const symbol = msg.symbol.toUpperCase();
          subscribedSymbols.add(symbol);
          
          // If depth interval already exists, clear it to restart
          if (depthInterval) {
            clearInterval(depthInterval);
          }
          
          // Send depth updates every 1 second
          depthInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN && subscribedSymbols.size > 0) {
              for (const sym of subscribedSymbols) {
                try {
                  const book = orderBookStore.build(sym, 20);
                  ws.send(JSON.stringify({
                    type: "DEPTH_UPDATE",
                    symbol: sym,
                    data: {
                      bids: book.bids.slice(0, 10),
                      asks: book.asks.slice(0, 10),
                      timestamp: Date.now()
                    }
                  }));
                } catch (err) {
                  // Symbol might not exist, ignore
                }
              }
            }
          }, 1000);
          intervals.push(depthInterval);
        }
        
        // Unsubscribe from depth
        if (msg.type === "UNSUBSCRIBE_DEPTH" && msg.symbol) {
          const symbol = msg.symbol.toUpperCase();
          subscribedSymbols.delete(symbol);
          
          if (subscribedSymbols.size === 0 && depthInterval) {
            clearInterval(depthInterval);
            depthInterval = null;
          }
        }
        
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    });

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

      orderCancelled: (order: any) => {
        safeSend(ws, {
          type: "ORDER_CANCELLED",
          data: order,
        });
      },

      orderUpdated: (data: any) => {
        safeSend(ws, {
          type: "ORDER_UPDATED",
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

      positionUpdated: (position: any) => {
        safeSend(ws, {
          type: "POSITION_UPDATED",
          data: position,
        });
      },

      tradeExecuted: (trade: any) => {
        safeSend(ws, {
          type: "TRADE_EXECUTED",
          data: trade,
        });
      },
    };

    // Subscribe to eventBus
    eventBus.on("order:created", eventHandlers.orderCreated);
    eventBus.on("order:filled", eventHandlers.orderFilled);
    eventBus.on("order:rejected", eventHandlers.orderRejected);
    eventBus.on("order:cancelled", eventHandlers.orderCancelled);
    eventBus.on("order:updated", eventHandlers.orderUpdated);
    eventBus.on("position:opened", eventHandlers.positionOpened);
    eventBus.on("position:closed", eventHandlers.positionClosed);
    eventBus.on("position:updated", eventHandlers.positionUpdated);
    eventBus.on("trade:executed", eventHandlers.tradeExecuted);

    // Cleanup when client disconnects
    ws.on("close", () => {
      // Clear all intervals
      intervals.forEach(interval => clearInterval(interval));
      if (depthInterval) clearInterval(depthInterval);
      
      console.log("client disconnected");

      // Remove all event listeners
      eventBus.off("order:created", eventHandlers.orderCreated);
      eventBus.off("order:filled", eventHandlers.orderFilled);
      eventBus.off("order:rejected", eventHandlers.orderRejected);
      eventBus.off("order:cancelled", eventHandlers.orderCancelled);
      eventBus.off("order:updated", eventHandlers.orderUpdated);
      eventBus.off("position:opened", eventHandlers.positionOpened);
      eventBus.off("position:closed", eventHandlers.positionClosed);
      eventBus.off("position:updated", eventHandlers.positionUpdated);
      eventBus.off("trade:executed", eventHandlers.tradeExecuted);
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