import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../api/client.js';
import {
  Card,
  DataTable,
  Badge,
  Alert,
  Button,
  Select,
  ProgressBar,
  LoadingSpinner,
} from '../components/ui/index.jsx';
import {
  UserPlus,
  CalendarDays,
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AssignmentsPage() {
  const { data: assignments, loading: loadingAssignments, execute: fetchAssignments } = useFetch(api.getAssignments);
  const { data: staffList, loading: loadingStaff, execute: fetchStaff } = useFetch(api.getStaff);
  const { data: shifts, loading: loadingShifts, execute: fetchShifts } = useFetch(api.getShifts);

  const [formData, setFormData] = useState({ shift: '', staff: '' });
  const [submitState, setSubmitState] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchStaff();
    fetchShifts();
  }, [fetchAssignments, fetchStaff, fetchShifts]);

  // Get selected shift and staff details
  const selectedShift = shifts?.find(s => s.id === parseInt(formData.shift));
  const selectedStaff = staffList?.find(s => s.id === parseInt(formData.staff));

  // Get occupancy for selected shift
  const getShiftOccupancy = (shiftId) => {
    if (!assignments || !shiftId) return { current: 0, required: 0, percentage: 0 };
    const shift = shifts?.find(s => s.id === shiftId);
    const shiftAssignments = assignments.filter(a => a.shift === shiftId);
    const required = shift?.min_staff || 1;
    return {
      current: shiftAssignments.length,
      required,
      percentage: Math.min(100, Math.round((shiftAssignments.length / required) * 100)),
    };
  };

  const occupancy = getShiftOccupancy(selectedShift?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ type: null, message: '' });

    if (!formData.shift) {
      setSubmitState({ type: 'error', message: 'Veuillez sélectionner un poste (shift)' });
      return;
    }
    if (!formData.staff) {
      setSubmitState({ type: 'error', message: 'Veuillez sélectionner un agent de santé' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.createAssignment(formData);
      setSubmitState({ type: 'success', message: 'Affectation créée avec succès !' });
      setFormData({ shift: '', staff: '' });
      fetchAssignments();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      let msg;
      if (status === 409) {
        msg = data?.detail || 'Conflit : Ce créneau vient d\'être assigné à quelqu\'un d\'autre.';
      } else if (status === 400 && data?.non_field_errors) {
        msg = data.non_field_errors[0];
      } else if (status === 401) {
        msg = 'Session expirée. Veuillez vous reconnecter.';
      } else if (status === 403) {
        msg = 'Accès refusé.';
      } else {
        msg = data?.detail || "Violation d'une contrainte métier (Heures, Repos, Compétences).";
      }

      setSubmitState({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableHeaders = [
    { label: 'Agent', sortable: true },
    { label: 'Shift', sortable: true },
    { label: 'Période', sortable: true },
    { label: 'Statut', sortable: false },
  ];

  if (loadingAssignments || loadingStaff || loadingShifts) {
    return <LoadingSpinner message="Chargement des données..." />;
  }

  const shiftOptions = shifts?.map(s => ({
    value: s.id.toString(),
    label: `${s.care_unit_name} - ${new Date(s.start_datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} (${new Date(s.start_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`,
  })) || [];

  const staffOptions = staffList
    ?.filter(s => s.is_active)
    .map(s => ({
      value: s.id.toString(),
      label: `${s.first_name} ${s.last_name} - ${s.email}`,
    })) || [];

  return (
    <div className="page-animate">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          Affectations & Planification
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Moteur intelligent de gestion des contraintes médicales
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Colonne de Création */}
        <div>
          <Card title="Nouvelle affectation" description="Sélectionnez un shift et un agent">
            {submitState.message && (
              <Alert variant={submitState.type} style={{ marginBottom: '20px' }}>
                {submitState.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Select
                label="Shift disponible"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                options={shiftOptions}
                placeholder="Choisir un shift..."
                required
                icon={CalendarDays}
              />

              <Select
                label="Agent de santé"
                value={formData.staff}
                onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                options={staffOptions}
                placeholder="Choisir un agent..."
                required
                icon={Users}
              />

              {/* Preview du shift sélectionné */}
              {selectedShift && (
                <div style={{
                  padding: '16px',
                  background: 'var(--background)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Briefcase size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Shift sélectionné</span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {selectedShift.care_unit_name} • {selectedShift.shift_type_name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(selectedShift.start_datetime).toLocaleString('fr-FR')} -
                      {new Date(selectedShift.end_datetime).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                  <ProgressBar
                    value={occupancy.current}
                    max={occupancy.required}
                    color={occupancy.percentage >= 100 ? 'green' : occupancy.percentage >= 50 ? 'blue' : 'orange'}
                    size="sm"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {occupancy.current} / {occupancy.required} agents assignés
                  </p>
                </div>
              )}

              {/* Preview de l'agent sélectionné */}
              {selectedStaff && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                    }}>
                      {selectedStaff.first_name?.[0]}{selectedStaff.last_name?.[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {selectedStaff.first_name} {selectedStaff.last_name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedStaff.email}
                      </p>
                    </div>
                    <CheckCircle2 size={20} color="#10b981" style={{ marginLeft: 'auto' }} />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
              >
                <UserPlus size={18} />
                {isSubmitting ? 'Validation...' : 'Valider l\'affectation'}
              </Button>
            </form>
          </Card>

          {/* Info box */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color="#2563eb" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2563eb' }}>
                Contraintes validées automatiquement
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Le système vérifie: heures max, repos obligatoire, certifications, congés, et seuil de sécurité.
            </p>
          </div>
        </div>

        {/* Colonne de Visualisation */}
        <div>
          <DataTable
            headers={tableHeaders}
            searchable={false}
            emptyMessage="Aucune affectation trouvée"
          >
            {assignments?.map((a) => (
              <tr key={a.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}>
                      {a.staff_first_name?.[0]}{a.staff_last_name?.[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {a.staff_first_name} {a.staff_last_name}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.9rem' }}>
                      {shifts?.find(s => s.id === a.shift)?.care_unit_name || 'Unité'}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {new Date(a.shift_start).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(a.shift_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(a.shift_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant="success">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} />
                      {new Date(a.assigned_at).toLocaleDateString('fr-FR')}
                    </div>
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </div>
  );
}

