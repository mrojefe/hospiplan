import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Postes() {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/shifts/');
      setShifts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', marginTop: 0 }}>Postes de Gardes (Shifts)</h2>
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
            {shifts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.care_unit_name}</td>
                <td style={{ padding: '1rem' }}><span className="badge">{p.shift_type_name}</span></td>
                <td style={{ padding: '1rem' }}>{new Date(p.start_datetime).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>{new Date(p.end_datetime).toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{p.min_staff} - {p.max_staff || '?'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
