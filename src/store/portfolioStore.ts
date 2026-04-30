import { Position } from "../types/position";

class PortfolioStore {
    private cash = 10000;
    private positions: Position[] = [];

    getPortfolio() {
        return {
            cash: this.cash,
            positions: this.positions
        };
    }

    getOpenPosition(symbol: string): Position | undefined {
        return this.positions.find(p => p.symbol === symbol && p.status === "OPEN");
    }

    openPosition(symbol: string, side: "LONG" | "SHORT", entryPrice: number, size: number) {
        const position: Position = {
            symbol,
            side,
            entryPrice,
            size,
            openedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            realizedPnl: 0,
            unrealizedPnl: 0,
            status: "OPEN"
        };

        this.positions.push(position);
        this.cash -= entryPrice * size;

        return position;
    }

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
        pos.lastUpdate = new Date().toISOString();

        this.cash += exitPrice * pos.size;

        return pos;
    }

    updateUnrealizedPnL(markPrice: number) {
        for (const pos of this.positions) {
            if (pos.status !== "OPEN") continue;

            if (pos.side === "LONG") {
                pos.unrealizedPnl = (markPrice - pos.entryPrice) * pos.size;
            } else {
                pos.unrealizedPnl = (pos.entryPrice - markPrice) * pos.size;
            }

            pos.lastUpdate = new Date().toISOString();
        }
    }
}

export const portfolioStore = new PortfolioStore();
