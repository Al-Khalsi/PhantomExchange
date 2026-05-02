import { Order, OrderSide, OrderType, OrderStatus, orderStore } from "../store/orderStore";
import { portfolioStore } from "../store/portfolioStore";
import { balanceStore } from "../store/balanceStore";
import { eventBus } from "../utils/eventBus";

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  quoteQty: number;
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: string;
  fee: number;
  feeAsset: string;
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
  
  // Lock balance before matching
  const symbol = newOrder.symbol;
  const baseAsset = symbol.replace("USDT", "");
  if (newOrder.side === "BUY") {
    if (!balanceStore.lock("USDT", newOrder.price * newOrder.quantity)) {
      newOrder.status = "CANCELLED";
      orderStore.updateOrder(newOrder);
      eventBus.emit("order:rejected", { orderId: newOrder.id, reason: "Insufficient balance" });
      return;
    }
  } else {
    if (!balanceStore.lock(baseAsset as any, newOrder.quantity)) {
      newOrder.status = "CANCELLED";
      orderStore.updateOrder(newOrder);
      eventBus.emit("order:rejected", { orderId: newOrder.id, reason: "Insufficient balance" });
      return;
    }
  }
  
  if (newOrder.type === "MARKET") {
    executeMarketOrder(newOrder);
  } else if (newOrder.type === "LIMIT") {
    matchLimitOrder(newOrder);
  }
}

function unlockRemaining(order: Order, price: number): void {
  const symbol = order.symbol;
  const baseAsset = symbol.replace("USDT", "");
  const remainingQty = order.quantity - order.filledQuantity;
  if (remainingQty <= 0) return;
  
  if (order.side === "BUY") {
    balanceStore.unlock("USDT", order.price * remainingQty);
  } else {
    balanceStore.unlock(baseAsset as any, remainingQty);
  }
}

// Execute MARKET order immediately at best available price
function executeMarketOrder(marketOrder: Order): void {
  const symbol = marketOrder.symbol;
  const isBuy = marketOrder.side === "BUY";
  
  let remainingQty = marketOrder.quantity - marketOrder.filledQuantity;
  if (remainingQty <= 0) return;

  const oppositeOrders = isBuy
    ? orderStore.getSellOpenOrders(symbol)
    : orderStore.getBuyOpenOrders(symbol);
  
  const sortedOpposite = isBuy
    ? [...oppositeOrders].sort((a, b) => a.price - b.price)
    : [...oppositeOrders].sort((a, b) => b.price - a.price);

  for (const oppositeOrder of sortedOpposite) {
    if (remainingQty <= 0) break;

    const fillQty = Math.min(remainingQty, oppositeOrder.quantity - oppositeOrder.filledQuantity);
    const fillPrice = oppositeOrder.price;
    
    executeTrade(marketOrder, oppositeOrder, fillPrice, fillQty);
    
    remainingQty -= fillQty;
  }

  marketOrder.filledQuantity = marketOrder.quantity - remainingQty;
  
  if (marketOrder.filledQuantity >= marketOrder.quantity) {
    marketOrder.status = "FILLED";
  } else if (marketOrder.filledQuantity > 0) {
    marketOrder.status = "PARTIALLY_FILLED";
  } else {
    marketOrder.status = "CANCELLED";
    unlockRemaining(marketOrder, 0);
  }
  
  orderStore.updateOrder(marketOrder);
}

// Match LIMIT order against existing open orders
function matchLimitOrder(limitOrder: Order): void {
  const symbol = limitOrder.symbol;
  const isBuy = limitOrder.side === "BUY";
  
  let remainingQty = limitOrder.quantity - limitOrder.filledQuantity;
  if (remainingQty <= 0) return;

  let oppositeOrders = isBuy
    ? orderStore.getSellOpenOrders(symbol).filter(o => o.price <= limitOrder.price)
    : orderStore.getBuyOpenOrders(symbol).filter(o => o.price >= limitOrder.price);
  
  oppositeOrders = isBuy
    ? [...oppositeOrders].sort((a, b) => a.price - b.price)
    : [...oppositeOrders].sort((a, b) => b.price - a.price);

  for (const oppositeOrder of oppositeOrders) {
    if (remainingQty <= 0) break;

    const fillQty = Math.min(remainingQty, oppositeOrder.quantity - oppositeOrder.filledQuantity);
    const fillPrice = oppositeOrder.price;
    
    executeTrade(limitOrder, oppositeOrder, fillPrice, fillQty);
    
    remainingQty -= fillQty;
  }

  limitOrder.filledQuantity = limitOrder.quantity - remainingQty;
  
  if (limitOrder.filledQuantity >= limitOrder.quantity) {
    limitOrder.status = "FILLED";
  } else if (limitOrder.filledQuantity > 0) {
    limitOrder.status = "PARTIALLY_FILLED";
  } else {
    limitOrder.status = "OPEN";
  }
  
  orderStore.updateOrder(limitOrder);
}

// Execute a single trade between two orders
function executeTrade(buyerOrder: Order, sellerOrder: Order, price: number, quantity: number): void {
  const isBuyerFirst = buyerOrder.side === "BUY";
  const buyOrder = isBuyerFirst ? buyerOrder : sellerOrder;
  const sellOrder = isBuyerFirst ? sellerOrder : buyerOrder;
  
  const symbol = buyOrder.symbol;
  const baseAsset = symbol.replace("USDT", "");
  const quoteAmount = price * quantity;
  const fee = quoteAmount * 0.001; // 0.1% fee
  
  // Transfer assets: buyer pays USDT, seller pays base asset
  balanceStore.transfer(baseAsset as any, baseAsset as any, quantity, quantity);
  balanceStore.transfer("USDT", "USDT", quoteAmount, quoteAmount - fee);
  
  // Update filled quantities
  buyOrder.filledQuantity += quantity;
  sellOrder.filledQuantity += quantity;
  
  // Update order statuses
  buyOrder.status = buyOrder.filledQuantity >= buyOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";
  sellOrder.status = sellOrder.filledQuantity >= sellOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";
  
  orderStore.updateOrder(buyOrder);
  orderStore.updateOrder(sellOrder);
  
  // Update portfolio (open/close positions)
  const position = portfolioStore.getOpenPosition(symbol);
  
  if (buyOrder.filledQuantity > 0) {
    if (!position) {
      portfolioStore.openPosition(symbol, "LONG", price, quantity);
    } else if (position.side === "LONG") {
      const newSize = position.size + quantity;
      const newAvgPrice = (position.entryPrice * position.size + price * quantity) / newSize;
      position.size = newSize;
      position.entryPrice = newAvgPrice;
      position.lastUpdate = new Date().toISOString();
    }
  }
  
  if (sellOrder.filledQuantity > 0 && position && position.status === "OPEN") {
    if (quantity >= position.size) {
      portfolioStore.closePosition(symbol, price);
    } else {
      const pnl = (price - position.entryPrice) * quantity;
      position.size -= quantity;
      position.realizedPnl += pnl;
      position.lastUpdate = new Date().toISOString();
    }
  }
  
  // Create trade record
  const trade: Trade = {
    id: `${buyOrder.id}-${sellOrder.id}-${Date.now()}`,
    symbol: buyOrder.symbol,
    price,
    quantity,
    quoteQty: quoteAmount,
    buyerOrderId: buyOrder.id,
    sellerOrderId: sellOrder.id,
    timestamp: new Date().toISOString(),
    fee,
    feeAsset: "USDT"
  };
  
  tradeStore.add(trade);
  
  // Emit events
  eventBus.emit("trade:executed", trade);
  eventBus.emit("order:updated", { orderId: buyOrder.id, status: buyOrder.status });
  eventBus.emit("order:updated", { orderId: sellOrder.id, status: sellOrder.status });
}