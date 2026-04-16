# Axios & API Client — Communiquer avec le Backend

## Introduction — Pourquoi Axios ?

**Axios** = Bibliothèque HTTP pour faire des requêtes vers une API.

**Pourquoi pas `fetch` natif ?**
- Gestion automatique des erreurs
- Interceptors (ajouter token à chaque requête)
- Transformation JSON automatique
- Annulation de requêtes
- Meilleure gestion des timeouts

---

## Configuration de Base

### Installation

```bash
npm install axios
```

### Client API Configuré

```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',  // ← URL backend
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,  // ← 10 secondes max
});

export default apiClient;
```

---

## Méthodes HTTP

### GET — Récupérer des Données

```javascript
import apiClient from './api/client';

// Liste des staff
const response = await apiClient.get('staff/');
console.log(response.data);  // ← Tableau de staff

// Détail d'un staff
const response = await apiClient.get(`staff/${staffId}/`);
console.log(response.data);  // ← Objet staff

// Avec paramètres de requête
const response = await apiClient.get('staff/', {
  params: { is_active: true }
});
// → GET /api/staff/?is_active=true
```

### POST — Créer

```javascript
// Créer un staff
const newStaff = {
  first_name: 'Marie',
  last_name: 'Dupont',
  email: 'marie@hopital.fr'
};

const response = await apiClient.post('staff/', newStaff);
console.log(response.status);  // 201 Created
console.log(response.data);     // Staff créé avec son ID
```

### PUT/PATCH — Modifier

```javascript
// PUT = remplace tout l'objet
const updatedStaff = {
  first_name: 'Marie',
  last_name: 'Durand',  // ← Changé
  email: 'marie@hopital.fr'
};
await apiClient.put(`staff/${staffId}/`, updatedStaff);

// PATCH = modifie seulement les champs envoyés
await apiClient.patch(`staff/${staffId}/`, {
  last_name: 'Durand'  // ← Seulement ce champ
});
```

### DELETE — Supprimer

```javascript
await apiClient.delete(`staff/${staffId}/`);
// → 204 No Content (succès)
```

---

## API Client Complet — HospiPlan

```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter token (si auth)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirection login si non authentifié
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export des fonctions spécifiques
export const api = {
  // Staff
  getStaff: () => apiClient.get('staff/'),
  getStaffById: (id) => apiClient.get(`staff/${id}/`),
  createStaff: (data) => apiClient.post('staff/', data),
  updateStaff: (id, data) => apiClient.put(`staff/${id}/`, data),
  deleteStaff: (id) => apiClient.delete(`staff/${id}/`),
  
  // Shifts
  getShifts: () => apiClient.get('shifts/'),
  getShiftById: (id) => apiClient.get(`shifts/${id}/`),
  
  // Assignments
  getAssignments: () => apiClient.get('assignments/'),
  createAssignment: (data) => apiClient.post('assignments/', data),
  deleteAssignment: (id) => apiClient.delete(`assignments/${id}/`),
  
  // Absences
  getAbsences: () => apiClient.get('absences/'),
  createAbsence: (data) => apiClient.post('absences/', data),
};

export default apiClient;
```

---

## Gestion des Erreurs

### Try / Catch — Pattern Standard

```javascript
import { api } from './api/client';

async function createNewStaff(staffData) {
  try {
    const response = await api.createStaff(staffData);
    return { success: true, data: response.data };
    
  } catch (error) {
    // Erreur HTTP (4xx, 5xx)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return { 
            success: false, 
            error: 'Données invalides', 
            details: data 
          };
        case 401:
          return { 
            success: false, 
            error: 'Non authentifié' 
          };
        case 403:
          return { 
            success: false, 
            error: 'Non autorisé' 
          };
        case 404:
          return { 
            success: false, 
            error: 'Ressource non trouvée' 
          };
        case 409:
          return { 
            success: false, 
            error: 'Conflit (déjà existe)' 
          };
        default:
          return { 
            success: false, 
            error: `Erreur serveur (${status})` 
          };
      }
    }
    
    // Erreur réseau (pas de réponse)
    if (error.request) {
      return { 
        success: false, 
        error: 'Pas de réponse du serveur. Vérifiez votre connexion.' 
      };
    }
    
    // Erreur configuration
    return { 
      success: false, 
      error: 'Erreur de configuration' 
    };
  }
}
```

---

## Exemple Complet — HospiPlan

### Pattern Réel du Projet

```jsx
// src/pages/AssignmentsPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({ shift: '', staff: '' });
  const [submitState, setSubmitState] = useState({ 
    type: null,  // 'success' | 'error'
    message: '' 
  });
  
  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Parallélisation des requêtes
        const [assignmentsRes, staffRes, shiftsRes] = await Promise.all([
          api.getAssignments(),
          api.getStaff(),
          api.getShifts()
        ]);
        
        setAssignments(assignmentsRes.data);
        setStaffList(staffRes.data);
        setShifts(shiftsRes.data);
        
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ type: null, message: '' });
    
    try {
      await api.createAssignment(formData);
      
      setSubmitState({ 
        type: 'success', 
        message: 'Affectation créée avec succès !' 
      });
      
      // Rafraîchir la liste
      const response = await api.getAssignments();
      setAssignments(response.data);
      
      // Reset formulaire
      setFormData({ shift: '', staff: '' });
      
    } catch (err) {
      // Extraction du message d'erreur backend
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.detail || 
                  "Erreur : Violation d'une contrainte métier.";
      
      setSubmitState({ type: 'error', message: msg });
    }
  };
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div>
      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <select 
          value={formData.shift} 
          onChange={e => setFormData({...formData, shift: e.target.value})}
        >
          <option value="">Choisir un shift</option>
          {shifts.map(s => (
            <option key={s.id} value={s.id}>
              {s.care_unit_name} - {new Date(s.start_datetime).toLocaleDateString()}
            </option>
          ))}
        </select>
        
        <select 
          value={formData.staff} 
          onChange={e => setFormData({...formData, staff: e.target.value})}
        >
          <option value="">Choisir un staff</option>
          {staffList.filter(s => s.is_active).map(s => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name}
            </option>
          ))}
        </select>
        
        <button type="submit">Assigner</button>
      </form>
      
      {/* Messages */}
      {submitState.type && (
        <div className={submitState.type}>
          {submitState.message}
        </div>
      )}
      
      {/* Liste */}
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Shift</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id}>
              <td>{a.staff_first_name} {a.staff_last_name}</td>
              <td>{a.care_unit_name}</td>
              <td>{new Date(a.shift_start).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Exercice — CRUD Complet

**Contexte** : Créer une page de gestion des absences (congés, maladies).

**Fonctionnalités** :
1. Liste des absences avec nom du staff et type
2. Formulaire pour déclarer une absence
3. Bouton pour supprimer une absence

**API disponible** :
```javascript
api.getAbsences()
api.createAbsence({ staff, absence_type, start_date, expected_end_date })
api.deleteAbsence(id)
```

**À compléter** :

```jsx
import { useState, useEffect } from 'react';
import { api } from './api/client';

function AbsencesPage() {
  const [absences, setAbsences] = useState(____);
  const [staffList, setStaffList] = useState(____);
  const [absenceTypes, setAbsenceTypes] = useState(____);
  const [loading, setLoading] = useState(____);
  
  // Formulaire
  const [formData, setFormData] = useState({
    staff: ____,
    absence_type: ____,
    start_date: ____,
    expected_end_date: ____
  });
  
  useEffect(() => {
    // Charger absences, staff, types
    // À compléter
  }, [____]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Créer puis rafraîchir la liste
    // À compléter
  };
  
  const handleDelete = async (id) => {
    // Supprimer puis rafraîchir
    // À compléter
  };
  
  if (loading) return <p>____</p>;
  
  return (
    <div>
      <h1>Gestion des Absences</h1>
      
      {/* Formulaire */}
      <form onSubmit={____}>
        {/* Select staff */}
        {/* Select type d'absence */}
        {/* Input date début */}
        {/* Input date fin prévue */}
        <button type="submit">Déclarer absence</button>
      </form>
      
      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Type</th>
            <th>Début</th>
            <th>Fin prévue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {absences.map(____)}
        </tbody>
      </table>
    </div>
  );
}
```

<details>
<summary>Solution complète</summary>

```jsx
import { useState, useEffect } from 'react';
import { api } from './api/client';

function AbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    staff: '',
    absence_type: '',
    start_date: '',
    expected_end_date: ''
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [absencesRes, staffRes, typesRes] = await Promise.all([
          api.getAbsences(),
          api.getStaff(),
          api.getAbsenceTypes()  // Supposons que ça existe
        ]);
        setAbsences(absencesRes.data);
        setStaffList(staffRes.data);
        setAbsenceTypes(typesRes.data);
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createAbsence(formData);
      
      // Rafraîchir
      const response = await api.getAbsences();
      setAbsences(response.data);
      
      // Reset
      setFormData({
        staff: '',
        absence_type: '',
        start_date: '',
        expected_end_date: ''
      });
      
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.detail || 'Impossible de créer'));
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette absence ?')) return;
    
    try {
      await api.deleteAbsence(id);
      
      // Rafraîchir
      const response = await api.getAbsences();
      setAbsences(response.data);
      
    } catch (err) {
      alert('Erreur de suppression');
    }
  };
  
  if (loading) return <p>Chargement...</p>;
  
  return (
    <div>
      <h1>Gestion des Absences</h1>
      
      <form onSubmit={handleSubmit}>
        <select 
          value={formData.staff} 
          onChange={e => setFormData({...formData, staff: e.target.value})}
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
          value={formData.absence_type} 
          onChange={e => setFormData({...formData, absence_type: e.target.value})}
          required
        >
          <option value="">Type d'absence</option>
          {absenceTypes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        <input 
          type="date" 
          value={formData.start_date}
          onChange={e => setFormData({...formData, start_date: e.target.value})}
          required
        />
        
        <input 
          type="date" 
          value={formData.expected_end_date}
          onChange={e => setFormData({...formData, expected_end_date: e.target.value})}
          required
        />
        
        <button type="submit">Déclarer absence</button>
      </form>
      
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Type</th>
            <th>Début</th>
            <th>Fin prévue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {absences.map(a => (
            <tr key={a.id}>
              <td>{a.staff_name || a.staff}</td>
              <td>{a.type_name || a.absence_type}</td>
              <td>{new Date(a.start_date).toLocaleDateString()}</td>
              <td>{new Date(a.expected_end_date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDelete(a.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AbsencesPage;
```

</details>

---

## Points Clés à Retenir

1. **`axios.create()`** = Client configuré avec baseURL et headers
2. **Méthodes** : `get`, `post`, `put`, `patch`, `delete`
3. **`response.data`** = Corps de la réponse (déjà parsé en JSON)
4. **`error.response`** = Erreur HTTP avec status et data
5. **`Promise.all()`** = Paralléliser plusieurs requêtes
6. **Interceptors** = Logique globale (auth, erreurs)
