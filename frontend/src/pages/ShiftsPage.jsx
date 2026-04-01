import { useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { api } from '../../api/client.js';
import { Card, Table, Badge, Alert } from '../ui/index.jsx';

export default function ShiftsPage() {
  const { data: shifts, loading, error, execute } = useFetch(api.getShifts);

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <div className="loading-spinner">Chargement des gardes...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1>Postes de Garde (Shifts)</h1>
        <p className="subtitle">Visualisation des besoins et créneaux hospitaliers</p>
      </div>

      <Card>
        <Table headers={['Unité', 'Type de Garde', 'Date & Heure Début', 'Date & Heure Fin', 'Staff Requis']}>
          {shifts.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.care_unit_name}</td>
              <td><Badge variant="info">{p.shift_type_name}</Badge></td>
              <td className="text-muted">{new Date(p.start_datetime).toLocaleString()}</td>
              <td className="text-muted">{new Date(p.end_datetime).toLocaleString()}</td>
              <td className="text-center font-medium">
                {p.min_staff} {p.max_staff ? `à ${p.max_staff}` : 'minimum'}
              </td>
            </tr>
          ))}
           {shifts.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">Aucun shift programmé.</td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
