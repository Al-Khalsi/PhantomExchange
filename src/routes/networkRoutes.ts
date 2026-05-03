import { FastifyInstance } from "fastify";
import {
  NETWORKS,
  NETWORK_ASSETS,
  getAssetConfig,
  isCoinSupportedOnNetwork,
  Network,
  NetworkAsset,
} from "../config/networks";
import { networkBalanceStore } from "../store/networkBalanceStore";

export async function networkRoutes(fastify: FastifyInstance) {
  // ==================== NETWORK INFORMATION ENDPOINTS ====================

  // Get all available blockchain networks
  fastify.get("/networks", async () => {
    return {
      networks: NETWORKS.filter((n) => n.isActive).map((n) => ({
        id: n.id,
        name: n.name,
        fullName: n.fullName,
        explorer: n.explorer,
        gasToken: n.gasToken,
      })),
    };
  });

  // Get specific network details
  fastify.get("/networks/:networkId", async (request, reply) => {
    const { networkId } = request.params as { networkId: string };
    const network = NETWORKS.find((n) => n.id === networkId && n.isActive);

    if (!network) {
      return reply.status(404).send({ error: "Network not found" });
    }

    return { network };
  });

  // Get all supported assets for a specific network
  fastify.get("/networks/:networkId/assets", async (request, reply) => {
    const { networkId } = request.params as { networkId: string };
    const assets = NETWORK_ASSETS[networkId];

    if (!assets) {
      return reply.status(404).send({ error: "Network not found" });
    }

    return {
      networkId,
      assets: assets
        .filter((a) => a.isActive)
        .map((a) => ({
          symbol: a.symbol,
          name: a.name,
          decimals: a.decimals,
          minDeposit: a.minDeposit,
          minWithdraw: a.minWithdraw,
          withdrawFee: a.withdrawFee,
          contractAddress: a.contractAddress,
        })),
    };
  });

  // Check if a specific asset is supported on a network
  fastify.get("/networks/:networkId/assets/:asset", async (request, reply) => {
    const { networkId, asset } = request.params as {
      networkId: string;
      asset: string;
    };
    const isSupported = isCoinSupportedOnNetwork(
      asset.toUpperCase(),
      networkId,
    );
    const config = getAssetConfig(asset.toUpperCase(), networkId);

    if (!isSupported || !config) {
      return reply.status(404).send({
        error: `Asset ${asset} not supported on ${networkId}`,
      });
    }

    return {
      networkId,
      asset: asset.toUpperCase(),
      supported: true,
      config: {
        decimals: config.decimals,
        minDeposit: config.minDeposit,
        minWithdraw: config.minWithdraw,
        withdrawFee: config.withdrawFee,
        contractAddress: config.contractAddress,
      },
    };
  });

  // ==================== NETWORK BALANCE ENDPOINTS ====================

  // Get user balances grouped by network
  fastify.get("/network/balances", async () => {
    const allBalances = networkBalanceStore.getAll();

    // Group by network
    const grouped: Record<string, any> = {};
    for (const balance of allBalances) {
      if (!grouped[balance.networkId]) {
        const network = NETWORKS.find((n) => n.id === balance.networkId);
        grouped[balance.networkId] = {
          networkId: balance.networkId,
          networkName: network?.name || balance.networkId,
          explorer: network?.explorer,
          balances: [],
        };
      }
      grouped[balance.networkId].balances.push({
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: balance.free + balance.locked,
      });
    }

    return { balances: Object.values(grouped) };
  });

  // Get balance for specific asset across all networks
  fastify.get("/network/balances/:asset", async (request, reply) => {
    const { asset } = request.params as { asset: string };
    const balances = networkBalanceStore.getByAsset(asset.toUpperCase());

    const result = balances.map((b) => {
      const network = NETWORKS.find((n) => n.id === b.networkId);
      return {
        networkId: b.networkId,
        networkName: network?.name || b.networkId,
        free: b.free,
        locked: b.locked,
        total: b.free + b.locked,
        explorer: network?.explorer,
      };
    });

    return { asset: asset.toUpperCase(), balances: result };
  });

  // Get balances for a specific network only
  fastify.get(
    "/network/balances/network/:networkId",
    async (request, reply) => {
      const { networkId } = request.params as { networkId: string };
      const balances = networkBalanceStore.getByNetwork(networkId);

      const network = NETWORKS.find((n) => n.id === networkId);
      if (!network) {
        return reply.status(404).send({ error: "Network not found" });
      }

      return {
        networkId,
        networkName: network.name,
        balances: balances.map((b) => ({
          asset: b.asset,
          free: b.free,
          locked: b.locked,
          total: b.free + b.locked,
        })),
      };
    },
  );

  // ==================== NETWORK STATISTICS ====================

  // Get network statistics (total value locked, active users, etc)
  fastify.get("/network/stats", async () => {
    const allBalances = networkBalanceStore.getAll();

    // Calculate total value per network (simplified - using USDT as base)
    const networkStats: Record<
      string,
      { totalValue: number; assetCount: number }
    > = {};

    for (const balance of allBalances) {
      if (!networkStats[balance.networkId]) {
        networkStats[balance.networkId] = { totalValue: 0, assetCount: 0 };
      }

      const total = balance.free + balance.locked;
      if (balance.asset === "USDT") {
        networkStats[balance.networkId].totalValue += total;
      }
      networkStats[balance.networkId].assetCount++;
    }

    return {
      timestamp: new Date().toISOString(),
      networks: networkStats,
    };
  });

  // ==================== HEALTH CHECK ====================

  fastify.get("/network/health", async () => {
    const activeNetworks = NETWORKS.filter((n) => n.isActive).length;
    const totalBalances = networkBalanceStore.getAll().length;

    return {
      status: "healthy",
      activeNetworks,
      totalBalanceEntries: totalBalances,
      networks: NETWORKS.filter((n) => n.isActive).map((n) => ({
        id: n.id,
        name: n.name,
        isActive: n.isActive,
      })),
    };
  });
}

// Helper function to generate deposit address (mock)
function generateDepositAddress(): string {
  return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
}
