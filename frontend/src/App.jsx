import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import StaffPage from './pages/StaffPage';
import ShiftsPage from './pages/ShiftsPage';
import AssignmentsPage from './pages/AssignmentsPage';

function DashboardHome() {
  return (
    <div className="page-animate">
      <div className="page-header">
        <h1>Bienvenue sur HospiPlan</h1>
        <p className="subtitle">Tableau de bord de l'administration hospitalière</p>
      </div>
      <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Sélectionnez une option dans le menu de gauche.
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
