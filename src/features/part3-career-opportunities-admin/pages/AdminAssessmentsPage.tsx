import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge, Card, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { currentUser } from '../services/part3-store';
import { ASSESSMENTS, skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { getResults } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { AdminNote } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function AdminAssessmentsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const results = useMemo(() => [...getResults(uid)].reverse(), [uid]);
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin · Assessments</h1>
        <AdminNote />
      </div>

      <div className="grid grid--3">
        <Card title={String(ASSESSMENTS.length)} subtitle="Assessments in bank" />
        <Card title={String(results.length)} subtitle="Completions" />
        <Card title={`${avg}/100`} subtitle="Average score" />
      </div>

      <Card title="Assessment bank" subtitle="AI Skill Assessment module" className="mt-4">
        <Table
          columns={[
            { key: 'title', header: 'Assessment', render: (r) => <strong className="small">{r.title}</strong> },
            { key: 'skill', header: 'Skill', render: (r) => skillById(r.skillId)?.name ?? r.skillId },
            { key: 'q', header: 'Questions', render: (r) => String(r.questionCount) },
            { key: 'dur', header: 'Minutes', render: (r) => String(r.durationMinutes) },
          ]}
          rows={ASSESSMENTS.map((a) => ({ ...a }))}
        />
      </Card>

      <Card title="Recent completions" subtitle="AssessmentResults" className="mt-4">
        <Table
          columns={[
            { key: 'skill', header: 'Skill', render: (r) => skillById(r.skillId)?.name ?? r.skillId },
            { key: 'score', header: 'Score', render: (r) => <Badge variant="success">{r.score}</Badge> },
            { key: 'level', header: 'Level', render: (r) => <LevelBadge level={r.level} /> },
            { key: 'date', header: 'When', render: (r) => formatDate(r.completedAt) },
          ]}
          rows={results.map((r) => ({ ...r }))}
          emptyText="No completions yet."
        />
      </Card>
    </div>
  );
}
