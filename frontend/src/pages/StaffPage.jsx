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
  EmptyState,
  LoadingSpinner,
  Drawer,
} from '../components/ui/index.jsx';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  User,
  Eye,
  Edit2,
  X,
} from 'lucide-react';

export default function StaffPage() {
  const { data: staffList, loading, error, execute } = useFetch(api.getStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    execute();
  }, [execute]);

  const filteredStaff = staffList?.filter(staff => {
    const matchesSearch =
      staff.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && staff.is_active) ||
      (statusFilter === 'inactive' && !staff.is_active);
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) errors.last_name = 'Nom requis';
    if (!formData.email.trim()) errors.email = 'Email requis';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.createStaff(formData);
      setIsCreateModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', is_active: true });
      execute(); // Refresh list
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.detail || 'Erreur lors de la création' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setIsDrawerOpen(true);
  };

  const tableHeaders = [
    { label: 'Nom', sortable: true },
    { label: 'Email', sortable: true },
    { label: 'Téléphone', sortable: false },
    { label: 'Statut', sortable: true },
    { label: 'Actions', sortable: false },
  ];

  if (loading) {
    return <LoadingSpinner message="Chargement du personnel..." />;
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
            Gestion du Personnel
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {staffList?.length || 0} membres au total
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Nouveau membre
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
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <DataTable
        headers={tableHeaders}
        searchable={false}
        emptyMessage="Aucun membre du personnel trouvé"
      >
        {filteredStaff.map((staff) => (
          <tr key={staff.id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
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
                  }}
                >
                  {staff.first_name?.[0]}{staff.last_name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {staff.first_name} {staff.last_name}
                  </p>
                </div>
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-main)' }}>{staff.email}</span>
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>
                  {staff.phone || '—'}
                </span>
              </div>
            </td>
            <td>
              <Badge variant={staff.is_active ? 'success' : 'danger'}>
                {staff.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </td>
            <td>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleViewDetails(staff)}
                  style={{
                    padding: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                  title="Voir détails"
                >
                  <Eye size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau membre du personnel"
        size="md"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Input
              label="Prénom"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={formErrors.first_name}
              required
            />
            <Input
              label="Nom"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={formErrors.last_name}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
            style={{ marginBottom: '16px' }}
          />

          <Input
            label="Téléphone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ marginBottom: '20px' }}
          />

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

      {/* Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Détails du personnel"
        size="md"
      >
        {selectedStaff && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  margin: '0 auto 16px',
                }}
              >
                {selectedStaff.first_name?.[0]}{selectedStaff.last_name?.[0]}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
                {selectedStaff.first_name} {selectedStaff.last_name}
              </h3>
              <Badge variant={selectedStaff.is_active ? 'success' : 'danger'}>
                {selectedStaff.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--background)', borderRadius: '10px' }}>
                <Mail size={18} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</p>
                  <p style={{ fontWeight: 500 }}>{selectedStaff.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--background)', borderRadius: '10px' }}>
                <Phone size={18} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Téléphone</p>
                  <p style={{ fontWeight: 500 }}>{selectedStaff.phone || 'Non renseigné'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--background)', borderRadius: '10px' }}>
                <User size={18} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rôles</p>
                  <p style={{ fontWeight: 500 }}>
                    {selectedStaff.roles?.map(r => r.name).join(', ') || 'Aucun rôle'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

