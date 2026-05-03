import { getAllSymbols } from "../config/symbols";

export type Asset = 
  | "USDT" 
  | "BTC" | "ETH" | "BNB" | "SOL" | "XRP"
  | "ADA" | "AVAX" | "DOT" | "MATIC" | "ATOM"
  | "NEAR" | "ALGO" | "VET" | "EGLD" | "FTM"
  | "UNI" | "AAVE" | "LINK" | "CRV" | "CAKE"
  | "SUSHI" | "COMP" | "MKR" | "SNX" | "LDO"
  | "DOGE" | "SHIB" | "PEPE" | "FLOKI" | "BONK" | "WIF"
  | "SAND" | "MANA" | "AXS" | "GALA" | "ENJ" | "ILV"
  | "ARB" | "OP" | "METIS" | "BOBA"
  | "FIL" | "AR" | "BLZ"
  | "PYTH" | "API3"
  | "FET" | "AGIX" | "OCEAN"
  | "RNDR" | "GRT" | "CHZ" | "1INCH" | "KAVA" | "ZIL";

interface Balance {
  free: number;
  locked: number;
}

class BalanceStore {
  private balances: Map<Asset, Balance> = new Map();

  constructor() {
    // Initialize USDT as collateral
    this.balances.set("USDT", { free: 10000, locked: 0 });
    
    // Initialize all base assets with 0 balance (futures only needs USDT)
    const allAssets = this.getAllAssets();
    for (const asset of allAssets) {
      if (asset !== "USDT" && !this.balances.has(asset as Asset)) {
        this.balances.set(asset as Asset, { free: 0, locked: 0 });
      }
    }
  }

  private getAllAssets(): string[] {
    const symbols = getAllSymbols();
    const assets = symbols.map(s => s.replace("USDT", ""));
    // Add all unique assets
    return [...new Set(["USDT", ...assets])];
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

  lock(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    balance.free -= amount;
    balance.locked += amount;
    return true;
  }

  unlock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (!balance) return;
    const unlockAmount = Math.min(amount, balance.locked);
    balance.free += unlockAmount;
    balance.locked -= unlockAmount;
  }

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

  commitLock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (balance) {
      const commitAmount = Math.min(amount, balance.locked);
      balance.locked -= commitAmount;
    }
  }

  getAll(): Record<string, { free: number; locked: number; total: number }> {
    const result: Record<string, any> = {};
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