import { getAllSymbols } from "../config/symbols";

// Extended asset list including network-specific assets
export type Asset = 
  // Stablecoins
  | "USDT" | "USDC" | "DAI"
  // Major coins
  | "BTC" | "ETH" | "BNB" | "SOL" | "XRP"
  // Layer 1
  | "ADA" | "AVAX" | "DOT" | "MATIC" | "ATOM"
  | "NEAR" | "ALGO" | "VET" | "EGLD" | "FTM"
  // DeFi
  | "UNI" | "AAVE" | "LINK" | "CRV" | "CAKE"
  | "SUSHI" | "COMP" | "MKR" | "SNX" | "LDO"
  // Meme coins
  | "DOGE" | "SHIB" | "PEPE" | "FLOKI" | "BONK" | "WIF"
  // Gaming
  | "SAND" | "MANA" | "AXS" | "GALA" | "ENJ" | "ILV"
  // Layer 2
  | "ARB" | "OP" | "METIS" | "BOBA"
  // Storage
  | "FIL" | "AR" | "BLZ"
  // Oracles
  | "PYTH" | "API3"
  // AI
  | "FET" | "AGIX" | "OCEAN"
  // Others
  | "RNDR" | "GRT" | "CHZ" | "1INCH" | "KAVA" | "ZIL"
  // Network gas tokens
  | "TRX" | "BTT" | "RAY";

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
    // Initialize USDT as collateral for futures trading
    this.balances.set("USDT", { free: 10000, locked: 0 });
    
    // Initialize all base assets with 0 balance (futures only needs USDT as collateral)
    const allAssets = this.getAllAssets();
    for (const asset of allAssets) {
      if (asset !== "USDT" && !this.balances.has(asset as Asset)) {
        this.balances.set(asset as Asset, { free: 0, locked: 0 });
      }
    }
  }

  // Get all possible assets from trading symbols
  private getAllAssets(): string[] {
    const symbols = getAllSymbols();
    const assets = symbols.map(s => s.replace("USDT", ""));
    // Add all unique assets including stablecoins
    return [...new Set(["USDT", "USDC", "DAI", ...assets])];
  }

  // Get free (available) balance for an asset
  getFree(asset: Asset): number {
    return this.balances.get(asset)?.free || 0;
  }

  // Get locked (in positions/orders) balance for an asset
  getLocked(asset: Asset): number {
    return this.balances.get(asset)?.locked || 0;
  }

  // Get total balance (free + locked) for an asset
  getTotal(asset: Asset): number {
    const b = this.balances.get(asset);
    return b ? b.free + b.locked : 0;
  }

  // Get full balance object for an asset
  getBalance(asset: Asset): Balance | undefined {
    return this.balances.get(asset);
  }

  // Lock funds (move from free to locked) - used for margin on positions
  lock(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    balance.free -= amount;
    balance.locked += amount;
    return true;
  }

  // Unlock funds (move from locked back to free) - used when position is closed
  unlock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (!balance) return;
    const unlockAmount = Math.min(amount, balance.locked);
    balance.free += unlockAmount;
    balance.locked -= unlockAmount;
  }

  // Add free balance (deposits, realized profits)
  addFree(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (balance) {
      balance.free += amount;
    } else {
      this.balances.set(asset, { free: amount, locked: 0 });
    }
  }

  // Subtract free balance (withdrawals)
  subtractFree(asset: Asset, amount: number): boolean {
    const balance = this.balances.get(asset);
    if (!balance || balance.free < amount) return false;
    balance.free -= amount;
    return true;
  }

  // Commit locked funds (reduce locked without adding to free) - for fee payments
  commitLock(asset: Asset, amount: number): void {
    const balance = this.balances.get(asset);
    if (balance) {
      const commitAmount = Math.min(amount, balance.locked);
      balance.locked -= commitAmount;
    }
  }

  // Get all balances as a plain object
  getAll(): Record<string, BalanceSummary> {
    const result: Record<string, BalanceSummary> = {};
    for (const [asset, balance] of this.balances) {
      result[asset] = {
        free: balance.free,
        locked: balance.locked,
        total: balance.free + balance.locked
      };
    }
    return result;
  }

  // Get total portfolio value in USDT (simplified - only USDT for now)
  getTotalPortfolioValue(): number {
    let total = 0;
    for (const [asset, balance] of this.balances) {
      // For now, only USDT has value (futures mode)
      // In spot mode, you would multiply by market price
      if (asset === "USDT") {
        total += balance.free + balance.locked;
      }
    }
    return total;
  }

  // Reset all balances (for testing)
  reset(): void {
    this.balances.clear();
    this.balances.set("USDT", { free: 10000, locked: 0 });
  }
}

export const balanceStore = new BalanceStore();