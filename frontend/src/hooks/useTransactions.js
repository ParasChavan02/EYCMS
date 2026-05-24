import { useState, useEffect } from 'react'
import { fetchTransactions } from '../services/transactionService'

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [])

  return { transactions, loading }
}
