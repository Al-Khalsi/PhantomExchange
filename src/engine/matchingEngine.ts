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

export function matchOrder(newOrder: Order): void {
  if (newOrder.status !== "OPEN") return;
  
  const symbol = newOrder.symbol;
  
  // For futures: lock margin based on leverage
  if (newOrder.side === "BUY" || newOrder.side === "SELL") {
    const position = portfolioStore.getOpenPosition(symbol);
    const isIncreasingPosition = 
      (newOrder.side === "BUY" && (!position || position.side === "LONG")) ||
      (newOrder.side === "SELL" && (!position || position.side === "SHORT"));
    
    if (isIncreasingPosition && !newOrder.reduceOnly) {
      const marginRequired = (newOrder.price * newOrder.quantity) / newOrder.leverage;
      if (!balanceStore.lock("USDT", marginRequired)) {
        newOrder.status = "CANCELLED";
        orderStore.updateOrder(newOrder);
        eventBus.emit("order:rejected", { orderId: newOrder.id, reason: "Insufficient collateral" });
        return;
      }
      (newOrder as any).marginLocked = marginRequired;
    }
  }
  
  if (newOrder.type === "MARKET") {
    executeMarketOrder(newOrder);
  } else if (newOrder.type === "LIMIT") {
    matchLimitOrder(newOrder);
  }
}

function unlockRemaining(order: Order): void {
  const remainingQty = order.quantity - order.filledQuantity;
  if (remainingQty <= 0) return;
  
  if ((order as any).marginLocked) {
    const marginToUnlock = ((order as any).marginLocked / order.quantity) * remainingQty;
    balanceStore.unlock("USDT", marginToUnlock);
  }
}

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
    unlockRemaining(marketOrder);
  }
  
  orderStore.updateOrder(marketOrder);
}

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

function executeTrade(buyerOrder: Order, sellerOrder: Order, price: number, quantity: number): void {
  const isBuyerFirst = buyerOrder.side === "BUY";
  const buyOrder = isBuyerFirst ? buyerOrder : sellerOrder;
  const sellOrder = isBuyerFirst ? sellerOrder : buyerOrder;
  
  const symbol = buyOrder.symbol;
  const quoteAmount = price * quantity;
  const fee = quoteAmount * 0.001;
  
  if (!balanceStore.subtractFree("USDT", fee * 2)) {
    console.error("Insufficient balance for trading fee");
    return;
  }
  
  buyOrder.filledQuantity += quantity;
  sellOrder.filledQuantity += quantity;
  
  buyOrder.status = buyOrder.filledQuantity >= buyOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";
  sellOrder.status = sellOrder.filledQuantity >= sellOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";
  
  orderStore.updateOrder(buyOrder);
  orderStore.updateOrder(sellOrder);
  
  let position = portfolioStore.getOpenPosition(symbol);
  
  // Handle BUY side (LONG)
  if (buyOrder.filledQuantity > 0) {
    const buyLeverage = (buyOrder as any).leverage || 10;
    
    if (!position) {
      portfolioStore.openPosition(symbol, "LONG", price, quantity, buyLeverage);
    } else if (position.side === "LONG") {
      const newSize = position.size + quantity;
      const newAvgPrice = (position.entryPrice * position.size + price * quantity) / newSize;
      const newMargin = (newAvgPrice * newSize) / position.leverage;
      
      balanceStore.unlock("USDT", position.marginUsed);
      if (!balanceStore.lock("USDT", newMargin)) {
        console.error("Failed to lock margin for position increase");
      }
      
      position.size = newSize;
      position.entryPrice = newAvgPrice;
      position.marginUsed = newMargin;
      position.liquidationPrice = portfolioStore.calculateLiquidationPrice(
        "LONG", newAvgPrice, position.leverage, newMargin
      );
      position.lastUpdate = new Date().toISOString();
    } else if (position.side === "SHORT") {
      if (quantity >= position.size) {
        portfolioStore.closePosition(symbol, price);
        if (quantity > position.size) {
          portfolioStore.openPosition(symbol, "LONG", price, quantity - position.size, buyLeverage);
        }
      } else {
        const pnl = (position.entryPrice - price) * quantity;
        position.size -= quantity;
        position.realizedPnl += pnl;
        
        const marginToUnlock = (position.marginUsed / (position.size + quantity)) * quantity;
        balanceStore.unlock("USDT", marginToUnlock);
        position.marginUsed -= marginToUnlock;
        position.lastUpdate = new Date().toISOString();
        balanceStore.addFree("USDT", pnl);
      }
    }
  }
  
  // Handle SELL side (SHORT)
  if (sellOrder.filledQuantity > 0) {
    const sellLeverage = (sellOrder as any).leverage || 10;
    const posAfterBuy = portfolioStore.getOpenPosition(symbol);
    
    if (!posAfterBuy) {
      portfolioStore.openPosition(symbol, "SHORT", price, quantity, sellLeverage);
    } else if (posAfterBuy.side === "SHORT") {
      const newSize = posAfterBuy.size + quantity;
      const newAvgPrice = (posAfterBuy.entryPrice * posAfterBuy.size + price * quantity) / newSize;
      const newMargin = (newAvgPrice * newSize) / posAfterBuy.leverage;
      
      balanceStore.unlock("USDT", posAfterBuy.marginUsed);
      balanceStore.lock("USDT", newMargin);
      
      posAfterBuy.size = newSize;
      posAfterBuy.entryPrice = newAvgPrice;
      posAfterBuy.marginUsed = newMargin;
      posAfterBuy.liquidationPrice = portfolioStore.calculateLiquidationPrice(
        "SHORT", newAvgPrice, posAfterBuy.leverage, newMargin
      );
      posAfterBuy.lastUpdate = new Date().toISOString();
    } else if (posAfterBuy.side === "LONG") {
      if (quantity >= posAfterBuy.size) {
        portfolioStore.closePosition(symbol, price);
        if (quantity > posAfterBuy.size) {
          portfolioStore.openPosition(symbol, "SHORT", price, quantity - posAfterBuy.size, sellLeverage);
        }
      } else {
        const pnl = (price - posAfterBuy.entryPrice) * quantity;
        posAfterBuy.size -= quantity;
        posAfterBuy.realizedPnl += pnl;
        
        const marginToUnlock = (posAfterBuy.marginUsed / (posAfterBuy.size + quantity)) * quantity;
        balanceStore.unlock("USDT", marginToUnlock);
        posAfterBuy.marginUsed -= marginToUnlock;
        posAfterBuy.lastUpdate = new Date().toISOString();
        balanceStore.addFree("USDT", pnl);
      }
    }
  }
  
  const trade: Trade = {
    id: `${buyOrder.id}-${sellOrder.id}-${Date.now()}`,
    symbol,
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
  eventBus.emit("trade:executed", trade);
  eventBus.emit("order:updated", { orderId: buyOrder.id, status: buyOrder.status });
  eventBus.emit("order:updated", { orderId: sellOrder.id, status: sellOrder.status });
}