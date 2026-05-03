import { FastifyInstance } from "fastify";
import { NETWORKS, NETWORK_ASSETS, getAssetConfig, isCoinSupportedOnNetwork, DEFAULT_TRADING_NETWORK } from "../config/networks";
import { networkBalanceStore } from "../store/networkBalanceStore";

export async function networkRoutes(fastify: FastifyInstance) {
  
  // Get all available networks
  fastify.get("/networks", async () => {
    return {
      networks: NETWORKS.filter(n => n.isActive).map(n => ({
        id: n.id,
        name: n.name,
        fullName: n.fullName,
        explorer: n.explorer,
        gasToken: n.gasToken
      }))
    };
  });

  // Get assets for a specific network
  fastify.get("/networks/:networkId/assets", async (request, reply) => {
    const { networkId } = request.params as { networkId: string };
    const assets = NETWORK_ASSETS[networkId];
    
    if (!assets) {
      return reply.status(404).send({ error: "Network not found" });
    }
    
    return {
      networkId,
      assets: assets.filter(a => a.isActive).map(a => ({
        symbol: a.symbol,
        name: a.name,
        decimals: a.decimals,
        minDeposit: a.minDeposit,
        minWithdraw: a.minWithdraw,
        withdrawFee: a.withdrawFee,
        contractAddress: a.contractAddress
      }))
    };
  });

  // Get user balances grouped by network
  fastify.get("/account/network-balances", async (request, reply) => {
    const allBalances = networkBalanceStore.getAll();
    
    // Group by network
    const grouped: Record<string, any> = {};
    for (const balance of allBalances) {
      if (!grouped[balance.networkId]) {
        const network = NETWORKS.find(n => n.id === balance.networkId);
        grouped[balance.networkId] = {
          networkId: balance.networkId,
          networkName: network?.name || balance.networkId,
          explorer: network?.explorer,
          balances: []
        };
      }
      grouped[balance.networkId].balances.push({
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: balance.free + balance.locked
      });
    }
    
    return { balances: Object.values(grouped) };
  });

  // Get balance for specific coin across all networks
  fastify.get("/account/network-balances/:coin", async (request, reply) => {
    const { coin } = request.params as { coin: string };
    const balances = networkBalanceStore.getByAsset(coin.toUpperCase());
    
    const result = balances.map(b => {
      const network = NETWORKS.find(n => n.id === b.networkId);
      return {
        networkId: b.networkId,
        networkName: network?.name || b.networkId,
        free: b.free,
        locked: b.locked,
        total: b.free + b.locked,
        explorer: network?.explorer
      };
    });
    
    return { coin: coin.toUpperCase(), balances: result };
  });

  // Deposit endpoint with network selection
  fastify.post("/account/deposit", async (request, reply) => {
    const { asset, networkId, amount } = request.body as { 
      asset: string; 
      networkId: string;
      amount: number;
    };
    
    if (!asset || !networkId || !amount || amount <= 0) {
      return reply.status(400).send({ error: "Invalid asset, networkId, or amount" });
    }
    
    const assetConfig = getAssetConfig(asset.toUpperCase(), networkId);
    if (!assetConfig) {
      return reply.status(400).send({ error: `Asset ${asset} not supported on ${networkId}` });
    }
    
    if (amount < assetConfig.minDeposit) {
      return reply.status(400).send({ 
        error: `Minimum deposit for ${asset} on ${networkId} is ${assetConfig.minDeposit}` 
      });
    }
    
    // Generate deposit address (mock)
    const depositAddress = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    
    // Add to balance (in real scenario, would wait for blockchain confirmation)
    networkBalanceStore.addFree(networkId, asset.toUpperCase(), amount);
    
    return {
      success: true,
      asset,
      networkId,
      amount,
      depositAddress,
      confirmationsRequired: 12,
      estimatedTime: "5-10 minutes",
      newBalance: networkBalanceStore.getTotal(networkId, asset.toUpperCase())
    };
  });

  // Withdraw endpoint with network selection
  fastify.post("/account/withdraw", async (request, reply) => {
    const { asset, networkId, amount, address } = request.body as {
      asset: string;
      networkId: string;
      amount: number;
      address: string;
    };
    
    if (!asset || !networkId || !amount || !address) {
      return reply.status(400).send({ error: "Missing required fields" });
    }
    
    const assetConfig = getAssetConfig(asset.toUpperCase(), networkId);
    if (!assetConfig) {
      return reply.status(400).send({ error: `Asset ${asset} not supported on ${networkId}` });
    }
    
    const totalRequired = amount + assetConfig.withdrawFee;
    const currentFree = networkBalanceStore.getFree(networkId, asset.toUpperCase());
    
    if (currentFree < totalRequired) {
      return reply.status(400).send({ 
        error: `Insufficient balance. Required: ${totalRequired} (${amount} + ${assetConfig.withdrawFee} fee)` 
      });
    }
    
    if (amount < assetConfig.minWithdraw) {
      return reply.status(400).send({ 
        error: `Minimum withdrawal for ${asset} on ${networkId} is ${assetConfig.minWithdraw}` 
      });
    }
    
    // Deduct balance
    networkBalanceStore.subtractFree(networkId, asset.toUpperCase(), totalRequired);
    
    // Generate withdrawal ID
    const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    return {
      success: true,
      withdrawalId,
      asset,
      networkId,
      amount,
      fee: assetConfig.withdrawFee,
      totalDeducted: totalRequired,
      address,
      status: "processing",
      estimatedTime: "30-60 minutes"
    };
  });

  // Transfer between networks (internal)
  fastify.post("/account/transfer-network", async (request, reply) => {
    const { asset, fromNetwork, toNetwork, amount } = request.body as {
      asset: string;
      fromNetwork: string;
      toNetwork: string;
      amount: number;
    };
    
    if (!asset || !fromNetwork || !toNetwork || !amount) {
      return reply.status(400).send({ error: "Missing required fields" });
    }
    
    if (!isCoinSupportedOnNetwork(asset.toUpperCase(), fromNetwork)) {
      return reply.status(400).send({ error: `Asset ${asset} not supported on ${fromNetwork}` });
    }
    
    if (!isCoinSupportedOnNetwork(asset.toUpperCase(), toNetwork)) {
      return reply.status(400).send({ error: `Asset ${asset} not supported on ${toNetwork}` });
    }
    
    const currentFree = networkBalanceStore.getFree(fromNetwork, asset.toUpperCase());
    if (currentFree < amount) {
      return reply.status(400).send({ error: "Insufficient balance on source network" });
    }
    
    // Bridge fee (0.1%)
    const bridgeFee = amount * 0.001;
    const receiveAmount = amount - bridgeFee;
    
    networkBalanceStore.subtractFree(fromNetwork, asset.toUpperCase(), amount);
    networkBalanceStore.addFree(toNetwork, asset.toUpperCase(), receiveAmount);
    
    return {
      success: true,
      asset,
      fromNetwork,
      toNetwork,
      amount,
      fee: bridgeFee,
      receiveAmount,
      txId: `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    };
  });
}