import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import '../part1.css';

export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
      navigate(paths.onboarding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar__brand-mark">S</span> SkillUp
        </div>
        <div className="card">
          <div className="card__title">Create your account</div>
          <div className="card__subtitle">Claim skills → get assessed → close gaps.</div>
          <form onSubmit={submit} className="mt-4">
            {error && (
              <div className="mb-4">
                <Alert variant="error">{error}</Alert>
              </div>
            )}
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label="Password"
              type="password"
              hint="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button block loading={isLoading} type="submit">
              Create account
            </Button>
          </form>
          <p className="small muted mt-4" style={{ textAlign: 'center' }}>
            Have an account? <Link to={paths.login}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
