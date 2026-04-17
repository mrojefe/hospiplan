export function StatsCard({ title, value, icon: Icon, trend, trendUp, color = 'blue' }) {
  const colorClasses = {
    blue: { bg: 'stats-blue', icon: 'icon-blue' },
    green: { bg: 'stats-green', icon: 'icon-green' },
    orange: { bg: 'stats-orange', icon: 'icon-orange' },
    red: { bg: 'stats-red', icon: 'icon-red' },
    purple: { bg: 'stats-purple', icon: 'icon-purple' },
  };

  const colors = colorClasses[color];

  return (
    <div className={`stats-card ${colors.bg}`}>
      <div className="stats-content">
        <div className={`stats-icon ${colors.icon}`}>
          {Icon && <Icon size={24} />}
        </div>
        <div className="stats-info">
          <p className="stats-title">{title}</p>
          <h4 className="stats-value">{value}</h4>
          {trend && (
            <span className={`stats-trend ${trendUp ? 'up' : 'down'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
