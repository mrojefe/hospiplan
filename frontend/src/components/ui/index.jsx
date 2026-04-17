// Card.jsx
export function Card({ children, title, description, className = '', actions }) {
  return (
    <div className={`ui-card ${className}`}>
      {(title || description || actions) && (
        <div className="ui-card-header">
          <div className="ui-card-header-content">
            {title && <h3 className="ui-card-title">{title}</h3>}
            {description && <p className="ui-card-description">{description}</p>}
          </div>
          {actions && <div className="ui-card-actions">{actions}</div>}
        </div>
      )}
      <div className="ui-card-content">
        {children}
      </div>
    </div>
  );
}

// Badge.jsx
export function Badge({ children, variant = 'default' }) {
  return (
    <span className={`ui-badge ui-badge-${variant}`}>
      {children}
    </span>
  );
}

// Alert.jsx
export function Alert({ children, variant = 'error' }) {
  return (
    <div className={`ui-alert ui-alert-${variant}`}>
      {children}
    </div>
  );
}

// Button.jsx
export function Button({ children, type = 'button', variant = 'primary', className = '', ...props }) {
  return (
    <button type={type} className={`ui-button ui-button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Table.jsx
export function Table({ headers, children }) {
  return (
    <div className="ui-table-container">
      <table className="ui-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Re-export all new components
export { Modal } from './Modal.jsx';
export { Drawer } from './Drawer.jsx';
export { StatsCard } from './StatsCard.jsx';
export { DataTable } from './DataTable.jsx';
export { ProgressBar } from './ProgressBar.jsx';
export { Input } from './Input.jsx';
export { Select } from './Select.jsx';
export { DatePicker } from './DatePicker.jsx';
export { EmptyState } from './EmptyState.jsx';
export { LoadingSpinner } from './LoadingSpinner.jsx';
