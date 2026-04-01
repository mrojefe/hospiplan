import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export default function Affectations() {
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  const [formData, setFormData] = useState({ shift: '', staff: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const urls = ['http://127.0.0.1:8000/api/assignments/', 'http://127.0.0.1:8000/api/staff/', 'http://127.0.0.1:8000/api/shifts/'];
      const [assRes, staffRes, shiftRes] = await Promise.all(urls.map(u => axios.get(u)));
      setAssignments(assRes.data);
      setStaff(staffRes.data);
      setShifts(shiftRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://127.0.0.1:8000/api/assignments/', formData);
      setSuccess("Affectation (Shift Assignment) créée avec succès !");
      fetchData(); // Refresh list
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.detail || 
                  "Erreur de contrainte : l'affectation est illégale vu le profil de l'agent.";
      setError(msg);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      
      {/* Formulaire de Création */}
      <div className="glass-card">
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Nouvelle Affectation</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Les contraintes dures seront validées par l'API (Règles Fonctionnelles).</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Sélectionner un Shift (Poste)</label>
            <select className="form-input" 
              value={formData.shift} 
              onChange={e => setFormData({...formData, shift: e.target.value})} 
              required>
              <option value="">-- Choisir --</option>
              {shifts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.care_unit_name} - {new Date(p.start_datetime).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sélectionner un Soignant (Staff)</label>
            <select className="form-input" 
              value={formData.staff} 
              onChange={e => setFormData({...formData, staff: e.target.value})} 
              required>
              <option value="">-- Choisir --</option>
              {staff.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <UserPlus size={18} />
            Confirmer Affectation
          </button>
        </form>
      </div>

      {/* Liste des Affectations */}
      <div className="glass-card">
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Plannings Actuels</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Soignant</th>
              <th style={{ padding: '0.75rem' }}>Début</th>
              <th style={{ padding: '0.75rem' }}>Fin</th>
              <th style={{ padding: '0.75rem' }}>Validité</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.875rem' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{a.staff_first_name} {a.staff_last_name}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(a.shift_start).toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(a.shift_end).toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}><span className="badge">Généré le {new Date(a.assigned_at).toLocaleDateString()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
