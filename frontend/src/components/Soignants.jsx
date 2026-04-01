import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Soignants() {
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/staff/');
      setStaffList(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', marginTop: 0 }}>Gestion du Staff</h2>
      <p style={{ color: 'var(--text-muted)' }}>Liste des professionnels de santé d'Al Amal.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Téléphone</th>
              <th style={{ padding: '1rem' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.email}</td>
                <td style={{ padding: '1rem' }}>{s.first_name} {s.last_name}</td>
                <td style={{ padding: '1rem' }}><span className="badge">{s.phone || 'N/A'}</span></td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: s.is_active ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
                    {s.is_active ? 'Actif' : 'Inactif'}
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
