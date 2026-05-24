export async function fetchTransactions() {
  return Promise.resolve([])
}

export async function createTransaction(transaction) {
  return Promise.resolve({ ...transaction, id: Date.now() })
}
