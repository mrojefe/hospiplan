import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Card, StatsCard, LoadingSpinner, Alert } from '../components/ui/index.jsx';
import {
  Users,
  CalendarDays,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  Building2
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeShifts: 0,
    assignmentsToday: 0,
    alerts: 0,
    occupancyRate: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all necessary data in parallel
      const [staffRes, shiftsRes, assignmentsRes] = await Promise.all([
        api.getStaff(),
        api.getShifts(),
        api.getAssignments(),
      ]);

      const staff = staffRes.data.results || staffRes.data;
      const shifts = shiftsRes.data.results || shiftsRes.data;
      const assignments = assignmentsRes.data.results || assignmentsRes.data;

      // Calculate stats
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const activeShifts = shifts.filter(s => {
        const start = new Date(s.start_datetime);
        const end = new Date(s.end_datetime);
        return start <= now && end >= now;
      });

      const todayAssignments = assignments.filter(a => {
        const shiftStart = new Date(a.shift_start);
        return shiftStart.toISOString().split('T')[0] === today;
      });

      // Calculate occupancy rate
      const totalCapacity = shifts.reduce((sum, s) => sum + (s.max_staff || s.min_staff || 1), 0);
      const totalAssigned = assignments.length;
      const occupancyRate = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

      setStats({
        totalStaff: staff.filter(s => s.is_active).length,
        totalStaffInactive: staff.filter(s => !s.is_active).length,
        activeShifts: activeShifts.length,
        assignmentsToday: todayAssignments.length,
        occupancyRate,
        totalAssignments: assignments.length,
      });

      // Get recent assignments (last 5)
      setRecentAssignments(assignments.slice(0, 5));

      // Generate alerts
      const generatedAlerts = [];
      activeShifts.forEach(shift => {
        const shiftAssignments = assignments.filter(a => a.shift === shift.id);
        if (shiftAssignments.length < (shift.min_staff || 1)) {
          generatedAlerts.push({
            type: 'warning',
            message: `Sous-effectif: ${shift.care_unit_name || 'Unité'} - ${shiftAssignments.length}/${shift.min_staff || 1} agents`,
          });
        }
      });
      setAlerts(generatedAlerts.slice(0, 5));

    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du dashboard..." />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="page-animate">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>
        Tableau de bord
      </h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Personnel actif"
          value={stats.totalStaff}
          icon={Users}
          color="blue"
          trend={`${stats.totalStaffInactive} inactifs`}
          trendUp={stats.totalStaff > 0}
        />
        <StatsCard
          title="Shifts en cours"
          value={stats.activeShifts}
          icon={Clock}
          color="green"
        />
        <StatsCard
          title="Affectations aujourd'hui"
          value={stats.assignmentsToday}
          icon={Briefcase}
          color="purple"
        />
        <StatsCard
          title="Taux d'occupation"
          value={`${stats.occupancyRate}%`}
          icon={Activity}
          color={stats.occupancyRate > 80 ? 'orange' : 'blue'}
          trend={stats.occupancyRate > 80 ? 'Saturé' : 'Normal'}
          trendUp={stats.occupancyRate <= 80}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Assignments */}
        <Card
          title="Affectations récentes"
          description="Dernières affectations créées"
        >
          {recentAssignments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentAssignments.map((assignment, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--background)',
                    borderRadius: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {assignment.staff_first_name?.[0]}{assignment.staff_last_name?.[0]}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {assignment.staff_first_name} {assignment.staff_last_name}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(assignment.shift_start).toLocaleDateString('fr-FR')} •
                      {new Date(assignment.shift_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Actif
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              Aucune affectation récente
            </p>
          )}
        </Card>

        {/* Alerts */}
        <Card
          title="Alertes"
          description="Notifications importantes"
          actions={
            alerts.length > 0 && (
              <span style={{
                padding: '4px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}>
                {alerts.length} alertes
              </span>
            )
          }
        >
          {alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: alert.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '10px',
                    borderLeft: `4px solid ${alert.type === 'warning' ? '#f59e0b' : '#ef4444'}`,
                  }}
                >
                  <AlertTriangle
                    size={20}
                    color={alert.type === 'warning' ? '#f59e0b' : '#ef4444'}
                  />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <TrendingUp size={28} color="#10b981" />
              </div>
              <p style={{ color: 'var(--text-muted)' }}>
                Aucune alerte - Tout va bien !
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Actions rapides" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            to="/assignments"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <Briefcase size={20} />
            Nouvelle affectation
          </Link>
          <Link
            to="/shifts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: 'var(--surface)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 500,
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <CalendarDays size={20} />
            Voir le planning
          </Link>
          <Link
            to="/staff"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: 'var(--surface)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 500,
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <Building2 size={20} />
            Gérer le personnel
          </Link>
        </div>
      </Card>
    </div>
  );
}
