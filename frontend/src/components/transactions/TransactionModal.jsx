import Modal from '../common/Modal'
import TransactionForm from './TransactionForm'

function TransactionModal({ visible, onClose, formData, onChange, onSubmit }) {
  return (
    <Modal title="New Transaction" visible={visible} onClose={onClose}>
      <TransactionForm formData={formData} onChange={onChange} onSubmit={onSubmit} />
    </Modal>
  )
}

export default TransactionModal
