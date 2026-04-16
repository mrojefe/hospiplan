# Exercice — Formulaire Avancé avec Validation

## Contexte

Tu dois créer un formulaire pour **créer un nouveau shift** (poste de garde).

**Champs requis** :
- Unité de soins (select)
- Type de shift (select)
- Date et heure de début (datetime-local)
- Date et heure de fin (datetime-local)
- Staff minimum requis (number)
- Staff maximum (number, optionnel)
- Certifications requises (multi-select)

## Validation Frontend

Avant d'envoyer au backend, valider :
1. Date de fin > Date de début
2. Staff max > Staff min (si renseigné)
3. Durée du shift cohérente avec le type sélectionné

---

## Partie 1 — Structure du Formulaire

**À compléter** :

```jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Card, Button, Alert } from '../ui';

function ShiftForm() {
  // États pour les listes (chargées depuis API)
  const [careUnits, setCareUnits] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    care_unit: '',
    shift_type: '',
    start_datetime: '',
    end_datetime: '',
    min_staff: 1,
    max_staff: '',
    required_certifications: []  // ← Tableau pour multi-select
  });
  
  // États de soumission
  const [errors, setErrors] = useState({});  // ← Erreurs par champ
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [unitsRes, typesRes, certsRes] = await Promise.all([
          api.getCareUnits(),
          api.getShiftTypes(),
          api.getCertifications()
        ]);
        setCareUnits(unitsRes.data);
        setShiftTypes(typesRes.data);
        setCertifications(certsRes.data);
      } catch (err) {
        setSubmitError('Erreur de chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Gestion des changements
  const handleChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    
    if (type === 'select-multiple') {
      // Multi-select : récupérer tous les IDs sélectionnés
      const values = Array.from(selectedOptions).map(opt => opt.value);
      setFormData({ ...formData, [name]: values });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  // Validation
  const validate = () => {
    const newErrors = {};
    
    // 1. Dates cohérentes
    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);
      
      if (end <= start) {
        newErrors.end_datetime = 'La date de fin doit être après la date de début';
      }
    }
    
    // 2. Staff max > min
    if (formData.max_staff && parseInt(formData.max_staff) <= parseInt(formData.min_staff)) {
      newErrors.max_staff = 'Le staff maximum doit être supérieur au minimum';
    }
    
    // 3. Champs requis
    if (!formData.care_unit) newErrors.care_unit = 'Unité requise';
    if (!formData.shift_type) newErrors.shift_type = 'Type de shift requis';
    if (!formData.start_datetime) newErrors.start_datetime = 'Date de début requise';
    if (!formData.end_datetime) newErrors.end_datetime = 'Date de fin requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    
    if (!validate()) return;
    
    try {
      await api.createShift(formData);
      setSubmitSuccess(true);
      
      // Reset
      setFormData({
        care_unit: '',
        shift_type: '',
        start_datetime: '',
        end_datetime: '',
        min_staff: 1,
        max_staff: '',
        required_certifications: []
      });
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Erreur de création');
    }
  };
  
  if (loading) return <p>Chargement...</p>;
  
  return (
    <Card title="Créer un Shift">
      {submitSuccess && <Alert variant="success">Shift créé avec succès !</Alert>}
      {submitError && <Alert variant="error">{submitError}</Alert>}
      
      <form onSubmit={handleSubmit}>
        {/* Unité de soins */}
        <div className="form-group">
          <label>Unité de soins *</label>
          <select 
            name="care_unit"
            value={formData.care_unit}
            onChange={handleChange}
            className={errors.care_unit ? 'error' : ''}
          >
            <option value="">Sélectionner...</option>
            {careUnits.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          {errors.care_unit && <span className="error-text">{errors.care_unit}</span>}
        </div>
        
        {/* Type de shift */}
        <div className="form-group">
          <label>Type de shift *</label>
          <select 
            name="shift_type"
            value={formData.shift_type}
            onChange={handleChange}
            className={errors.shift_type ? 'error' : ''}
          >
            <option value="">Sélectionner...</option>
            {shiftTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.duration_hours}h)</option>
            ))}
          </select>
          {errors.shift_type && <span className="error-text">{errors.shift_type}</span>}
        </div>
        
        {/* Dates */}
        <div className="form-row">
          <div className="form-group">
            <label>Début *</label>
            <input
              type="datetime-local"
              name="start_datetime"
              value={formData.start_datetime}
              onChange={handleChange}
              className={errors.start_datetime ? 'error' : ''}
            />
            {errors.start_datetime && <span className="error-text">{errors.start_datetime}</span>}
          </div>
          
          <div className="form-group">
            <label>Fin *</label>
            <input
              type="datetime-local"
              name="end_datetime"
              value={formData.end_datetime}
              onChange={handleChange}
              className={errors.end_datetime ? 'error' : ''}
            />
            {errors.end_datetime && <span className="error-text">{errors.end_datetime}</span>}
          </div>
        </div>
        
        {/* Staff min/max */}
        <div className="form-row">
          <div className="form-group">
            <label>Staff minimum *</label>
            <input
              type="number"
              name="min_staff"
              value={formData.min_staff}
              onChange={handleChange}
              min="1"
            />
          </div>
          
          <div className="form-group">
            <label>Staff maximum</label>
            <input
              type="number"
              name="max_staff"
              value={formData.max_staff}
              onChange={handleChange}
              min={formData.min_staff}
              className={errors.max_staff ? 'error' : ''}
            />
            {errors.max_staff && <span className="error-text">{errors.max_staff}</span>}
          </div>
        </div>
        
        {/* Certifications (multi-select) */}
        <div className="form-group">
          <label>Certifications requises</label>
          <select
            name="required_certifications"
            multiple
            value={formData.required_certifications}
            onChange={handleChange}
            size="4"
          >
            {certifications.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <small>Ctrl/Cmd + clic pour sélection multiple</small>
        </div>
        
        <Button type="submit" variant="primary">Créer le shift</Button>
      </form>
    </Card>
  );
}

export default ShiftForm;
```

---

## Partie 2 — Extraction en Hook Custom

**Objectif** : Créer un hook `useForm` réutilisable.

```javascript
// hooks/useForm.js
export function useForm(initialState, validateFn) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value, type, checked, selectedOptions } = e.target;
    
    let fieldValue;
    if (type === 'checkbox') {
      fieldValue = checked;
    } else if (type === 'select-multiple') {
      fieldValue = Array.from(selectedOptions).map(opt => opt.value);
    } else {
      fieldValue = value;
    }
    
    setValues({ ...values, [name]: fieldValue });
    
    // Valider si le champ a déjà été touché
    if (touched[name]) {
      const fieldErrors = validateFn({ ...values, [name]: fieldValue });
      setErrors({ ...errors, [name]: fieldErrors[name] });
    }
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    const fieldErrors = validateFn(values);
    setErrors({ ...errors, [name]: fieldErrors[name] });
  };
  
  const validate = () => {
    const formErrors = validateFn(values);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };
  
  const reset = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues
  };
}
```

**Usage** :

```jsx
function ShiftForm() {
  const validate = (values) => {
    const errors = {};
    
    if (values.end_datetime && values.start_datetime) {
      if (new Date(values.end_datetime) <= new Date(values.start_datetime)) {
        errors.end_datetime = 'Fin doit être après début';
      }
    }
    
    return errors;
  };
  
  const { values, errors, handleChange, handleBlur, validate, reset } = useForm(
    {
      care_unit: '',
      shift_type: '',
      start_datetime: '',
      end_datetime: '',
      min_staff: 1,
      max_staff: '',
      required_certifications: []
    },
    validate
  );
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    await api.createShift(values);
    reset();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="start_datetime"
        value={values.start_datetime}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors.start_datetime && <span>{errors.start_datetime}</span>}
      {/* ... */}
    </form>
  );
}
```

---

## Checklist de Validation

- [ ] Tous les champs contrôlés (`value` + `onChange`)
- [ ] Validation avant soumission
- [ ] Messages d'erreur par champ
- [ ] Indicateur de champs requis (`*`)
- [ ] Reset après succès
- [ ] Gestion des erreurs API
- [ ] Multi-select fonctionnel
- [ ] Hook custom `useForm` créé
