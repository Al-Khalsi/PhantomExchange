import { FastifyInstance } from 'fastify'
import { accountStore } from '../store/accountStore'
import { portfolioStore } from '../store/portfolioStore'
import { balanceStore } from '../store/balanceStore'

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

  // Get all multi-asset balances
  fastify.get('/account/balances', async () => {
    return {
      balances: balanceStore.getAll()
    }
  })

  // Deposit funds for testing
  fastify.post('/account/deposit', async (request, reply) => {
    const { asset, amount } = request.body as { asset: string; amount: number }
    
    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: 'Invalid asset or amount' })
    }
    
    // Add free balance
    const currentTotal = balanceStore.getTotal(asset as any)
    const currentFree = balanceStore.getFree(asset as any)
    const currentLocked = balanceStore.getLocked(asset as any)
    
    // Simple way: unlock then add then lock back? No, just add to free
    // Workaround: transfer from nowhere (just add)
    // Since transfer needs from/to, we directly manipulate via lock/unlock hack
    if (currentLocked > 0) {
      // If there's locked balance, we need to add to free separately
      // For simplicity, we add by unlocking a dummy amount then relocking? Too complex
      // Better: add a direct method to balanceStore
      // But for now, use transfer with from=to
      balanceStore.transfer(asset as any, asset as any, 0, amount)
    } else {
      balanceStore.transfer(asset as any, asset as any, 0, amount)
    }
    
    return { 
      success: true, 
      asset, 
      amount,
      newBalance: balanceStore.getTotal(asset as any)
    }
  })

  // Withdraw funds for testing
  fastify.post('/account/withdraw', async (request, reply) => {
    const { asset, amount } = request.body as { asset: string; amount: number }
    
    if (!asset || !amount || amount <= 0) {
      return reply.status(400).send({ error: 'Invalid asset or amount' })
    }
    
    const currentFree = balanceStore.getFree(asset as any)
    
    if (currentFree < amount) {
      return reply.status(400).send({ error: 'Insufficient balance' })
    }
    
    // Lock then commit (effectively remove)
    if (balanceStore.lock(asset as any, amount)) {
      balanceStore.commitLock(asset as any, amount)
      return { 
        success: true, 
        asset, 
        amount,
        newBalance: balanceStore.getTotal(asset as any)
      }
    }
    
    return reply.status(400).send({ error: 'Withdrawal failed' })
  })
}