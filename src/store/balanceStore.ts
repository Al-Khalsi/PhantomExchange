import { getAllSymbols } from "../config/symbols";

export type Asset =
  | "USDT"
  | "USDC"
  | "DAI"
  | "BTC"
  | "ETH"
  | "BNB"
  | "SOL"
  | "XRP"
  | "ADA"
  | "AVAX"
  | "DOT"
  | "MATIC"
  | "ATOM"
  | "NEAR"
  | "ALGO"
  | "VET"
  | "EGLD"
  | "FTM"
  | "UNI"
  | "AAVE"
  | "LINK"
  | "CRV"
  | "CAKE"
  | "SUSHI"
  | "COMP"
  | "MKR"
  | "SNX"
  | "LDO"
  | "DOGE"
  | "SHIB"
  | "PEPE"
  | "FLOKI"
  | "BONK"
  | "WIF"
  | "SAND"
  | "MANA"
  | "AXS"
  | "GALA"
  | "ENJ"
  | "ILV"
  | "ARB"
  | "OP"
  | "METIS"
  | "BOBA"
  | "FIL"
  | "AR"
  | "BLZ"
  | "PYTH"
  | "API3"
  | "FET"
  | "AGIX"
  | "OCEAN"
  | "RNDR"
  | "GRT"
  | "CHZ"
  | "1INCH"
  | "KAVA"
  | "ZIL"
  | "TRX"
  | "BTT"
  | "RAY";

export interface Balance {
  free: number;
  locked: number;
}

export interface BalanceSummary {
  free: number;
  locked: number;
  total: number;
}

class BalanceStore {
  private balances: Map<Asset, Balance> = new Map();

  constructor() {
    this.balances.set("USDT", { free: 10000, locked: 0 });

    const allAssets = this.getAllAssets();
    for (const asset of allAssets) {
      if (asset !== "USDT" && !this.balances.has(asset as Asset)) {
        this.balances.set(asset as Asset, { free: 0, locked: 0 });
      }
    }
  }

  private getAllAssets(): string[] {
    const symbols = getAllSymbols();
    const assets = symbols.map((s) => s.replace("USDT", ""));
    return [...new Set(["USDT", "USDC", "DAI", ...assets])];
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

  getBalance(asset: Asset): Balance | undefined {
    return this.balances.get(asset);
  }

  hasSufficientFree(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    return balance ? balance.free >= amount : false;
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
    if (balance) {
      balance.free += amount;
    } else {
      this.balances.set(asset, { free: amount, locked: 0 });
    }
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

  getAll(): Record<string, BalanceSummary> {
    const result: Record<string, BalanceSummary> = {};
    for (const [asset, balance] of this.balances) {
      result[asset] = {
        free: balance.free,
        locked: balance.locked,
        total: balance.free + balance.locked,
      };
    }
    return result;
  }

  getTotalPortfolioValue(): number {
    let total = 0;
    for (const [asset, balance] of this.balances) {
      if (asset === "USDT") {
        total += balance.free + balance.locked;
      }
    }
    return total;
  }

  reset(): void {
    this.balances.clear();
    this.balances.set("USDT", { free: 10000, locked: 0 });
  }
}

export const balanceStore = new BalanceStore();
