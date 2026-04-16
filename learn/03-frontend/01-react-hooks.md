# React Hooks — useState & useEffect

## Introduction — Pourquoi des Hooks ?

Les **Hooks** sont des fonctions React qui permettent d'utiliser le **state** et le **cycle de vie** dans les composants fonctionnels.

**Avant (Classes)** : Verbeux, complexe
**Après (Hooks)** : Simple, réutilisable

---

## useState — Gérer des Données qui Changent

### Syntaxe de Base

```javascript
const [state, setState] = useState(valeurInitiale);
```

| Élément | Description |
|---------|-------------|
| `state` | Valeur actuelle |
| `setState` | Fonction pour modifier la valeur |
| `valeurInitiale` | Valeur au démarrage |

### Exemple Complet — Compteur

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
}
```

**Ce qui se passe** :
1. `count` vaut `0` au début
2. Clique sur +1 → `setCount(1)` → React re-render → `count` vaut `1`
3. Le DOM est mis à jour automatiquement

---

## useState avec Objets

### Formulaire — Exemple HospiPlan

```jsx
import { useState } from 'react';

function StaffForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,        // ← Copie l'existant
      [name]: value       // ← Met à jour seulement le champ modifié
    });
  };
  
  return (
    <form>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Prénom"
      />
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Nom"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      
      <p>Résumé : {formData.firstName} {formData.lastName}</p>
    </form>
  );
}
```

**Pattern important** : `...formData` (spread operator) copie tous les champs existants avant modification.

---

## useState avec Tableaux

### Liste d'Éléments — Exemple Affectations

```jsx
function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  
  // Ajouter une affectation
  const addAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
  };
  
  // Supprimer une affectation
  const removeAssignment = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };
  
  // Modifier une affectation
  const updateAssignment = (id, updates) => {
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };
  
  return (
    <ul>
      {assignments.map(a => (
        <li key={a.id}>
          {a.staffName} - {a.shiftDate}
          <button onClick={() => removeAssignment(a.id)}>❌</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## useEffect — Exécuter du Code Secondaire

**Quand utiliser ?**
- Appels API (fetch data)
- Subscriptions (WebSocket)
- Manipulation DOM directe
- Timers

### Syntaxe de Base

```javascript
useEffect(() => {
  // Code exécuté après le rendu
  
  return () => {
    // Cleanup (optionnel) — exécuté avant le prochain effet ou au démontage
  };
}, [dependencies]);  // ← Si vide [], exécuté une seule fois
```

| Dépendances | Comportement |
|-------------|--------------|
| `[]` | Une fois au montage |
| `[prop]` | Quand `prop` change |
| Sans tableau | À chaque rendu (rarement utile) |

---

## useEffect — Appel API

### Pattern Standard HospiPlan

```jsx
import { useState, useEffect } from 'react';
import { api } from './api/client';

function StaffList() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fonction async déclarée à l'intérieur
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await api.getStaff();
        setStaffList(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaff();
  }, []);  // ← [] = exécuté une fois au chargement
  
  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {error}</p>;
  
  return (
    <ul>
      {staffList.map(staff => (
        <li key={staff.id}>{staff.first_name} {staff.last_name}</li>
      ))}
    </ul>
  );
}
```

---

## useEffect avec Dépendances

### Re-fetch quand l'ID Change

```jsx
function StaffDetail({ staffId }) {
  const [staff, setStaff] = useState(null);
  
  useEffect(() => {
    const fetchStaff = async () => {
      const response = await api.getStaffById(staffId);
      setStaff(response.data);
    };
    
    fetchStaff();
  }, [staffId]);  // ← Re-exécuté quand staffId change
  
  if (!staff) return <p>Chargement...</p>;
  
  return (
    <div>
      <h1>{staff.first_name} {staff.last_name}</h1>
      <p>Email: {staff.email}</p>
    </div>
  );
}
```

---

## useEffect Cleanup — Nettoyage

### Exemple — Timer / Subscription

```jsx
function Clock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    // Démarrer le timer
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    // Cleanup — arrêter le timer quand le composant se démonte
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return <p>{time.toLocaleTimeString()}</p>;
}
```

**Pourquoi ?** Évite les fuites mémoire (memory leaks).

---

## Hook Custom — useFetch

**Problème** : On répète toujours le même pattern (loading, error, data).

**Solution** : Créer un hook réutilisable.

```javascript
// hooks/useFetch.js
import { useState, useEffect } from 'react';

export function useFetch(apiFunction) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = async (...params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...params);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
}
```

### Utilisation dans HospiPlan

```jsx
import { useFetch } from './hooks/useFetch';
import { api } from './api/client';

function StaffPage() {
  const { data: staffList, loading, error, execute } = useFetch(api.getStaff);
  
  useEffect(() => {
    execute();
  }, [execute]);
  
  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {error}</p>;
  
  return (
    <ul>
      {staffList.map(s => <li key={s.id}>{s.first_name}</li>)}
    </ul>
  );
}
```

---

## Exercice — Formulaire d'Affectation

**Contexte** : Créer un formulaire pour assigner un staff à un shift.

**États nécessaires** :
- Liste des staff (chargée depuis API)
- Liste des shifts (chargée depuis API)
- `formData` avec `staffId` et `shiftId` sélectionnés
- `submitting` (booléen pendant l'envoi)
- `submitError` (message d'erreur)
- `submitSuccess` (booléen pour message de succès)

**À compléter** :

```jsx
import { useState, useEffect } from 'react';
import { api } from './api/client';

function AssignmentForm() {
  // État pour les listes (chargées depuis API)
  const [staffList, setStaffList] = useState(____);
  const [shiftList, setShiftList] = useState(____);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    staffId: ____,
    shiftId: ____
  });
  
  // État de soumission
  const [submitting, setSubmitting] = useState(____);
  const [submitError, setSubmitError] = useState(____);
  const [submitSuccess, setSubmitSuccess] = useState(____);
  
  // Charger les listes au montage
  useEffect(() => {
    // À compléter
  }, [____]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(____);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(____);
    setSubmitError(____);
    
    try {
      await ____(formData);
      setSubmitSuccess(____);
      setFormData({ staffId: '', shiftId: '' });
    } catch (err) {
      setSubmitError(____);
    } finally {
      setSubmitting(____);
    }
  };
  
  return (
    <form onSubmit={____}>
      {/* Select pour staff */}
      <select name="staffId" value={____} onChange={____}>
        <option value="">Choisir un staff</option>
        {staffList.map(s => (
          <option key={____} value={____}>
            {s.first_name} {s.last_name}
          </option>
        ))}
      </select>
      
      {/* Select pour shift */}
      <select name="shiftId" value={____} onChange={____}>
        <option value="">Choisir un shift</option>
        {shiftList.map(s => (
          <option key={____} value={____}>
            {s.care_unit_name} - {new Date(s.start_datetime).toLocaleDateString()}
          </option>
        ))}
      </select>
      
      <button type="submit" disabled={____}>
        {submitting ? 'En cours...' : 'Assigner'}
      </button>
      
      {submitError && <p className="error">{____}</p>}
      {submitSuccess && <p className="success">Affectation créée !</p>}
    </form>
  );
}
```

<details>
<summary>Solution complète</summary>

```jsx
import { useState, useEffect } from 'react';
import { api } from './api/client';

function AssignmentForm() {
  const [staffList, setStaffList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  
  const [formData, setFormData] = useState({
    staffId: '',
    shiftId: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, shiftRes] = await Promise.all([
          api.getStaff(),
          api.getShifts()
        ]);
        setStaffList(staffRes.data);
        setShiftList(shiftRes.data);
      } catch (err) {
        console.error('Erreur chargement:', err);
      }
    };
    
    fetchData();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      await api.createAssignment({
        staff: formData.staffId,
        shift: formData.shiftId
      });
      setSubmitSuccess(true);
      setFormData({ staffId: '', shiftId: '' });
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail || 
        'Erreur lors de la création'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <select 
        name="staffId" 
        value={formData.staffId} 
        onChange={handleChange}
        required
      >
        <option value="">Choisir un staff</option>
        {staffList.map(s => (
          <option key={s.id} value={s.id}>
            {s.first_name} {s.last_name}
          </option>
        ))}
      </select>
      
      <select 
        name="shiftId" 
        value={formData.shiftId} 
        onChange={handleChange}
        required
      >
        <option value="">Choisir un shift</option>
        {shiftList.map(s => (
          <option key={s.id} value={s.id}>
            {s.care_unit_name} - {new Date(s.start_datetime).toLocaleDateString()}
          </option>
        ))}
      </select>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'En cours...' : 'Assigner'}
      </button>
      
      {submitError && <p className="error">{submitError}</p>}
      {submitSuccess && <p className="success">Affectation créée !</p>}
    </form>
  );
}
```

</details>

---

## Points Clés à Retenir

1. **`useState`** = Données qui changent → React re-render automatiquement
2. **Spread operator** `...state` = Copier avant de modifier (immutabilité)
3. **`useEffect`** = Code secondaire (API, timers, subscriptions)
4. **Dépendances** `[]` = Contrôle quand l'effet s'exécute
5. **Cleanup** = Fonction de retour dans `useEffect` pour nettoyer
6. **Hook custom** = Factoriser la logique réutilisable (DRY)
