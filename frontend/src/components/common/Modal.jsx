function Modal({ title, children, visible, onClose }) {
  if (!visible) return null
  return (
    <div className="custom-modal-overlay" style={{ zIndex: 99999 }} onClick={onClose}>
      <div className="custom-modal" onClick={(event) => event.stopPropagation()}>
        <div className="custom-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background 0.2s"
            }}
          >
            Close
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
      </div>
    </div>
  )
}
export default Modal