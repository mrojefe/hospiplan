import { useState } from 'react';
import { api, auth } from '../api/client.js';
import { Card, Alert, Button } from '../ui/index.jsx';
import { LogIn } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation frontend
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.login(credentials);
      const { access, refresh } = response.data;
      
      auth.setTokens(access, refresh);
      onLogin();
    } catch (err) {
      const msg = err.response?.data?.detail || 
                  'Identifiants invalides ou serveur indisponible';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card title="HospiPlan - Connexion" style={{ width: '100%', maxWidth: '400px' }}>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Système de planification hospitalière sécurisé
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom d'utilisateur</label>
            <input
              type="text"
              className="form-input"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="admin"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="btn-w-full"
            disabled={isLoading}
          >
            <LogIn size={18} style={{ marginRight: '8px' }} />
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#888' }}>
          Par défaut: admin / admin (à changer en production)
        </p>
      </Card>
    </div>
  );
}
