export function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  min,
  max,
  ...props
}) {
  return (
    <div className="datepicker-field">
      {label && (
        <label className="datepicker-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className={`datepicker-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          type="datetime-local"
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          {...props}
        />
      </div>
      {error && <span className="datepicker-error">{error}</span>}
    </div>
  );
}
