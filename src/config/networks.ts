export interface Network {
  id: string;
  name: string;
  fullName: string;
  chainId?: number;
  explorer: string;
  gasToken: string;
  isActive: boolean;
}

export interface NetworkAsset {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string;
  minDeposit: number;
  minWithdraw: number;
  withdrawFee: number;
  isActive: boolean;
}

// Define available networks
export const NETWORKS: Network[] = [
  {
    id: "erc20",
    name: "ERC20",
    fullName: "Ethereum Network",
    chainId: 1,
    explorer: "https://etherscan.io",
    gasToken: "ETH",
    isActive: true
  },
  {
    id: "bep20",
    name: "BEP20",
    fullName: "BNB Smart Chain",
    chainId: 56,
    explorer: "https://bscscan.com",
    gasToken: "BNB",
    isActive: true
  },
  {
    id: "trc20",
    name: "TRC20",
    fullName: "TRON Network",
    chainId: 1,
    explorer: "https://tronscan.org",
    gasToken: "TRX",
    isActive: true
  },
  {
    id: "solana",
    name: "Solana",
    fullName: "Solana Network",
    chainId: 1,
    explorer: "https://solscan.io",
    gasToken: "SOL",
    isActive: true
  }
];

// Define which coins exist on which networks
export const NETWORK_ASSETS: Record<string, NetworkAsset[]> = {
  erc20: [
    { symbol: "USDT", name: "Tether USD", decimals: 6, contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", minDeposit: 10, minWithdraw: 10, withdrawFee: 5, isActive: true },
    { symbol: "USDC", name: "USD Coin", decimals: 6, contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", minDeposit: 10, minWithdraw: 10, withdrawFee: 5, isActive: true },
    { symbol: "DAI", name: "Dai", decimals: 18, contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", minDeposit: 10, minWithdraw: 10, withdrawFee: 5, isActive: true },
    { symbol: "LINK", name: "Chainlink", decimals: 18, contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA", minDeposit: 1, minWithdraw: 1, withdrawFee: 0.5, isActive: true },
    { symbol: "UNI", name: "Uniswap", decimals: 18, contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", minDeposit: 1, minWithdraw: 1, withdrawFee: 0.5, isActive: true },
    { symbol: "AAVE", name: "Aave", decimals: 18, contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", minDeposit: 0.5, minWithdraw: 0.5, withdrawFee: 0.2, isActive: true }
  ],
  bep20: [
    { symbol: "USDT", name: "Tether USD", decimals: 18, contractAddress: "0x55d398326f99059fF775485246999027B3197955", minDeposit: 10, minWithdraw: 10, withdrawFee: 0.5, isActive: true },
    { symbol: "BNB", name: "BNB", decimals: 18, contractAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", minDeposit: 0.01, minWithdraw: 0.01, withdrawFee: 0.005, isActive: true },
    { symbol: "BTCB", name: "Bitcoin BEP2", decimals: 18, contractAddress: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", minDeposit: 0.0001, minWithdraw: 0.0001, withdrawFee: 0.00005, isActive: true },
    { symbol: "ETH", name: "Ethereum", decimals: 18, contractAddress: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", minDeposit: 0.01, minWithdraw: 0.01, withdrawFee: 0.005, isActive: true },
    { symbol: "XRP", name: "XRP", decimals: 18, contractAddress: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE", minDeposit: 10, minWithdraw: 10, withdrawFee: 1, isActive: true },
    { symbol: "DOGE", name: "Dogecoin", decimals: 8, contractAddress: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", minDeposit: 50, minWithdraw: 50, withdrawFee: 10, isActive: true },
    { symbol: "CAKE", name: "PancakeSwap", decimals: 18, contractAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", minDeposit: 1, minWithdraw: 1, withdrawFee: 0.2, isActive: true }
  ],
  trc20: [
    { symbol: "USDT", name: "Tether USD", decimals: 6, contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", minDeposit: 10, minWithdraw: 10, withdrawFee: 1, isActive: true },
    { symbol: "TRX", name: "TRON", decimals: 6, contractAddress: "TThzxNRLrW2Brp9DcTQU8ghiJ3DUF85G6S", minDeposit: 100, minWithdraw: 100, withdrawFee: 10, isActive: true },
    { symbol: "BTT", name: "BitTorrent", decimals: 18, contractAddress: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", minDeposit: 1000, minWithdraw: 1000, withdrawFee: 100, isActive: true }
  ],
  solana: [
    { symbol: "USDT", name: "Tether USD", decimals: 6, contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", minDeposit: 10, minWithdraw: 10, withdrawFee: 0.25, isActive: true },
    { symbol: "USDC", name: "USD Coin", decimals: 6, contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", minDeposit: 10, minWithdraw: 10, withdrawFee: 0.25, isActive: true },
    { symbol: "SOL", name: "Solana", decimals: 9, contractAddress: "So11111111111111111111111111111111111111112", minDeposit: 0.1, minWithdraw: 0.1, withdrawFee: 0.01, isActive: true },
    { symbol: "RAY", name: "Raydium", decimals: 6, contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", minDeposit: 1, minWithdraw: 1, withdrawFee: 0.2, isActive: true }
  ]
};

// Default network for each coin (for trading - internal transfers)
export const DEFAULT_TRADING_NETWORK: Record<string, string> = {
  USDT: "erc20",
  BTC: "bep20",
  ETH: "erc20",
  BNB: "bep20",
  SOL: "solana",
  XRP: "bep20",
  DOGE: "bep20",
  SHIB: "erc20",
  PEPE: "erc20",
  ADA: "bep20",
  DOT: "bep20",
  MATIC: "bep20",
  LINK: "erc20",
  UNI: "erc20",
  AAVE: "erc20"
};

// Helper functions
export const getNetworks = (): Network[] => NETWORKS.filter(n => n.isActive);
export const getNetworkAssets = (networkId: string): NetworkAsset[] => 
  NETWORK_ASSETS[networkId]?.filter(a => a.isActive) || [];
export const getAllSupportedCoins = (): string[] => {
  const coins = new Set<string>();
  Object.values(NETWORK_ASSETS).forEach(assets => {
    assets.forEach(asset => coins.add(asset.symbol));
  });
  return Array.from(coins);
};
export const isCoinSupportedOnNetwork = (coin: string, networkId: string): boolean => {
  return NETWORK_ASSETS[networkId]?.some(a => a.symbol === coin && a.isActive) || false;
};
export const getAssetConfig = (coin: string, networkId: string): NetworkAsset | null => {
  return NETWORK_ASSETS[networkId]?.find(a => a.symbol === coin && a.isActive) || null;
};