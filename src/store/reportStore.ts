import crypto from "crypto";

export type ReportEntry = {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  expiry: string;
  score: number;
  reason: string;
  timestamp: string;
};

class ReportStore {
  private reports: ReportEntry[] = [];

  add(entry: Omit<ReportEntry, "id" | "timestamp">) {
    const report: ReportEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.reports.push(report);
    return report;
  }

  getAll() {
    return this.reports;
  }

  getById(id: string) {
    return this.reports.find(r => r.id === id) || null;
  }
}

export const reportStore = new ReportStore();
