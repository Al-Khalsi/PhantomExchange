type AccountState = {
  balance: number
  realizedPNL: number
}

class AccountStore {
  private state: AccountState = {
    balance: 10000, // initial mock capital
    realizedPNL: 0
  }

  getBalance() {
    return this.state.balance
  }

  getRealizedPNL() {
    return this.state.realizedPNL
  }

  applyRealizedPNL(amount: number) {
    this.state.realizedPNL += amount
    this.state.balance += amount
  }
}

export const accountStore = new AccountStore()
