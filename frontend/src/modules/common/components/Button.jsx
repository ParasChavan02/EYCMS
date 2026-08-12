function Button({ children, type = 'button', onClick, variant = 'primary', disabled = false }) {
  return (
    <button type={type} className={`button button--${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export default Button
