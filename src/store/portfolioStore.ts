import { Position } from "../types/position";
import { broadcastPortfolioUpdate } from "../realtime/portfolioPublisher";

class PortfolioStore {
  private cash = 10000;
  private positions: Position[] = [];

  // GETTERS
  getBalance() {
    return this.cash;
  }

  getOpenPositions(): Position[] {
    return this.positions.filter((p) => p.status === "OPEN");
  }

  getClosedPositions(): Position[] {
    return this.positions.filter((p) => p.status === "CLOSED");
  }

  getOpenPosition(symbol: string): Position | undefined {
    return this.positions.find(
      (p) => p.symbol === symbol && p.status === "OPEN",
    );
  }

  // Total Unrealized PNL
  getTotalUnrealizedPNL() {
    return this.getOpenPositions().reduce((acc, p) => acc + p.unrealizedPnl, 0);
  }

  // Total Realized PNL
  getTotalRealizedPNL() {
    return this.getClosedPositions().reduce((acc, p) => acc + p.realizedPnl, 0);
  }

  // Equity = cash + unrealized
  getEquity() {
    return this.cash + this.getTotalUnrealizedPNL();
  }

  // OPEN POSITION
  openPosition(
    symbol: string,
    side: "LONG" | "SHORT",
    entryPrice: number,
    size: number,
  ) {
    const cost = entryPrice * size;
    this.cash -= cost;

    const position: Position = {
      symbol,
      side,
      entryPrice,
      size,
      openedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      unrealizedPnl: 0,
      realizedPnl: 0,
      status: "OPEN",
    };

    this.positions.push(position);
    broadcastPortfolioUpdate();

    return position;
  }

  // CLOSE POSITION
  closePosition(symbol: string, exitPrice: number) {
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

    // Realized PNL gets added to cash
    this.cash += pos.entryPrice * pos.size + pnl;

    broadcastPortfolioUpdate();

    return pos;
  }

  // UPDATE PRICE → UPDATE UPNL
  updatePrice(symbol: string, newPrice: number) {
    const openPositions = this.getOpenPositions().filter(
      (p) => p.symbol === symbol,
    );

    for (const pos of openPositions) {
      if (pos.side === "LONG") {
        pos.unrealizedPnl = (newPrice - pos.entryPrice) * pos.size;
      } else {
        pos.unrealizedPnl = (pos.entryPrice - newPrice) * pos.size;
      }

      pos.lastUpdate = new Date().toISOString();
    }

    broadcastPortfolioUpdate();
  }

  // FULL PORTFOLIO SNAPSHOT
  getPortfolioSnapshot() {
    return {
      balance: this.getBalance(),
      equity: this.getEquity(),
      realizedPNL: this.getTotalRealizedPNL(),
      unrealizedPNL: this.getTotalUnrealizedPNL(),
      openPositions: this.getOpenPositions(),
      closedPositions: this.getClosedPositions(),
    };
  }
}

export const portfolioStore = new PortfolioStore();
