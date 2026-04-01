import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, CalendarDays, Users, LayoutDashboard } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link';

  return (
    <div className="layout-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Stethoscope className="brand-icon" />
          <h1>HospiPlan</h1>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={isActive('/')}><LayoutDashboard size={20}/> <span>Dashboard</span></Link>
          <Link to="/staff" className={isActive('/staff')}><Users size={20}/> <span>Staff</span></Link>
          <Link to="/shifts" className={isActive('/shifts')}><CalendarDays size={20}/> <span>Shifts</span></Link>
          <Link to="/assignments" className={isActive('/assignments')}><CalendarDays size={20}/> <span>Affectations</span></Link>
        </nav>
        <div className="sidebar-footer">
          <p>© 2026 Al Amal</p>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="topbar">
          <h2>Administration Centralisée</h2>
          <div className="avatar">Admin</div>
        </header>
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
}
