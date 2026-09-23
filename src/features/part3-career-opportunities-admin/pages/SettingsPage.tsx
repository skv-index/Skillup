import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  currentUser,
  getNotifPrefs,
  getNotifications,
  markAllRead,
  saveNotifPrefs,
  unreadCount,
} from '../services/part3-store';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [prefs, setPrefs] = useState(() => getNotifPrefs());
  const [msg, setMsg] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const notifications = getNotifications(uid);
  const unread = unreadCount(uid);

  const saveAccount = () => {
    if (!email.includes('@')) {
      setMsg('Enter a valid email.');
      return;
    }
    setUser({ ...user, name: name.trim() || user.name, email: email.trim() });
    setMsg(`Account saved · ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setMsg(''), 2500);
  };

  const wipe = () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith('skillup.'))
      .forEach((k) => localStorage.removeItem(k));
    logout();
    navigate(paths.register);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Settings</h1>
        <p>Authentication · User Profile · Notifications</p>
      </div>

      <div className="grid grid--2">
        <div>
          <Card title="Account" subtitle="Stored locally until backend lands">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="row">
              <Button size="sm" onClick={saveAccount}>
                Save account
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate(paths.login);
                }}
              >
                Log out
              </Button>
            </div>
            {msg && <p className="tiny muted mt-4">{msg}</p>}
          </Card>

          <Card title="Danger zone" subtitle="Local demo data" className="mt-4">
            <Button size="sm" variant="danger" onClick={wipe}>
              {confirmWipe ? 'Click again to erase everything' : 'Erase local data'}
            </Button>
          </Card>
        </div>

        <div>
          <Card
            title="Notifications"
            subtitle={`${unread} unread`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => { markAllRead(uid); window.location.reload(); }}>
                Mark all read
              </Button>
            }
          >
            <label className="row small" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.emailNotifs}
                onChange={(e) => {
                  const next = { ...prefs, emailNotifs: e.target.checked };
                  setPrefs(next);
                  saveNotifPrefs(next, uid);
                }}
              />
              Email notifications
            </label>
            <label className="row small mt-4" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.weeklyDigest}
                onChange={(e) => {
                  const next = { ...prefs, weeklyDigest: e.target.checked };
                  setPrefs(next);
                  saveNotifPrefs(next, uid);
                }}
              />
              Weekly digest
            </label>
            <div className="stack-4 mt-4">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="card" style={{ padding: 10 }}>
                  <div className="row row--between">
                    <strong className="small">{n.title}</strong>
                    {!n.read && <Badge variant="primary">new</Badge>}
                  </div>
                  <p className="tiny muted">
                    {n.body} · {formatDate(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Theme" subtitle="Foundation design system" className="mt-4">
            <div className="row">
              {(['light', 'dark'] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light';
                  }}
                >
                  {t}
                </Button>
              ))}
            </div>
          </Card>

          {user.role !== 'admin' && (
            <div className="mt-4">
              <Alert variant="info">
                Admin pages live under <strong>/admin</strong> (demo: open to everyone until backend roles land).
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
