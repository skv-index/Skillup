import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge, Card, ProgressBar, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { currentUser } from '../services/part3-store';
import { CHALLENGES } from '@/features/part2-learning-challenges-verification/data/catalog';
import {
  getEvaluations,
  getSubmissions,
} from '@/features/part2-learning-challenges-verification/services/part2-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { AdminNote } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function AdminChallengesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const submissions = useMemo(() => [...getSubmissions(uid)].reverse(), [uid]);
  const evaluations = useMemo(() => [...getEvaluations(uid)].reverse(), [uid]);
  const passRate = evaluations.length
    ? Math.round((evaluations.filter((e) => e.passed).length / evaluations.length) * 100)
    : 0;

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin · Challenges</h1>
        <AdminNote />
      </div>

      <div className="grid grid--4">
        <Card title={String(CHALLENGES.length)} subtitle="Challenges live" />
        <Card title={String(submissions.length)} subtitle="Submissions" />
        <Card title={String(evaluations.length)} subtitle="Evaluations" />
        <Card title={`${passRate}%`} subtitle="Pass rate">
          <div className="mt-4">
            <ProgressBar value={passRate} label="" />
          </div>
        </Card>
      </div>

      <Card title="Challenge catalog" subtitle="Challenge module" className="mt-4">
        <Table
          columns={[
            { key: 'title', header: 'Challenge', render: (r) => <strong className="small">{r.title}</strong> },
            {
              key: 'skills',
              header: 'Skills',
              render: (r) => <span className="tiny">{r.skillIds.map((s: string) => skillById(s)?.name).join(' · ')}</span>,
            },
            { key: 'diff', header: 'Difficulty', render: (r) => <Badge>{r.difficulty}</Badge> },
            { key: 'pts', header: 'Points', render: (r) => <Badge variant="warning">{r.points}</Badge> },
          ]}
          rows={CHALLENGES.map((c) => ({ ...c }))}
        />
      </Card>

      <Card title="Latest evaluations" subtitle="Performance Evaluation module" className="mt-4">
        <Table
          columns={[
            { key: 'ch', header: 'Challenge', render: (r) => r.challengeId.replace('ch_', '').replace(/_/g, ' ') },
            { key: 'score', header: 'Score', render: (r) => <Badge variant={r.passed ? 'success' : 'warning'}>{r.score}</Badge> },
            { key: 'passed', header: 'Result', render: (r) => (r.passed ? 'passed ✓' : 'not passed') },
            { key: 'date', header: 'When', render: (r) => formatDate(r.evaluatedAt) },
          ]}
          rows={evaluations.slice(0, 10).map((e) => ({ ...e }))}
          emptyText="No evaluations yet."
        />
      </Card>
    </div>
  );
}
