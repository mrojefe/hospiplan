import { useEffect, useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../api/client.js';
import {
  Card,
  DataTable,
  Badge,
  Alert,
  Button,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ProgressBar,
} from '../components/ui/index.jsx';
import {
  CalendarDays,
  Plus,
  Search,
  Clock,
  Users,
  Building2,
} from 'lucide-react';

export default function ShiftsPage() {
  const { data: shifts, loading, error, execute } = useFetch(api.getShifts);
  const { data: assignments, execute: fetchAssignments } = useFetch(api.getAssignments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    care_unit: '',
    shift_type: '',
    start_datetime: '',
    end_datetime: '',
    min_staff: 1,
    max_staff: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    execute();
    fetchAssignments();
  }, [execute, fetchAssignments]);

  const filteredShifts = shifts?.filter(shift => {
    const matchesSearch =
      shift.care_unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.shift_type_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const start = new Date(shift.start_datetime);
    const end = new Date(shift.end_datetime);

    const isActive = start <= now && end >= now;
    const isFuture = start > now;
    const isPast = end < now;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'future' && isFuture) ||
      (statusFilter === 'past' && isPast);

    return matchesSearch && matchesStatus;
  }) || [];

  const getShiftStatus = (shift) => {
    const now = new Date();
    const start = new Date(shift.start_datetime);
    const end = new Date(shift.end_datetime);

    if (start <= now && end >= now) return { label: 'En cours', variant: 'success' };
    if (start > now) return { label: 'À venir', variant: 'info' };
    return { label: 'Terminé', variant: 'default' };
  };

  const getShiftOccupancy = (shift) => {
    if (!assignments) return { current: 0, required: shift.min_staff || 1, percentage: 0 };
    const shiftAssignments = assignments.filter(a => a.shift === shift.id);
    const required = shift.min_staff || 1;
    return {
      current: shiftAssignments.length,
      required,
      percentage: Math.min(100, Math.round((shiftAssignments.length / required) * 100)),
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.care_unit) errors.care_unit = 'Unité requise';
    if (!formData.shift_type) errors.shift_type = 'Type de shift requis';
    if (!formData.start_datetime) errors.start_datetime = 'Date de début requise';
    if (!formData.end_datetime) errors.end_datetime = 'Date de fin requise';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.createShift(formData);
      setIsCreateModalOpen(false);
      setFormData({
        care_unit: '',
        shift_type: '',
        start_datetime: '',
        end_datetime: '',
        min_staff: 1,
        max_staff: '',
      });
      execute();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.detail || 'Erreur lors de la création' });
    } finally {
      setSubmitting(false);
    }
  };

  const tableHeaders = [
    { label: 'Unité', sortable: true },
    { label: 'Type', sortable: true },
    { label: 'Début', sortable: true },
    { label: 'Fin', sortable: true },
    { label: 'Remplissage', sortable: false },
    { label: 'Statut', sortable: true },
  ];

  if (loading) {
    return <LoadingSpinner message="Chargement des shifts..." />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="page-animate">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
            Planning des Shifts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {shifts?.length || 0} shifts programmés
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Nouveau shift
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '300px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'active', label: 'En cours' },
              { value: 'future', label: 'À venir' },
              { value: 'past', label: 'Terminés' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <DataTable
        headers={tableHeaders}
        searchable={false}
        emptyMessage="Aucun shift trouvé"
      >
        {filteredShifts.map((shift) => {
          const status = getShiftStatus(shift);
          const occupancy = getShiftOccupancy(shift);

          return (
            <tr key={shift.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 500 }}>{shift.care_unit_name}</span>
                </div>
              </td>
              <td>
                <Badge variant="info">{shift.shift_type_name}</Badge>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem' }}>
                    {new Date(shift.start_datetime).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(shift.end_datetime).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </td>
              <td>
                <div style={{ width: '150px' }}>
                  <ProgressBar
                    value={occupancy.current}
                    max={occupancy.required}
                    color={occupancy.percentage >= 100 ? 'green' : occupancy.percentage >= 50 ? 'blue' : 'orange'}
                    size="sm"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {occupancy.current} / {occupancy.required} agents
                  </span>
                </div>
              </td>
              <td>
                <Badge variant={status.variant}>{status.label}</Badge>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau shift"
        size="md"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Select
              label="Unité de soins"
              value={formData.care_unit}
              onChange={(e) => setFormData({ ...formData, care_unit: e.target.value })}
              options={[
                { value: '1', label: 'Urgences' },
                { value: '2', label: 'Cardiologie' },
                { value: '3', label: 'Pédiatrie' },
                { value: '4', label: 'Chirurgie' },
              ]}
              error={formErrors.care_unit}
              required
            />
            <Select
              label="Type de shift"
              value={formData.shift_type}
              onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
              options={[
                { value: '1', label: 'Jour' },
                { value: '2', label: 'Nuit' },
                { value: '3', label: 'Week-end' },
                { value: '4', label: 'Garde' },
              ]}
              error={formErrors.shift_type}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Input
              label="Date & Heure début"
              type="datetime-local"
              value={formData.start_datetime}
              onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
              error={formErrors.start_datetime}
              required
            />
            <Input
              label="Date & Heure fin"
              type="datetime-local"
              value={formData.end_datetime}
              onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
              error={formErrors.end_datetime}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Input
              label="Staff minimum"
              type="number"
              min="1"
              value={formData.min_staff}
              onChange={(e) => setFormData({ ...formData, min_staff: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Staff maximum (optionnel)"
              type="number"
              min="1"
              value={formData.max_staff}
              onChange={(e) => setFormData({ ...formData, max_staff: e.target.value ? parseInt(e.target.value) : '' })}
            />
          </div>

          {formErrors.submit && (
            <Alert variant="error" style={{ marginBottom: '16px' }}>
              {formErrors.submit}
            </Alert>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

