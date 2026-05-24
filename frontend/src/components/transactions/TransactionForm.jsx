import Button from '../common/Button'
import FormInput from '../common/FormInput'

function TransactionForm({ formData, onChange, onSubmit }) {
  return (
    <form className="transaction-form" onSubmit={onSubmit}>
      <FormInput label="Date" name="date" value={formData.date} onChange={onChange} type="date" />
      <FormInput label="Amount" name="amount" value={formData.amount} onChange={onChange} type="number" />
      <FormInput label="Description" name="description" value={formData.description} onChange={onChange} />
      <Button type="submit">Save Transaction</Button>
    </form>
  )
}

export default TransactionForm
