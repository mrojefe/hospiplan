import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import StaffPage from './pages/StaffPage.jsx';
import ShiftsPage from './pages/ShiftsPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { auth } from './api/client.js';

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

// Composant pour protéger les routes
function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(auth.isAuthenticated());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification au montage
    setIsAuth(auth.isAuthenticated());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    auth.clearTokens();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route
          path="/login"
          element={
            isAuthenticated ?
              <Navigate to="/" replace /> :
              <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Routes protégées */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<DashboardHome />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/shifts" element={<ShiftsPage />} />
                  <Route path="/assignments" element={<AssignmentsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
