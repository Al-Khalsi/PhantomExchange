export type NetworkBalance = {
  networkId: string;
  asset: string;
  free: number;
  locked: number;
};

class NetworkBalanceStore {
  private balances: Map<string, NetworkBalance> = new Map(); // key: `${networkId}:${asset}`

  private getKey(networkId: string, asset: string): string {
    return `${networkId}:${asset.toUpperCase()}`;
  }

  getFree(networkId: string, asset: string): number {
    const key = this.getKey(networkId, asset);
    return this.balances.get(key)?.free || 0;
  }

  getLocked(networkId: string, asset: string): number {
    const key = this.getKey(networkId, asset);
    return this.balances.get(key)?.locked || 0;
  }

  getTotal(networkId: string, asset: string): number {
    const key = this.getKey(networkId, asset);
    const b = this.balances.get(key);
    return b ? b.free + b.locked : 0;
  }

  setFree(networkId: string, asset: string, amount: number): void {
    const key = this.getKey(networkId, asset);
    const existing = this.balances.get(key);
    if (existing) {
      existing.free = amount;
    } else {
      this.balances.set(key, { networkId, asset: asset.toUpperCase(), free: amount, locked: 0 });
    }
  }

  addFree(networkId: string, asset: string, amount: number): void {
    const key = this.getKey(networkId, asset);
    const existing = this.balances.get(key);
    if (existing) {
      existing.free += amount;
    } else {
      this.balances.set(key, { networkId, asset: asset.toUpperCase(), free: amount, locked: 0 });
    }
  }

  subtractFree(networkId: string, asset: string, amount: number): boolean {
    const key = this.getKey(networkId, asset);
    const existing = this.balances.get(key);
    if (!existing || existing.free < amount) return false;
    existing.free -= amount;
    return true;
  }

  lock(networkId: string, asset: string, amount: number): boolean {
    const key = this.getKey(networkId, asset);
    const existing = this.balances.get(key);
    if (!existing || existing.free < amount) return false;
    existing.free -= amount;
    existing.locked += amount;
    return true;
  }

  unlock(networkId: string, asset: string, amount: number): void {
    const key = this.getKey(networkId, asset);
    const existing = this.balances.get(key);
    if (existing) {
      const unlockAmount = Math.min(amount, existing.locked);
      existing.free += unlockAmount;
      existing.locked -= unlockAmount;
    }
  }

  getAll(): NetworkBalance[] {
    return Array.from(this.balances.values());
  }

  getByAsset(asset: string): NetworkBalance[] {
    return this.getAll().filter(b => b.asset === asset.toUpperCase());
  }

  getByNetwork(networkId: string): NetworkBalance[] {
    return this.getAll().filter(b => b.networkId === networkId);
  }

  // Initialize default balances
  initializeDefaultBalances(): void {
    // Give initial USDT on ERC20 and BEP20 for testing
    this.addFree("erc20", "USDT", 5000);
    this.addFree("bep20", "USDT", 3000);
    this.addFree("trc20", "USDT", 2000);
    this.addFree("solana", "USDT", 1000);
    
    // Give some BNB for gas on BEP20
    this.addFree("bep20", "BNB", 5);
    
    // Give some SOL for gas on Solana
    this.addFree("solana", "SOL", 10);
    
    // Give some TRX for gas on TRC20
    this.addFree("trc20", "TRX", 1000);
    
    // Give some ETH for gas on ERC20
    this.addFree("erc20", "ETH", 1);
  }
}

export const networkBalanceStore = new NetworkBalanceStore();