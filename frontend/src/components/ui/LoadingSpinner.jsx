export function LoadingSpinner({ size = 'md', message = 'Chargement...' }) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
  };

  return (
    <div className="loading-wrapper">
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner-circle" />
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
