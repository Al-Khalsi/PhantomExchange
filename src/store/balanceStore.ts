export type Asset = "USDT" | "BTC" | "ETH" | "SOL" | "BNB" | "XRP";

interface Balance {
  free: number;      // Available as collateral
  locked: number;    // Frozen as initial margin for open positions/orders
}

class BalanceStore {
  private balances: Map<Asset, Balance> = new Map();

  constructor() {
    // Start with only USDT as collateral (typical for futures)
    this.balances.set("USDT", { free: 10000, locked: 0 });
    this.balances.set("BTC", { free: 0, locked: 0 });
    this.balances.set("ETH", { free: 0, locked: 0 });
    this.balances.set("SOL", { free: 0, locked: 0 });
    this.balances.set("BNB", { free: 0, locked: 0 });
    this.balances.set("XRP", { free: 0, locked: 0 });
  }

  getFree(asset: Asset): number {
    return this.balances.get(asset)?.free || 0;
  }

  getLocked(asset: Asset): number {
    return this.balances.get(asset)?.locked || 0;
  }

  getTotal(asset: Asset): number {
    const b = this.balances.get(asset);
    return b ? b.free + b.locked : 0;
  }

  // Lock collateral when opening position or placing order
  lock(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    balance.free -= amount;
    balance.locked += amount;
    return true;
  }

  // Unlock collateral when order cancelled / position closed
  unlock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (!balance) return;
    const unlockAmount = Math.min(amount, balance.locked);
    balance.free += unlockAmount;
    balance.locked -= unlockAmount;
  }

  // For unrealized PnL: increase or reduce free collateral directly
  // (used in PnL settlement)
  addFree(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (balance) balance.free += amount;
  }

  subtractFree(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    balance.free -= amount;
    return true;
  }

  // Commit locked margin after position is fully closed
  commitLock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (balance) {
      const commitAmount = Math.min(amount, balance.locked);
      balance.locked -= commitAmount;
    }
  }

  getAll(): Record<Asset, { free: number; locked: number; total: number }> {
    const result = {} as Record<Asset, any>;
    for (const [asset, balance] of this.balances) {
      result[asset] = {
        free: balance.free,
        locked: balance.locked,
        total: balance.free + balance.locked
      };
    }
    return result;
  }
}

export const balanceStore = new BalanceStore();