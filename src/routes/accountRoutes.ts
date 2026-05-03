import { FastifyInstance } from 'fastify'
import { accountStore } from '../store/accountStore'
import { portfolioStore } from '../store/portfolioStore'
import { balanceStore } from '../store/balanceStore'

let defaultLeverage = 10;
const maxLeverage = 100;

export async function accountRoutes(fastify: FastifyInstance) {

  fastify.get('/account/balance', async () => {
    return {
      balance: accountStore.getBalance(),
      realizedPNL: accountStore.getRealizedPNL()
    }
  })

  fastify.get('/account/equity', async () => {
    return {
      equity: portfolioStore.getEquity()
    }
  })

  fastify.get('/account/pnl', async () => {
    return {
      realized: accountStore.getRealizedPNL(),
      unrealized: portfolioStore.getTotalUnrealizedPNL()
    }
  })

  fastify.get('/account/balances', async () => {
    return {
      balances: balanceStore.getAll()
    }
  })

  fastify.get('/account/leverage', async () => {
    return {
      defaultLeverage,
      maxLeverage
    }
  })

  fastify.post('/account/leverage', async (request, reply) => {
    const { leverage } = request.body as { leverage: number };
    
    if (leverage < 1 || leverage > maxLeverage) {
      return reply.status(400).send({ error: `Leverage must be between 1 and ${maxLeverage}` });
    }
    
    defaultLeverage = leverage;
    return { 
      defaultLeverage, 
      maxLeverage,
      message: "Default leverage updated for futures trading" 
    };
  })

  fastify.post('/account/deposit', async (request, reply) => {
    const { asset, amount } = request.body as { asset: string; amount: number }
    
    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: 'Invalid asset or amount' })
    }
    
    if (asset !== "USDT") {
      return reply.status(400).send({ error: 'Only USDT deposits are supported for futures' });
    }
    
    balanceStore.addFree("USDT", amount);
    
    return { 
      success: true, 
      asset, 
      amount,
      newBalance: balanceStore.getTotal("USDT")
    }
  })

  fastify.post('/account/withdraw', async (request, reply) => {
    const { asset, amount } = request.body as { asset: string; amount: number }
    
    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: 'Invalid asset or amount' })
    }
    
    if (asset !== "USDT") {
      return reply.status(400).send({ error: 'Only USDT withdrawals are supported for futures' });
    }
    
    const currentFree = balanceStore.getFree("USDT")
    
    if (currentFree < amount) {
      return reply.status(400).send({ error: 'Insufficient balance' })
    }
    
    if (!balanceStore.subtractFree("USDT", amount)) {
      return reply.status(400).send({ error: 'Withdrawal failed' });
    }
    
    return { 
      success: true, 
      asset, 
      amount,
      newBalance: balanceStore.getTotal("USDT")
    }
  })
}