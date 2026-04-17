import { X } from 'lucide-react';

export function Drawer({ isOpen, onClose, title, children, position = 'right', size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'drawer-sm',
    md: 'drawer-md',
    lg: 'drawer-lg',
  };

  const positionClasses = {
    left: 'drawer-left',
    right: 'drawer-right',
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`drawer ${positionClasses[position]} ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>{title}</h3>
          <button className="drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </>
  );
}
