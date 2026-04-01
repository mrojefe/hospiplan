import { useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { api } from '../../api/client.js';
import { Card, Table, Badge, Alert } from '../ui/index.jsx';

export default function StaffPage() {
  const { data: staffList, loading, error, execute } = useFetch(api.getStaff);

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <div className="loading-spinner">Chargement des soignants...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1>Gestion du Staff Médical</h1>
        <p className="subtitle">Annuaire professionnel des équipes d'Al Amal</p>
      </div>

      <Card>
        <Table headers={['Email', 'Nom complet', 'Téléphone', 'Statut']}>
          {staffList.map((s) => (
            <tr key={s.id}>
              <td className="font-medium text-slate-800">{s.email}</td>
              <td>{s.first_name} {s.last_name}</td>
              <td className="text-muted">{s.phone || 'Non renseigné'}</td>
              <td>
                <Badge variant={s.is_active ? 'success' : 'danger'}>
                  {s.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </td>
            </tr>
          ))}
          {staffList.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center">Aucun membre du staff trouvé.</td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
