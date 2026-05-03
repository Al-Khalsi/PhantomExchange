import { FastifyInstance } from "fastify";
import { accountStore } from "../store/accountStore";
import { portfolioStore } from "../store/portfolioStore";
import { balanceStore, Asset } from "../store/balanceStore";
import { networkBalanceStore } from "../store/networkBalanceStore";
import { getAssetConfig, DEFAULT_TRADING_NETWORK } from "../config/networks";

let defaultLeverage = 10;
const maxLeverage = 100;

export async function accountRoutes(fastify: FastifyInstance) {
  // ==================== BASIC ACCOUNT ENDPOINTS ====================

  // Get account balance (legacy USDT only)
  fastify.get("/account/balance", async () => {
    return {
      balance: accountStore.getBalance(),
      realizedPNL: accountStore.getRealizedPNL(),
    };
  });

  // Get account equity (collateral + unrealized PNL)
  fastify.get("/account/equity", async () => {
    return {
      equity: portfolioStore.getEquity(),
    };
  });

  // Get account PNL (realized + unrealized)
  fastify.get("/account/pnl", async () => {
    return {
      realized: accountStore.getRealizedPNL(),
      unrealized: portfolioStore.getTotalUnrealizedPNL(),
    };
  });

  // ==================== MULTI-ASSET BALANCES ENDPOINTS ====================

  // Get all balances (trading + network-specific)
  fastify.get("/account/balances", async () => {
    // Get trading balances (USDT only for futures)
    const tradingBalances = balanceStore.getAll();

    // Get network-specific balances
    const networkBalances = networkBalanceStore.getAll();

    // Group network balances by asset
    const networkGrouped: Record<string, any> = {};
    for (const nb of networkBalances) {
      if (!networkGrouped[nb.asset]) {
        networkGrouped[nb.asset] = [];
      }
      networkGrouped[nb.asset].push({
        networkId: nb.networkId,
        free: nb.free,
        locked: nb.locked,
        total: nb.free + nb.locked,
      });
    }

    return {
      trading: tradingBalances,
      network: networkGrouped,
      summary: {
        totalUSDTValue: calculateTotalUSDTValue(
          tradingBalances,
          networkGrouped,
        ),
      },
    };
  });

  // Get balance for specific asset across all networks
  fastify.get("/account/balances/:asset", async (request, reply) => {
    const { asset } = request.params as { asset: string };
    const assetUpper = asset.toUpperCase() as Asset;

    // Get trading balance
    const tradingBalance = balanceStore.getTotal(assetUpper);

    // Get network balances
    const networkBalances = networkBalanceStore.getByAsset(assetUpper);

    return {
      asset: assetUpper,
      trading: {
        free: balanceStore.getFree(assetUpper),
        locked: balanceStore.getLocked(assetUpper),
        total: tradingBalance,
      },
      networks: networkBalances.map((nb) => ({
        networkId: nb.networkId,
        free: nb.free,
        locked: nb.locked,
        total: nb.free + nb.locked,
      })),
    };
  });

  // ==================== LEVERAGE ENDPOINTS ====================

  // Get default leverage settings
  fastify.get("/account/leverage", async () => {
    return {
      defaultLeverage,
      maxLeverage,
    };
  });

  // Set default leverage for futures trading
  fastify.post("/account/leverage", async (request, reply) => {
    const { leverage } = request.body as { leverage: number };

    if (leverage < 1 || leverage > maxLeverage) {
      return reply
        .status(400)
        .send({ error: `Leverage must be between 1 and ${maxLeverage}` });
    }

    defaultLeverage = leverage;
    return {
      defaultLeverage,
      maxLeverage,
      message: "Default leverage updated for futures trading",
    };
  });

  // ==================== DEPOSIT & WITHDRAW ENDPOINTS (UNIFIED) ====================

  // Unified deposit endpoint - supports both trading balance and network-specific deposits
  fastify.post("/account/deposit", async (request, reply) => {
    const { asset, amount, networkId } = request.body as {
      asset: string;
      amount: number;
      networkId?: string; // Optional: if not provided, deposits to trading balance
    };

    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: "Invalid asset or amount" });
    }

    const assetUpper = asset.toUpperCase() as Asset;

    // Case 1: Deposit to specific blockchain network
    if (networkId) {
      const assetConfig = getAssetConfig(assetUpper, networkId);
      if (!assetConfig) {
        return reply.status(400).send({
          error: `Asset ${asset} not supported on network ${networkId}`,
        });
      }

      if (amount < assetConfig.minDeposit) {
        return reply.status(400).send({
          error: `Minimum deposit for ${asset} on ${networkId} is ${assetConfig.minDeposit}`,
        });
      }

      // Generate mock deposit address
      const depositAddress = generateDepositAddress();

      // Add to network balance
      networkBalanceStore.addFree(networkId, assetUpper, amount);

      return {
        success: true,
        type: "network",
        asset,
        networkId,
        amount,
        depositAddress,
        confirmationsRequired: 12,
        estimatedTime: "5-10 minutes",
        newBalance: networkBalanceStore.getTotal(networkId, assetUpper),
      };
    }

    // Case 2: Deposit to trading balance (USDT only for futures)
    else {
      if (assetUpper !== "USDT") {
        return reply.status(400).send({
          error:
            "Only USDT deposits are supported for futures trading. Use networkId parameter for other assets.",
        });
      }

      balanceStore.addFree("USDT", amount);

      return {
        success: true,
        type: "trading",
        asset,
        amount,
        newBalance: balanceStore.getTotal("USDT"),
      };
    }
  });

  // Unified withdraw endpoint
  fastify.post("/account/withdraw", async (request, reply) => {
    const { asset, amount, networkId, address } = request.body as {
      asset: string;
      amount: number;
      networkId?: string;
      address?: string;
    };

    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: "Invalid asset or amount" });
    }

    const assetUpper = asset.toUpperCase() as Asset;

    // Case 1: Withdraw from specific network
    if (networkId) {
      if (!address) {
        return reply
          .status(400)
          .send({ error: "Address is required for network withdrawal" });
      }

      const assetConfig = getAssetConfig(assetUpper, networkId);
      if (!assetConfig) {
        return reply.status(400).send({
          error: `Asset ${asset} not supported on network ${networkId}`,
        });
      }

      const totalRequired = amount + assetConfig.withdrawFee;
      const currentFree = networkBalanceStore.getFree(networkId, assetUpper);

      if (currentFree < totalRequired) {
        return reply.status(400).send({
          error: `Insufficient balance. Required: ${totalRequired} (${amount} + ${assetConfig.withdrawFee} fee)`,
        });
      }

      if (amount < assetConfig.minWithdraw) {
        return reply.status(400).send({
          error: `Minimum withdrawal for ${asset} on ${networkId} is ${assetConfig.minWithdraw}`,
        });
      }

      // Deduct balance
      networkBalanceStore.subtractFree(networkId, assetUpper, totalRequired);

      // Generate withdrawal ID
      const withdrawalId = generateWithdrawalId();

      return {
        success: true,
        type: "network",
        withdrawalId,
        asset,
        networkId,
        amount,
        fee: assetConfig.withdrawFee,
        totalDeducted: totalRequired,
        address,
        status: "processing",
        estimatedTime: "30-60 minutes",
      };
    }

    // Case 2: Withdraw from trading balance (USDT only)
    else {
      if (assetUpper !== "USDT") {
        return reply.status(400).send({
          error:
            "Only USDT withdrawals are supported from trading balance. Use networkId for other assets.",
        });
      }

      const currentFree = balanceStore.getFree("USDT");

      if (currentFree < amount) {
        return reply.status(400).send({ error: "Insufficient balance" });
      }

      if (!balanceStore.subtractFree("USDT", amount)) {
        return reply.status(400).send({ error: "Withdrawal failed" });
      }

      return {
        success: true,
        type: "trading",
        asset,
        amount,
        newBalance: balanceStore.getTotal("USDT"),
      };
    }
  });

  // ==================== INTERNAL NETWORK TRANSFER ====================

  // Transfer assets between different networks (internal bridge)
  fastify.post("/account/transfer", async (request, reply) => {
    const { asset, fromNetwork, toNetwork, amount } = request.body as {
      asset: string;
      fromNetwork: string;
      toNetwork: string;
      amount: number;
    };

    if (!asset || !fromNetwork || !toNetwork || !amount || amount <= 0) {
      return reply.status(400).send({ error: "Missing required fields" });
    }

    const assetUpper = asset.toUpperCase();

    // Check if asset is supported on both networks
    const fromConfig = getAssetConfig(assetUpper, fromNetwork);
    const toConfig = getAssetConfig(assetUpper, toNetwork);

    if (!fromConfig) {
      return reply
        .status(400)
        .send({ error: `Asset ${asset} not supported on ${fromNetwork}` });
    }

    if (!toConfig) {
      return reply
        .status(400)
        .send({ error: `Asset ${asset} not supported on ${toNetwork}` });
    }

    // Check sufficient balance on source network
    const currentFree = networkBalanceStore.getFree(fromNetwork, assetUpper);
    if (currentFree < amount) {
      return reply
        .status(400)
        .send({ error: "Insufficient balance on source network" });
    }

    // Bridge fee (0.1%)
    const bridgeFee = amount * 0.001;
    const receiveAmount = amount - bridgeFee;

    // Execute transfer
    networkBalanceStore.subtractFree(fromNetwork, assetUpper, amount);
    networkBalanceStore.addFree(toNetwork, assetUpper, receiveAmount);

    return {
      success: true,
      asset: assetUpper,
      fromNetwork,
      toNetwork,
      amount,
      fee: bridgeFee,
      receiveAmount,
      txId: generateTransferId(),
    };
  });
}

// ==================== HELPER FUNCTIONS ====================

function calculateTotalUSDTValue(
  tradingBalances: any,
  networkGrouped: any,
): number {
  let total = tradingBalances.USDT?.total || 0;

  // Add USDT from all networks
  if (networkGrouped.USDT) {
    for (const networkBalance of networkGrouped.USDT) {
      total += networkBalance.total;
    }
  }

  return total;
}

function generateDepositAddress(): string {
  return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
}

function generateWithdrawalId(): string {
  return `wd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateTransferId(): string {
  return `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}
