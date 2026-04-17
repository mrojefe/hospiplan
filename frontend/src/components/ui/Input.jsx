export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  ...props
}) {
  return (
    <div className="input-field">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className={`input-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
