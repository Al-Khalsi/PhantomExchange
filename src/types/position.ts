export interface Position {
    symbol: string;
    side: "LONG" | "SHORT";
    entryPrice: number;
    size: number;          // مقدار دارایی
    openedAt: string;      // ISO timestamp
    lastUpdate: string;    // ISO timestamp
    realizedPnl: number;   // تا الان چقدر سود/ضرر بسته شده
    unrealizedPnl: number; // بر اساس آخرین قیمت
    status: "OPEN" | "CLOSED";
}
