import React from "react";

function Select({ label, value, onChange, options = [], name, className = "" }) {
  return (
    <label className={`form-select-wrapper ${className}`}>
      {label && <span>{label}</span>}
      <select name={name} value={value} onChange={onChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Select;
