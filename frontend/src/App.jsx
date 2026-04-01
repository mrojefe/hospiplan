import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Soignants from './components/Soignants';
import Postes from './components/Postes';
import Affectations from './components/Affectations';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="app-container">
          <Routes>
            <Route path="/" element={<Soignants />} />
            <Route path="/soignants" element={<Soignants />} />
            <Route path="/postes" element={<Postes />} />
            <Route path="/affectations" element={<Affectations />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
