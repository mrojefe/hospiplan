# Architecture Globale — Le Big Picture

## Les 3 Tiers (3-Layer Architecture)

HospiPlan suit l'architecture classique des applications modernes :

```
┌────────────────────────────────────────────────────────────┐
│  TIER 1 : PRÉSENTATION (Frontend)                          │
│  React + Vite → Ce que voit l'utilisateur                  │
│  • Composants UI (Card, Table, Formulaires)                  │
│  • Gestion d'état (useState, useEffect)                       │
│  • Appels API (Axios)                                        │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────▼───────────────────────────────────┐
│  TIER 2 : LOGIQUE MÉTIER (Backend)                           │
│  Django REST Framework → Le cerveau de l'application         │
│  • Endpoints API (URLs)                                      │
│  • Sérializers (JSON ↔ Python)                              │
│  • Views (logique métier, 8 contraintes dures)              │
│  • Models (ORM ↔ SQL)                                        │
└──────────────────────────┬───────────────────────────────────┘
                           │ SQL
┌──────────────────────────▼───────────────────────────────────┐
│  TIER 3 : DONNÉES (Database)                               │
│  PostgreSQL / SQLite → Le stockage persistant               │
│  • 24 tables relationnelles                                  │
│  • Index, contraintes, relations                             │
│  • Soft deletes (deleted_at)                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Flux de Données — Création d'une Affectation

Prenons l'exemple concret : **Marie est affectée au poste de nuit**.

### Étape 1 : L'utilisateur clique (Frontend)

```jsx
// AssignmentsPage.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  await api.createAssignment({ shift: 5, staff: 42 });
};
```

**Ce qui se passe** : Le composant React appelle la fonction `createAssignment` avec les IDs.

---

### Étape 2 : Appel HTTP vers l'API

```javascript
// api/client.js
apiClient.post('assignments/', { shift: 5, staff: 42 })
```

**Ce qui se passe** : Une requête **POST** part vers `http://localhost:8000/api/assignments/` avec le JSON :
```json
{
  "shift": 5,
  "staff": 42
}
```

---

### Étape 3 : Django reçoit et route

```python
# api/urls.py
router.register(r'assignments', ShiftAssignmentViewSet)
```

**Ce qui se passe** : Django REST Framework sait que POST sur `/assignments/` → méthode `create()` du `ShiftAssignmentViewSet`.

---

### Étape 4 : Sérialization (Validation entrée)

```python
# serializers.py
serializer.is_valid()  # Vérifie que shift et staff existent
```

**Ce qui se passe** : Le **Serializer** convertit le JSON en objet Python et valide les champs requis.

---

### Étape 5 : Les 8 Contraintes Dures (Cœur métier)

```python
# views.py
@transaction.atomic
def perform_create(self, serializer):
    shift = serializer.validated_data['shift']
    staff = Staff.objects.select_for_update().get(id=staff_id)
    
    # 🔒 VERROU BDD — Anti race condition
    
    # 1. Chevauchement ?
    # 2. Certifications OK ?
    # 3. Repos post-nuit respecté ?
    # 4. Contrat actif ?
    # 5. Pas en absence ?
    # 6. Quota hebdo non dépassé ?
    # 7. Pas de contrainte F-07 ?
    # 8. Seuil de sécurité maintenu ?
    
    self.validate_assignment_hard_constraints(staff, shift)
    serializer.save()  # ✅ Validation OK → Enregistrement
```

**Ce qui se passe** : Si UNE SEULE contrainte échoue → **ValidationError** → HTTP 400 Bad Request.

---

### Étape 6 : Réponse au Frontend

**Cas succès** (HTTP 201 Created) :
```json
{
  "id": 123,
  "shift": 5,
  "staff": 42,
  "assigned_at": "2024-04-15T10:30:00Z"
}
```

**Cas échec** (HTTP 400 Bad Request) :
```json
{
  "non_field_errors": [
    "The staff member lacks the required certification: Urgences"
  ]
}
```

---

### Étape 7 : Affichage à l'utilisateur

```jsx
// AssignmentsPage.jsx
try {
  await api.createAssignment(formData);
  setSubmitState({ type: 'success', message: 'Affectation créée !' });
} catch (err) {
  const msg = err.response?.data?.non_field_errors?.[0];
  setSubmitState({ type: 'error', message: msg });
}
```

**Ce qui se passe** : L'alerte rouge/verte s'affiche selon la réponse du backend.

---

## Schéma Complet du Flux

```
┌─────────────┐     POST /api/assignments/     ┌─────────────┐
│   React     │ ─────────────────────────────→│   Django    │
│  (Browser)  │    {shift: 5, staff: 42}       │   (Server)  │
└─────────────┘                               └──────┬──────┘
       ↑                                              │
       │                                              ↓
       │                                       ┌─────────────┐
       │                                       │  Serializer │
       │                                       │  Validation │
       │                                       └──────┬──────┘
       │                                              │
       │                                              ↓
       │                                       ┌─────────────┐
       │                                       │  8 Contraintes
       │                                       │   Dures     │
       │                                       │  Validées  │
       │                                       └──────┬──────┘
       │                                              │
       │                    HTTP 201                  │
       │←─────────────────────────────────────────────┘ (succès)
       │                    ou HTTP 400
       │←─────────────────────────────────────────────┘ (échec)
```

---

## Exercice : Tracer le Flux

**Scénario** : Paul (staff_id=7) tente d'être affecté au shift de nuit (shift_id=3) mais il n'a pas la certif "Urgences".

**Question** : Décris le chemin complet de la requête jusqu'à l'erreur affichée.

<details>
<summary>Solution guidée</summary>

1. **Frontend** : Paul clique sur "Valider" → `handleSubmit` appelle `api.createAssignment({shift: 3, staff: 7})`

2. **HTTP** : Requête POST vers `/api/assignments/` avec body JSON

3. **Django URLs** : Router redirige vers `ShiftAssignmentViewSet.create()`

4. **Serializer** : `ShiftAssignmentSerializer` valide que les IDs existent

5. **perform_create** : Appelle `validate_assignment_hard_constraints(staff=Paul, shift=Nuit)`

6. **Contrainte #2** : Boucle sur `shift.required_certifications.all()` → Vérifie certifications de Paul
   ```python
   has_certif = StaffCertification.objects.filter(
       staff=Paul,
       certification="Urgences",
       ...
   ).exists()  # → False ❌
   ```

7. **ValidationError** : `raise ValidationError("The staff member lacks the required certification...")`

8. **Réponse HTTP 400** : Django transforme l'exception en JSON d'erreur

9. **Frontend** : `catch (err)` récupère `err.response.data.non_field_errors[0]`

10. **Affichage** : Composant `<Alert variant="error">` affiche le message

</details>
