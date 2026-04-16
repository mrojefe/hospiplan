# Composants UI — Architecture Frontend

## Introduction — Composants Réutilisables

Dans HospiPlan, l'interface est construite avec des **composants réutilisables** :

- `Card` — Conteneur avec style
- `Table` — Tableau de données
- `Badge` — Étiquette colorée
- `Alert` — Message d'information/erreur
- `Button` — Bouton stylisé

---

## Pattern de Composition

### Le Fichier `index.jsx`

```javascript
// src/components/ui/index.jsx
export { Card } from './Card.jsx';
export { Table } from './Table.jsx';
export { Badge } from './Badge.jsx';
export { Alert } from './Alert.jsx';
export { Button } from './Button.jsx';
```

**Usage** :
```jsx
import { Card, Table, Badge, Alert, Button } from '../ui/index.jsx';
```

---

## Card — Conteneur

```jsx
// src/components/ui/Card.jsx
import './Card.css';

export function Card({ children, title, description }) {
  return (
    <div className="card">
      {(title || description) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {description && (
            <p className="card-description">{description}</p>
          )}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}
```

**Usage** :
```jsx
<Card title="Affectations" description="Gérer les plannings">
  <form>...</form>
</Card>
```

---

## Table — Tableau de Données

```jsx
// src/components/ui/Table.jsx
import './Table.css';

export function Table({ headers, children }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
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
```

**Usage** :
```jsx
<Table headers={['Nom', 'Email', 'Statut']}>
  {staffList.map(s => (
    <tr key={s.id}>
      <td>{s.first_name} {s.last_name}</td>
      <td>{s.email}</td>
      <td><Badge variant={s.is_active ? 'success' : 'danger'}>
        {s.is_active ? 'Actif' : 'Inactif'}
      </Badge></td>
    </tr>
  ))}
</Table>
```

---

## Badge — Étiquette Colorée

```jsx
// src/components/ui/Badge.jsx
import './Badge.css';

export function Badge({ children, variant = 'default' }) {
  const variantClasses = {
    default: 'badge-default',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
  };
  
  const className = `badge ${variantClasses[variant] || variantClasses.default}`;
  
  return <span className={className}>{children}</span>;
}
```

**CSS associé** :
```css
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success { background: #dcfce7; color: #166534; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #dbeafe; color: #1e40af; }
```

**Usage** :
```jsx
<Badge variant="success">Assigné</Badge>
<Badge variant="danger">Refusé</Badge>
<Badge variant="warning">En attente</Badge>
```

---

## Alert — Messages

```jsx
// src/components/ui/Alert.jsx
import './Alert.css';

export function Alert({ children, variant = 'info' }) {
  const variantClasses = {
    info: 'alert-info',
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
  };
  
  return (
    <div className={`alert ${variantClasses[variant]}`}>
      {children}
    </div>
  );
}
```

**Usage dans HospiPlan** :
```jsx
{submitState.message && (
  <Alert variant={submitState.type}>
    {submitState.message}
  </Alert>
)}
```

---

## Button — Bouton

```jsx
// src/components/ui/Button.jsx
import './Button.css';

export function Button({ 
  children, 
  type = 'button', 
  variant = 'default',
  disabled = false,
  onClick,
  className = ''
}) {
  const baseClasses = 'btn';
  const variantClasses = {
    default: 'btn-default',
    primary: 'btn-primary',
    danger: 'btn-danger',
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    disabled ? 'btn-disabled' : '',
    className
  ].join(' ');
  
  return (
    <button 
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Usage** :
```jsx
<Button type="submit" variant="primary" disabled={isSubmitting}>
  {isSubmitting ? 'Traitement...' : 'Valider'}
</Button>
```

---

## Layout — Structure de Page

```jsx
// src/components/layout/Layout.jsx
import { Sidebar } from './Sidebar.jsx';
import './Layout.css';

export function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
```

**Sidebar** :
```jsx
// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, ClipboardList } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/shifts', label: 'Shifts', icon: Calendar },
    { path: '/assignments', label: 'Affectations', icon: ClipboardList },
  ];
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>HospiPlan</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

## Page Complète — AssignmentsPage

```jsx
// src/pages/AssignmentsPage.jsx
import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api } from '../api/client';
import { Card, Table, Badge, Alert, Button } from '../ui/index';
import { UserPlus } from 'lucide-react';

export default function AssignmentsPage() {
  const { data: assignments, execute: fetchAssignments } = useFetch(api.getAssignments);
  const { data: staffList, execute: fetchStaff } = useFetch(api.getStaff);
  const { data: shifts, execute: fetchShifts } = useFetch(api.getShifts);
  
  const [formData, setFormData] = useState({ shift: '', staff: '' });
  const [submitState, setSubmitState] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchAssignments();
    fetchStaff();
    fetchShifts();
  }, [fetchAssignments, fetchStaff, fetchShifts]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ type: null, message: '' });
    setIsSubmitting(true);
    
    try {
      await api.createAssignment(formData);
      setSubmitState({ type: 'success', message: 'Affectation créée !' });
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  "Erreur : Violation d'une contrainte métier.";
      setSubmitState({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="page-animate">
      <div className="page-header">
        <h1>Affectations & Planification</h1>
        <p className="subtitle">Moteur intelligent de gestion des contraintes</p>
      </div>
      
      <div className="assignments-grid">
        {/* Formulaire */}
        <div className="form-column">
          <Card title="Générer une Affectation" 
                description="Contraintes strictes par le backend">
            
            {submitState.message && (
              <Alert variant={submitState.type}>
                {submitState.message}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="assignment-form">
              <div className="form-group">
                <label className="form-label">Poste Sélectionné</label>
                <select 
                  className="form-select"
                  value={formData.shift} 
                  onChange={e => setFormData({...formData, shift: e.target.value})} 
                  required
                >
                  <option value="">-- Assigner un shift --</option>
                  {shifts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.care_unit_name} - {new Date(p.start_datetime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Agent de Santé</label>
                <select 
                  className="form-select"
                  value={formData.staff} 
                  onChange={e => setFormData({...formData, staff: e.target.value})} 
                  required
                >
                  <option value="">-- Assigner un agent --</option>
                  {staffList.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <UserPlus size={18} style={{ marginRight: '8px' }}/>
                {isSubmitting ? 'Traitement...' : 'Valider'}
              </Button>
            </form>
          </Card>
        </div>
        
        {/* Tableau */}
        <div className="table-column">
          <Card title="Historique (Affectations validées)">
            <Table headers={['Agent', 'Début Shift', 'Fin Shift', 'Status']}>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td className="font-medium">
                    {a.staff_first_name} {a.staff_last_name}
                  </td>
                  <td>{new Date(a.shift_start).toLocaleString()}</td>
                  <td>{new Date(a.shift_end).toLocaleString()}</td>
                  <td>
                    <Badge variant="success">
                      Assigné le {new Date(a.assigned_at).toLocaleDateString()}
                    </Badge>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">
                    Aucune affectation trouvée.
                  </td>
                </tr>
              )}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## Exercice — Créer un Composant Modal

**Contexte** : Créer un composant `Modal` réutilisable pour confirmer les suppressions.

**Spécifications** :
- Props : `isOpen`, `onClose`, `onConfirm`, `title`, `children`
- Fond semi-transparent (`rgba(0,0,0,0.5)`)
- Centré à l'écran
- Boutons "Annuler" et "Confirmer"

**À compléter** :

```jsx
// src/components/ui/Modal.jsx
import './Modal.css';
import { Button } from './Button';

export function Modal({ isOpen, onClose, onConfirm, title, children }) {
  if (!isOpen) return ____;
  
  return (
    <div className="modal-overlay" onClick={____}>
      <div className="modal-content" onClick={____}>
        <h3>{____}</h3>
        <div className="modal-body">{____}</div>
        <div className="modal-footer">
          <Button variant="____" onClick={____}>Annuler</Button>
          <Button variant="____" onClick={____}>Confirmer</Button>
        </div>
      </div>
    </div>
  );
}
```

**CSS à créer** :
```css
.modal-overlay { /* ... */ }
.modal-content { /* ... */ }
.modal-body { /* ... */ }
.modal-footer { /* ... */ }
```

**Usage** :
```jsx
const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null });

<Modal
  isOpen={deleteModal.isOpen}
  onClose={() => setDeleteModal({ isOpen: false, itemId: null })}
  onConfirm={() => handleDelete(deleteModal.itemId)}
  title="Confirmer la suppression"
>
  Êtes-vous sûr de vouloir supprimer cette affectation ?
</Modal>
```

<details>
<summary>Solution complète</summary>

```jsx
// Modal.jsx
import './Modal.css';
import { Button } from './Button';

export function Modal({ isOpen, onClose, onConfirm, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <Button variant="default" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm}>Confirmer</Button>
        </div>
      </div>
    </div>
  );
}
```

```css
/* Modal.css */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 600px;
}

.modal-title {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

**Export dans index.jsx** :
```javascript
export { Modal } from './Modal.jsx';
```

</details>

---

## Points Clés à Retenir

1. **Composition** — Les composants s'assemblent (`Card` contient `Table` contient `Badge`)
2. **Props** — `children`, `variant`, `className` pour la flexibilité
3. **Conditional rendering** — `condition && <Component />` pour afficher conditionnellement
4. **CSS Modules** — Un fichier CSS par composant pour l'encapsulation
5. **Barrel export** — `index.jsx` pour importer plusieurs composants facilement
