import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, ProgressBar, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { adminOverview, currentUser, getNotifications } from '../services/part3-store';
import { AdminNote } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

const LINKS: { to: string; label: string; desc: string }[] = [
  { to: paths.adminSkills, label: 'Skills', desc: 'Catalog vs claimed' },
  { to: paths.adminAssessments, label: 'Assessments', desc: 'Bank + results' },
  { to: paths.adminChallenges, label: 'Challenges', desc: 'Submissions + pass rate' },
  { to: paths.adminVerification, label: 'Verification', desc: 'Credentials issued' },
  { to: paths.adminJobs, label: 'Jobs', desc: 'Manage opportunities' },
  { to: paths.adminAnalytics, label: 'Analytics', desc: 'Platform progress' },
];

export function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const stats = useMemo(() => adminOverview(uid), [uid]);
  const activity = useMemo(() => getNotifications(uid).slice(0, 5), [uid]);

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin Dashboard</h1>
        <AdminNote />
      </div>

      <div className="grid grid--4">
        <Card title={String(stats.claimed)} subtitle="Skills claimed" />
        <Card title={String(stats.assessmentsTaken)} subtitle="Assessments taken" />
        <Card title={`${stats.lessonsDone}/${stats.lessonsTotal}`} subtitle="Lessons done" />
        <Card title={`${stats.readiness}/100`} subtitle="Avg readiness">
          <div className="mt-4">
            <ProgressBar value={stats.readiness} label="" />
          </div>
        </Card>
      </div>
      <div className="grid grid--4 mt-4">
        <Card title={`${stats.passedChallenges}`} subtitle="Challenges passed" />
        <Card title={String(stats.verified)} subtitle="Skills verified" />
        <Card title={String(stats.opportunities)} subtitle="Opportunities live" />
        <Card title={String(stats.evaluations)} subtitle="Evaluations run" />
      </div>

      <div className="grid grid--2 mt-4">
        <Card title="Manage" subtitle="Admin modules">
          <div className="grid grid--2">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="card card--hover" style={{ padding: 12 }}>
                <strong className="small">{l.label}</strong>
                <div className="tiny muted">{l.desc}</div>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Recent activity" subtitle="Latest notifications">
          <Table
            columns={[
              { key: 'title', header: 'Event', render: (r) => <strong className="small">{r.title}</strong> },
              { key: 'date', header: 'When', render: (r) => formatDate(r.createdAt) },
            ]}
            rows={activity.map((a) => ({ ...a }))}
            emptyText="No activity yet."
          />
        </Card>
      </div>
    </div>
  );
}
