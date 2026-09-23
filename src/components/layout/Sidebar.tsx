import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from '@/components/ui';
import { paths } from '@/app/paths';

interface NavItem {
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactElement;
  end?: boolean;
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Part 1 — Profile & Skills',
    items: [
      { to: paths.dashboard, label: 'Dashboard', icon: Icons.dashboard, end: true },
      { to: paths.mySkills, label: 'My Skills', icon: Icons.skills },
      { to: paths.skillGraph, label: 'Skill Graph', icon: Icons.graph },
      { to: paths.skillGap, label: 'Skill Gap', icon: Icons.gap },
    ],
  },
  {
    title: 'Part 2 — Learn & Prove',
    items: [
      { to: paths.learning, label: 'Learning', icon: Icons.learn },
      { to: paths.challenges, label: 'Challenges', icon: Icons.challenge },
      { to: paths.verifiedSkills, label: 'Verified Skills', icon: Icons.verified },
    ],
  },
  {
    title: 'Part 3 — Career',
    items: [
      { to: paths.career, label: 'Career Readiness', icon: Icons.career },
      { to: paths.jobs, label: 'Jobs & Internships', icon: Icons.jobs },
      { to: paths.profile, label: 'Profile', icon: Icons.profile },
    ],
  },
  {
    title: 'System',
    items: [
      { to: paths.settings, label: 'Settings', icon: Icons.settings },
      { to: paths.admin, label: 'Admin', icon: Icons.admin },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Primary">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">S</span>
        <span>SkillUp</span>
      </div>

      {groups.map((g) => (
        <div key={g.title}>
          <div className="sidebar__section">{g.title}</div>
          {g.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sidebar__footer tiny">Common Foundation · v0.1.0</div>
    </aside>
  );
}
