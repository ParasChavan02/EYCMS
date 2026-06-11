function TransactionLineRow({ transaction }) {
  return (
    <tr>
      <td>{transaction.date}</td>
      <td>{transaction.description}</td>
      <td>{transaction.amount}</td>
      <td>{transaction.category}</td>
    </tr>
  )
}

export default TransactionLineRow
