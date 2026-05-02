import { Order, OrderSide, OrderType, OrderStatus, orderStore } from "../store/orderStore";
import { portfolioStore } from "../store/portfolioStore";
import { eventBus } from "../utils/eventBus";

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: string;
}

class TradeStore {
  private trades: Trade[] = [];

  add(trade: Trade): void {
    this.trades.push(trade);
  }

  getAll(): Trade[] {
    return this.trades;
  }
}

export const tradeStore = new TradeStore();

// Match a new order against existing open orders
export function matchOrder(newOrder: Order): void {
  if (newOrder.status !== "OPEN") return;
  if (newOrder.type === "MARKET") {
    executeMarketOrder(newOrder);
  } else if (newOrder.type === "LIMIT") {
    matchLimitOrder(newOrder);
  }
}

// Execute MARKET order immediately at best available price
function executeMarketOrder(marketOrder: Order): void {
  const symbol = marketOrder.symbol;
  const isBuy = marketOrder.side === "BUY";
  
  let remainingQty = marketOrder.quantity - marketOrder.filledQuantity;
  if (remainingQty <= 0) return;

  // Get opposite side open orders
  const oppositeOrders = isBuy
    ? orderStore.getSellOpenOrders(symbol)
    : orderStore.getBuyOpenOrders(symbol);
  
  // For MARKET, we take the best price (lowest ask for BUY, highest bid for SELL)
  const sortedOpposite = isBuy
    ? [...oppositeOrders].sort((a, b) => a.price - b.price) // Buy takes lowest ask
    : [...oppositeOrders].sort((a, b) => b.price - a.price); // Sell takes highest bid

  for (const oppositeOrder of sortedOpposite) {
    if (remainingQty <= 0) break;

    const fillQty = Math.min(remainingQty, oppositeOrder.quantity - oppositeOrder.filledQuantity);
    const fillPrice = oppositeOrder.price;
    
    // Execute trade
    executeTrade(marketOrder, oppositeOrder, fillPrice, fillQty);
    
    remainingQty -= fillQty;
  }

  // Update remaining quantity
  marketOrder.filledQuantity = marketOrder.quantity - remainingQty;
  
  if (marketOrder.filledQuantity >= marketOrder.quantity) {
    marketOrder.status = "FILLED";
  } else if (marketOrder.filledQuantity > 0) {
    marketOrder.status = "PARTIALLY_FILLED";
  } else {
    marketOrder.status = "CANCELLED"; // MARKET order with no liquidity gets cancelled
  }
  
  orderStore.updateOrder(marketOrder);
}

// Match LIMIT order against existing open orders
function matchLimitOrder(limitOrder: Order): void {
  const symbol = limitOrder.symbol;
  const isBuy = limitOrder.side === "BUY";
  
  let remainingQty = limitOrder.quantity - limitOrder.filledQuantity;
  if (remainingQty <= 0) return;

  // Get opposite side open orders that are price-compatible
  let oppositeOrders = isBuy
    ? orderStore.getSellOpenOrders(symbol).filter(o => o.price <= limitOrder.price) // Buy limit: price >= ask
    : orderStore.getBuyOpenOrders(symbol).filter(o => o.price >= limitOrder.price); // Sell limit: price <= bid
  
  // Sort by price priority (best price first)
  oppositeOrders = isBuy
    ? [...oppositeOrders].sort((a, b) => a.price - b.price) // Lowest ask first for buy
    : [...oppositeOrders].sort((a, b) => b.price - a.price); // Highest bid first for sell

  for (const oppositeOrder of oppositeOrders) {
    if (remainingQty <= 0) break;

    const fillQty = Math.min(remainingQty, oppositeOrder.quantity - oppositeOrder.filledQuantity);
    const fillPrice = oppositeOrder.price;
    
    // Execute trade
    executeTrade(limitOrder, oppositeOrder, fillPrice, fillQty);
    
    remainingQty -= fillQty;
  }

  // Update limit order
  limitOrder.filledQuantity = limitOrder.quantity - remainingQty;
  
  if (limitOrder.filledQuantity >= limitOrder.quantity) {
    limitOrder.status = "FILLED";
  } else if (limitOrder.filledQuantity > 0) {
    limitOrder.status = "PARTIALLY_FILLED";
  } else {
    limitOrder.status = "OPEN"; // Still open
  }
  
  orderStore.updateOrder(limitOrder);
}

// Execute a single trade between two orders
function executeTrade(buyerOrder: Order, sellerOrder: Order, price: number, quantity: number): void {
  // Determine which is buy and which is sell
  const isBuyerFirst = buyerOrder.side === "BUY";
  const buyOrder = isBuyerFirst ? buyerOrder : sellerOrder;
  const sellOrder = isBuyerFirst ? sellerOrder : buyerOrder;
  
  // Update filled quantities
  buyOrder.filledQuantity += quantity;
  sellOrder.filledQuantity += quantity;
  
  // Update order statuses
  if (buyOrder.filledQuantity >= buyOrder.quantity) {
    buyOrder.status = "FILLED";
  } else {
    buyOrder.status = "PARTIALLY_FILLED";
  }
  
  if (sellOrder.filledQuantity >= sellOrder.quantity) {
    sellOrder.status = "FILLED";
  } else {
    sellOrder.status = "PARTIALLY_FILLED";
  }
  
  orderStore.updateOrder(buyOrder);
  orderStore.updateOrder(sellOrder);
  
  // Update portfolio (open/close positions)
  if (buyOrder.type === "MARKET" || sellOrder.type === "MARKET" || buyOrder.type === "LIMIT" || sellOrder.type === "LIMIT") {
    // For a trade, the BUY opens/increases LONG position
    // The SELL closes/reduces LONG position
    const position = portfolioStore.getOpenPosition(buyOrder.symbol);
    
    if (position && position.status === "OPEN" && position.side === "LONG") {
      // If we have an existing LONG position
      if (sellOrder.filledQuantity > 0) {
        // Closing some quantity - need to handle partial closing
        // For simplicity, we close the full position for now
        // TODO: Implement partial closing logic
        portfolioStore.closePosition(buyOrder.symbol, price);
      }
    }
    
    // Simple logic: BUY order opens a new position
    // SELL order closes the position
    // This matches current simple portfolio logic
  }
  
  // Create trade record
  const trade: Trade = {
    id: `${buyOrder.id}-${sellOrder.id}-${Date.now()}`,
    symbol: buyOrder.symbol,
    price,
    quantity,
    buyerOrderId: buyOrder.id,
    sellerOrderId: sellOrder.id,
    timestamp: new Date().toISOString(),
  };
  
  tradeStore.add(trade);
  
  // Emit events
  eventBus.emit("trade:executed", trade);
  eventBus.emit("order:updated", { orderId: buyOrder.id, status: buyOrder.status });
  eventBus.emit("order:updated", { orderId: sellOrder.id, status: sellOrder.status });
}