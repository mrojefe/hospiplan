import { useState } from 'react';
import { api, auth } from '../api/client.js';
import { Card, Alert, Button } from '../components/ui/index.jsx';
import { LogIn, Stethoscope, Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

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
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
        <div className="login-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Stethoscope size={32} />
            </div>
            <h1>HospiPlan</h1>
            <p>Système de planification hospitalière</p>
          </div>

          {error && (
            <div className="login-alert">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="username">Nom d'utilisateur</label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="admin"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="btn-w-full login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn size={18} style={{ marginRight: '8px' }} />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          <div className="login-footer">
            <p> 2026 Al Amal Hospital</p>
            <span className="login-hint">admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
