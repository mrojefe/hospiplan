// Card.jsx
export function Card({ children, title, description, className = '' }) {
  return (
    <div className={`ui-card ${className}`}>
      {(title || description) && (
        <div className="ui-card-header">
          {title && <h3 className="ui-card-title">{title}</h3>}
          {description && <p className="ui-card-description">{description}</p>}
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
