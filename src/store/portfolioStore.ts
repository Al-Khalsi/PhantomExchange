import { Position } from "../types/position";

class PortfolioStore {
    private cash = 10000; // USDT initial — موقت، بعداً از PDF الگو می‌گیریم
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

        // کاهش موجودی (موقت - بعداً دقیق‌تر می‌شود)
        this.cash -= entryPrice * size;

        return position;
    }

    closePosition(symbol: string, exitPrice: number) {
        const pos = this.getOpenPosition(symbol);
        if (!pos) return null;

        // محاسبه سود/ضرر
        const pnl = (exitPrice - pos.entryPrice) * pos.size;
        pos.realizedPnl = pnl;
        pos.status = "CLOSED";
        pos.lastUpdate = new Date().toISOString();

        // بازگرداندن پول
        this.cash += (exitPrice * pos.size);

        return pos;
    }

    updateUnrealized(symbol: string, currentPrice: number) {
        const pos = this.getOpenPosition(symbol);
        if (!pos) return;

        pos.unrealizedPnl = (currentPrice - pos.entryPrice) * pos.size;
        pos.lastUpdate = new Date().toISOString();
    }
}

export const portfolioStore = new PortfolioStore();
