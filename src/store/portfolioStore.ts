import { Position } from "../types/position";
import { broadcastPortfolioUpdate } from "../realtime/portfolioPublisher";
import { balanceStore } from "./balanceStore";

const LIQUIDATION_FEE_RATE = 0.0005;
const MAINTENANCE_MARGIN_RATE = 0.005;

class PortfolioStore {
  private positions: Position[] = [];

  getOpenPositions(): Position[] {
    return this.positions.filter(p => p.status === "OPEN");
  }

  getClosedPositions(): Position[] {
    return this.positions.filter(p => p.status === "CLOSED");
  }

  getOpenPosition(symbol: string): Position | undefined {
    return this.positions.find(p => p.symbol === symbol && p.status === "OPEN");
  }

  getTotalUnrealizedPNL(): number {
    return this.getOpenPositions().reduce((acc, p) => acc + p.unrealizedPnl, 0);
  }

  getTotalRealizedPNL(): number {
    return this.getClosedPositions().reduce((acc, p) => acc + p.realizedPnl, 0);
  }

  getEquity(): number {
    const collateral = balanceStore.getTotal("USDT");
    return collateral + this.getTotalUnrealizedPNL();
  }

  public calculateLiquidationPrice(
    side: "LONG" | "SHORT",
    entryPrice: number,
    leverage: number,
    margin: number
  ): number {
    const size = (margin * leverage) / entryPrice;
    const maintenanceMargin = margin * MAINTENANCE_MARGIN_RATE;
    const maxLoss = margin - maintenanceMargin;
    const maxLossPerContract = maxLoss / size;
    
    if (side === "LONG") {
      return entryPrice - maxLossPerContract;
    } else {
      return entryPrice + maxLossPerContract;
    }
  }

  openPosition(
    symbol: string,
    side: "LONG" | "SHORT",
    entryPrice: number,
    size: number,
    leverage: number
  ): Position {
    const marginUsed = (entryPrice * size) / leverage;
    
    if (!balanceStore.lock("USDT", marginUsed)) {
      throw new Error("Insufficient collateral to open position");
    }
    
    const liqPrice = this.calculateLiquidationPrice(side, entryPrice, leverage, marginUsed);
    
    const position: Position = {
      symbol,
      side,
      entryPrice,
      size,
      leverage,
      marginUsed,
      liquidationPrice: liqPrice,
      openedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      unrealizedPnl: 0,
      realizedPnl: 0,
      status: "OPEN"
    };
    
    this.positions.push(position);
    broadcastPortfolioUpdate();
    return position;
  }
  
  closePosition(symbol: string, exitPrice: number): Position | null {
    const pos = this.getOpenPosition(symbol);
    if (!pos) return null;
    
    let pnl = 0;
    if (pos.side === "LONG") {
      pnl = (exitPrice - pos.entryPrice) * pos.size;
    } else {
      pnl = (pos.entryPrice - exitPrice) * pos.size;
    }
    
    pos.realizedPnl = pnl;
    pos.unrealizedPnl = 0;
    pos.status = "CLOSED";
    pos.exitPrice = exitPrice;
    pos.closedAt = new Date().toISOString();
    pos.lastUpdate = new Date().toISOString();
    
    balanceStore.unlock("USDT", pos.marginUsed);
    if (pnl > 0) {
      balanceStore.addFree("USDT", pnl);
    } else if (pnl < 0) {
      const remainingMargin = Math.max(0, pos.marginUsed + pnl);
      balanceStore.addFree("USDT", remainingMargin);
    } else {
      balanceStore.addFree("USDT", pos.marginUsed);
    }
    
    broadcastPortfolioUpdate();
    return pos;
  }
  
  updatePrice(symbol: string, newPrice: number): void {
    const openPositions = this.getOpenPositions().filter(p => p.symbol === symbol);
    
    for (const pos of openPositions) {
      let unrealized = 0;
      if (pos.side === "LONG") {
        unrealized = (newPrice - pos.entryPrice) * pos.size;
      } else {
        unrealized = (pos.entryPrice - newPrice) * pos.size;
      }
      pos.unrealizedPnl = unrealized;
      pos.lastUpdate = new Date().toISOString();
      
      if ((pos.side === "LONG" && newPrice <= pos.liquidationPrice) ||
          (pos.side === "SHORT" && newPrice >= pos.liquidationPrice)) {
        
        const remainingMargin = Math.max(0, pos.marginUsed + unrealized);
        const liquidationFee = remainingMargin * LIQUIDATION_FEE_RATE;
        const returnedMargin = remainingMargin - liquidationFee;
        
        pos.realizedPnl = unrealized;
        pos.unrealizedPnl = 0;
        pos.status = "CLOSED";
        pos.exitPrice = newPrice;
        pos.closedAt = new Date().toISOString();
        
        balanceStore.unlock("USDT", pos.marginUsed);
        if (returnedMargin > 0) {
          balanceStore.addFree("USDT", returnedMargin);
        }
        
        console.log(`[LIQUIDATION] ${pos.symbol} ${pos.side} at price ${newPrice}`);
      }
    }
    
    broadcastPortfolioUpdate();
  }
  
  getPortfolio() {
    return {
      equity: this.getEquity(),
      unrealizedPNL: this.getTotalUnrealizedPNL(),
      realizedPNL: this.getTotalRealizedPNL(),
      openPositions: this.getOpenPositions(),
      closedPositions: this.getClosedPositions()
    };
  }
}

export const portfolioStore = new PortfolioStore();