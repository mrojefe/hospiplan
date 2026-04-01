import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { api } from '../../api/client.js';
import { Card, Table, Badge, Alert, Button } from '../ui/index.jsx';
import { UserPlus } from 'lucide-react';

export default function AssignmentsPage() {
  const { data: assignments, execute: fetchAssignments } = useFetch(api.getAssignments);
  const { data: staffList, execute: fetchStaff } = useFetch(api.getStaff);
  const { data: shifts, execute: fetchShifts } = useFetch(api.getShifts);

  const [formData, setFormData] = useState({ shift: '', staff: '' });
  const [submitState, setSubmitState] = useState({ type: null, message: '' }); // type: 'error' or 'success'
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
      setSubmitState({ type: 'success', message: 'Affectation créée avec succès !' });
      fetchAssignments(); // Refresh grid
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.detail || 
                  "Erreur : Violation d'une contrainte métier (Heures, Repos, Compétences).";
      setSubmitState({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1>Affectations & Planification</h1>
        <p className="subtitle">Moteur intelligent de gestion des contraintes médicales</p>
      </div>

      <div className="assignments-grid">
        {/* Colonne de Création */}
        <div className="form-column">
          <Card title="Générer une Affectation" description="Contraintes strictes par le backend.">
            {submitState.message && (
              <Alert variant={submitState.type}>
                {submitState.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="assignment-form">
              <div className="form-group">
                <label className="form-label">Poste Sélectionné</label>
                <select className="form-select" 
                  value={formData.shift} 
                  onChange={e => setFormData({...formData, shift: e.target.value})} 
                  required>
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
                <select className="form-select" 
                  value={formData.staff} 
                  onChange={e => setFormData({...formData, staff: e.target.value})} 
                  required>
                  <option value="">-- Assigner un agent --</option>
                  {staffList.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="primary" className="btn-w-full" disabled={isSubmitting}>
                <UserPlus size={18} style={{ marginRight: '8px' }}/>
                {isSubmitting ? 'Traitement...' : 'Valider'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Colonne de Visualisation */}
        <div className="table-column">
          <Card title="Historique (Affectations validées)">
            <Table headers={['Agent', 'Début Shift', 'Fin Shift', 'Status du Moteur']}>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td className="font-medium text-slate-800">{a.staff_first_name} {a.staff_last_name}</td>
                  <td>{new Date(a.shift_start).toLocaleString()}</td>
                  <td>{new Date(a.shift_end).toLocaleString()}</td>
                  <td><Badge variant="success">Assigné le {new Date(a.assigned_at).toLocaleDateString()}</Badge></td>
                </tr>
              ))}
               {assignments.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">Aucune affectation trouvée.</td>
                </tr>
              )}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
