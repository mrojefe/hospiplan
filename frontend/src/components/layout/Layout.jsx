import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, CalendarDays, Users, LayoutDashboard, LogOut, Briefcase, ChevronRight, FileText } from 'lucide-react';

export default function Layout({ children, onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/staff', icon: Users, label: 'Personnel' },
    { path: '/shifts', icon: CalendarDays, label: 'Planning' },
    { path: '/assignments', icon: Briefcase, label: 'Affectations' },
    { path: '/reports', icon: FileText, label: 'Rapports' },
  ];

  return (
    <div className="layout-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <Stethoscope size={28} />
          </div>
          <div className="brand-text">
            <h1>HospiPlan</h1>
            <span>Al Amal Hospital</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <Icon size={20} />
                </div>
                <span className="nav-label">{item.label}</span>
                {isActive && <ChevronRight size={16} className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={onLogout}
            className="logout-btn"
            type="button"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
          <p className="copyright">© 2026 Al Amal</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2>Administration Centralisée</h2>
            <span className="breadcrumb">Système de planification hospitalière</span>
          </div>
          <div className="topbar-right">
            <div className="user-info">
              <span className="user-role">Administrateur</span>
              <div className="avatar">A</div>
            </div>
          </div>
        </header>
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
}
