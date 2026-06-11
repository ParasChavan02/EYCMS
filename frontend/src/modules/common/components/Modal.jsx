function Modal({ title, children, visible, onClose }) {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
