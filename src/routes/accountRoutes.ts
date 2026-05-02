import { FastifyInstance } from 'fastify'
import { accountStore } from '../store/accountStore'
import { portfolioStore } from '../store/portfolioStore'

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
}
