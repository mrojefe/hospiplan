import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export default function Affectations() {
  const [affectations, setAffectations] = useState([]);
  const [soignants, setSoignants] = useState([]);
  const [postes, setPostes] = useState([]);
  
  const [formData, setFormData] = useState({ poste: '', soignant: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const urls = ['http://127.0.0.1:8000/api/affectations/', 'http://127.0.0.1:8000/api/soignants/', 'http://127.0.0.1:8000/api/postes/'];
      const [affRes, soiRes, posRes] = await Promise.all(urls.map(u => axios.get(u)));
      setAffectations(affRes.data);
      setSoignants(soiRes.data);
      setPostes(posRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://127.0.0.1:8000/api/affectations/', formData);
      setSuccess("Affectation créée avec succès !");
      fetchData(); // Refresh list
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.detail || 
                  "Erreur de contrainte : l'affectation est illégale ou viole une règle métier.";
      setError(msg);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      
      {/* Formulaire de Création */}
      <div className="glass-card">
        <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Nouvelle Affectation</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Les contraintes dures seront validées par le backend.</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Sélectionner un Poste</label>
            <select className="form-input" 
              value={formData.poste} 
              onChange={e => setFormData({...formData, poste: e.target.value})} 
              required>
              <option value="">-- Choisir --</option>
              {postes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.unite_nom} - {new Date(p.debut_prevu).toLocaleString()} ({p.type_garde_libelle})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sélectionner un Soignant</label>
            <select className="form-input" 
              value={formData.soignant} 
              onChange={e => setFormData({...formData, soignant: e.target.value})} 
              required>
              <option value="">-- Choisir --</option>
              {soignants.filter(s => s.is_actif).map(s => (
                <option key={s.id} value={s.id}>
                  {s.prenom} {s.nom} ({s.grade_libelle})
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
              <th style={{ padding: '0.75rem' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {affectations.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.875rem' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{a.soignant_prenom} {a.soignant_nom}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(a.poste_debut).toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(a.poste_fin).toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}><span className="badge">{a.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
