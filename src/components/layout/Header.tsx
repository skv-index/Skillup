import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Icons } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { initials } from '@/lib/utils';
import { paths } from '@/app/paths';

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setDark(!dark);
  };

  return (
    <header className="header">
      <button
        className="btn btn--ghost btn--icon-only header__menu-btn"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Icons.menu size={20} />
      </button>

      <div className="header__search">
        <input className="input" placeholder="Search skills, challenges, jobs…" aria-label="Search" />
      </div>

      <div className="header__actions">
        <button className="btn btn--ghost btn--icon-only" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? '☀️' : '🌙'}
        </button>
        <button
          className="btn btn--ghost btn--icon-only"
          aria-label="Notifications"
          onClick={() => navigate(paths.dashboard)}
        >
          <Icons.bell size={20} />
        </button>
        <Dropdown
          trigger={
            <button className="avatar" aria-label="Account menu">
              {user ? initials(user.name) : '?'}
            </button>
          }
          items={[
            { key: 'profile', label: 'View profile', onClick: () => navigate(paths.profile) },
            { key: 'settings', label: 'Settings', onClick: () => navigate(paths.settings) },
            { key: 'logout', label: 'Log out', onClick: () => { logout(); navigate(paths.login); } },
          ]}
        />
      </div>
    </header>
  );
}
