export type Asset = "USDT" | "BTC" | "ETH" | "SOL" | "BNB" | "XRP";

interface Balance {
  free: number;      // Available to use
  locked: number;    // Frozen by open orders
}

class BalanceStore {
  private balances: Map<Asset, Balance> = new Map();

  constructor() {
    // Initialize with default balances
    this.balances.set("USDT", { free: 10000, locked: 0 });
    this.balances.set("BTC", { free: 0, locked: 0 });
    this.balances.set("ETH", { free: 0, locked: 0 });
    this.balances.set("SOL", { free: 0, locked: 0 });
    this.balances.set("BNB", { free: 0, locked: 0 });
    this.balances.set("XRP", { free: 0, locked: 0 });
  }

  // Get free balance of an asset
  getFree(asset: Asset): number {
    return this.balances.get(asset)?.free || 0;
  }

  // Get locked balance
  getLocked(asset: Asset): number {
    return this.balances.get(asset)?.locked || 0;
  }

  // Get total balance (free + locked)
  getTotal(asset: Asset): number {
    const b = this.balances.get(asset);
    return b ? b.free + b.locked : 0;
  }

  // Freeze balance when placing order
  lock(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    
    balance.free -= amount;
    balance.locked += amount;
    return true;
  }

  // Release locked balance (when order cancelled)
  unlock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (!balance) return;
    
    const unlockAmount = Math.min(amount, balance.locked);
    balance.free += unlockAmount;
    balance.locked -= unlockAmount;
  }

  // Execute transfer when trade happens
  // When BUY: USDT -> seller, asset -> buyer
  // When SELL: asset -> buyer, USDT -> seller
  transfer(
    fromAsset: Asset,
    toAsset: Asset,
    fromAmount: number,
    toAmount: number
  ): boolean {
    const fromBalance = this.balances.get(fromAsset);
    const toBalance = this.balances.get(toAsset);
    
    if (!fromBalance || !toBalance) return false;
    if (fromBalance.free < fromAmount) return false;
    
    fromBalance.free -= fromAmount;
    toBalance.free += toAmount;
    
    return true;
  }

  // Commit locked balance after order filled
  commitLock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (!balance) return;
    
    const commitAmount = Math.min(amount, balance.locked);
    balance.locked -= commitAmount;
    // Already transferred via transfer() for the asset
  }

  // Get all balances
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