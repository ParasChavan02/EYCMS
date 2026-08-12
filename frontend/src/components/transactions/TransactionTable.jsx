import Table from '../common/Table'

function TransactionTable({ data }) {
  const headers = ['Date', 'Description', 'Amount', 'Category']
  const rows = data.map((item) => [item.date, item.description, item.amount, item.category])

  return <Table headers={headers} rows={rows} />
}

export default TransactionTable
