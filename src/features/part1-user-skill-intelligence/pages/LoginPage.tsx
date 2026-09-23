import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import '../part1.css';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('learner@skillup.io');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    try {
      await login(email, password);
      navigate(paths.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar__brand-mark">S</span> SkillUp
        </div>
        <div className="card">
          <div className="card__title">Welcome back</div>
          <div className="card__subtitle">Log in to continue your skill journey.</div>
          <form onSubmit={submit} className="mt-4">
            {error && (
              <div className="mb-4">
                <Alert variant="error">{error}</Alert>
              </div>
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button block loading={isLoading} type="submit">
              Log in
            </Button>
          </form>
          <p className="small muted mt-4" style={{ textAlign: 'center' }}>
            No account? <Link to={paths.register}>Create one</Link>
          </p>
          <p className="tiny mt-4" style={{ textAlign: 'center' }}>
            Demo mode: any email + password works (stored locally until backend is set).
          </p>
        </div>
      </div>
    </div>
  );
}
