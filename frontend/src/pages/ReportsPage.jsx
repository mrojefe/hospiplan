import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import {
  Card,
  Alert,
  Button,
  LoadingSpinner,
  ProgressBar,
  Badge,
} from '../components/ui/index.jsx';
import {
  FileText,
  Download,
  Users,
  Clock,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeShifts: 0,
    totalAssignments: 0,
    assignmentsThisMonth: 0,
  });
  const [staffWorkload, setStaffWorkload] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [staffRes, shiftsRes, assignmentsRes] = await Promise.all([
        api.getStaff(),
        api.getShifts(),
        api.getAssignments(),
      ]);

      const staff = staffRes.data.results || staffRes.data;
      const shifts = shiftsRes.data.results || shiftsRes.data;
      const assignments = assignmentsRes.data.results || assignmentsRes.data;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalStaff: staff.length,
        activeShifts: shifts.filter(s => new Date(s.end_datetime) > now).length,
        totalAssignments: assignments.length,
        assignmentsThisMonth: assignments.filter(a => new Date(a.assigned_at) >= startOfMonth).length,
      });

      // Calculate workload per staff
      const workload = staff.map(s => {
        const staffAssignments = assignments.filter(a => a.staff === s.id);
        const hours = staffAssignments.reduce((sum, a) => {
          const start = new Date(a.shift_start);
          const end = new Date(a.shift_end);
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0);
        return {
          staff: s,
          assignments: staffAssignments.length,
          hours: Math.round(hours),
        };
      }).sort((a, b) => b.hours - a.hours);

      setStaffWorkload(workload.slice(0, 10));
    } catch (err) {
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Génération des rapports..." />;
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
            Rapports & Analyses
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Statistiques et indicateurs de performance
          </p>
        </div>
        <Button
          variant="secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={18} />
          Exporter PDF
        </Button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={28} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Personnel
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats.totalStaff}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={28} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Shifts Actifs
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats.activeShifts}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Briefcase size={28} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Affectations
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats.totalAssignments}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={28} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Ce Mois
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats.assignmentsThisMonth}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workload Report */}
      <Card title="Charge de travail par agent" description="Top 10 agents les plus actifs">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {staffWorkload.map((item, idx) => (
            <div key={item.staff.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{
                width: '28px',
                textAlign: 'center',
                fontWeight: 700,
                color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {idx + 1}
              </span>

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
                {item.staff.first_name?.[0]}{item.staff.last_name?.[0]}
              </div>

              <div style={{ flexGrow: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {item.staff.first_name} {item.staff.last_name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ProgressBar
                    value={item.hours}
                    max={160}
                    color={item.hours > 160 ? 'red' : item.hours > 140 ? 'orange' : 'blue'}
                    size="sm"
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {item.hours}h / 160h
                  </span>
                </div>
              </div>

              <Badge variant={item.assignments > 10 ? 'success' : 'default'}>
                {item.assignments} shifts
              </Badge>
            </div>
          ))}

          {staffWorkload.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              Aucune donnée de charge de travail disponible
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
