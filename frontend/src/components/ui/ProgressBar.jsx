export function ProgressBar({ value, max = 100, color = 'blue', size = 'md', showLabel = true }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'progress-blue',
    green: 'progress-green',
    orange: 'progress-orange',
    red: 'progress-red',
  };

  const sizeClasses = {
    sm: 'progress-sm',
    md: 'progress-md',
    lg: 'progress-lg',
  };

  return (
    <div className={`progress-container ${sizeClasses[size]}`}>
      <div className="progress-track">
        <div
          className={`progress-fill ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
