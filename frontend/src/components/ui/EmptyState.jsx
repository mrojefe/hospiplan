import { FileX, Plus } from 'lucide-react';

export function EmptyState({
  title = 'Aucune donnée',
  description = 'Commencez par ajouter un nouvel élément.',
  icon: Icon = FileX,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={48} />
      </div>
      <h4 className="empty-title">{title}</h4>
      <p className="empty-description">{description}</p>
      {actionLabel && onAction && (
        <button className="empty-action" onClick={onAction}>
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
