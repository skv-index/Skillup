import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main">
        <Header onMenu={() => setNavOpen((v) => !v)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
