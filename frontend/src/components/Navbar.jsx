import { Link, useLocation } from 'react-router-dom';
import { Activity, Users, Calendar, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <Activity size={28} />
          <span>HOSPIPLAN</span>
        </Link>
        <div className="nav-links">
          <Link to="/soignants" className={`nav-link ${location.pathname === '/soignants' ? 'active' : ''}`}>
            <Users size={20} />
            <span>Soignants</span>
          </Link>
          <Link to="/postes" className={`nav-link ${location.pathname === '/postes' ? 'active' : ''}`}>
            <ClipboardList size={20} />
            <span>Postes</span>
          </Link>
          <Link to="/affectations" className={`nav-link ${location.pathname === '/affectations' ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Affectations</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
