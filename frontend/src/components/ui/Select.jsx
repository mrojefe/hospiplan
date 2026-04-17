import { ChevronDown } from 'lucide-react';

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  error,
  disabled = false,
  required = false,
  icon: Icon,
  ...props
}) {
  return (
    <div className="select-field">
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className={`select-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        {Icon && <Icon size={18} className="select-icon" />}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="select-chevron" />
      </div>
      {error && <span className="select-error">{error}</span>}
    </div>
  );
}
