import { useState } from 'react'

function FormInput({ label, value, onChange, type = 'text', name, placeholder, showPasswordToggle = false }) {
  const [visible, setVisible] = useState(false)
  const inputType = showPasswordToggle && type === 'password' ? (visible ? 'text' : 'password') : type

  // Map input types to autocomplete values
  const getAutocomplete = () => {
    if (type === 'email') return 'email'
    if (type === 'password') return 'current-password'
    if (name === 'name') return 'name'
    return 'on'
  }

  return (
    <label className="form-input">
      <span>{label}</span>
      <div className="password-field">
        <input
          type={inputType}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          autoComplete={getAutocomplete()}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </label>
  )
}

export default FormInput
