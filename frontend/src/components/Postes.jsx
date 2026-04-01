import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Postes() {
  const [postes, setPostes] = useState([]);

  useEffect(() => {
    fetchPostes();
  }, []);

  const fetchPostes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/postes/');
      setPostes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', marginTop: 0 }}>Postes de Gardes</h2>
      <p style={{ color: 'var(--text-muted)' }}>Créneaux prévus nécessitant du personnel soignant.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Unité</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Début</th>
              <th style={{ padding: '1rem' }}>Fin</th>
              <th style={{ padding: '1rem' }}>Soignants (Min-Max)</th>
            </tr>
          </thead>
          <tbody>
            {postes.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.unite_nom}</td>
                <td style={{ padding: '1rem' }}><span className="badge">{p.type_garde_libelle}</span></td>
                <td style={{ padding: '1rem' }}>{new Date(p.debut_prevu).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>{new Date(p.fin_prevue).toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{p.nb_soignants_min} - {p.nb_soignants_max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
