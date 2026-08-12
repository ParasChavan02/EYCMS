import Modal from "../../modules/common/components/Modal";
import "./event-components.css";

function ConfirmationDialog({
  visible,
  title,
  body,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Back",
}) {
  return (
    <Modal visible={visible} title={title} onClose={onClose}>
      <div className="event-confirmation">
        <div className="event-confirmation__body">{body}</div>
        {typeof onReasonChange === "function" && (
          <label className="form-group">
            <span className="form-label">Reason</span>
            <textarea className="form-textarea" rows={4} value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Add a reason" />
          </label>
        )}
        <div className="event-confirmation__footer">
          <button type="button" className="btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmationDialog;
