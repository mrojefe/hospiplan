import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Soignants() {
  const [soignants, setSoignants] = useState([]);

  useEffect(() => {
    fetchSoignants();
  }, []);

  const fetchSoignants = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/soignants/');
      setSoignants(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', marginTop: 0 }}>Gestion des Soignants</h2>
      <p style={{ color: 'var(--text-muted)' }}>Liste des professionnels de santé d'Al Amal.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Matricule</th>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Grade</th>
              <th style={{ padding: '1rem' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {soignants.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.matricule}</td>
                <td style={{ padding: '1rem' }}>{s.prenom} {s.nom}</td>
                <td style={{ padding: '1rem' }}><span className="badge">{s.grade_libelle || 'N/A'}</span></td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: s.is_actif ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
                    {s.is_actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
