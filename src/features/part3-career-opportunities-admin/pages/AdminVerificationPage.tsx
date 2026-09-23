import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { currentUser } from '../services/part3-store';
import {
  getEvaluations,
  getVerified,
} from '@/features/part2-learning-challenges-verification/services/part2-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { AdminNote } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function AdminVerificationPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const verified = useMemo(() => getVerified(uid), [uid]);
  const evaluations = useMemo(() => [...getEvaluations(uid)].reverse(), [uid]);
  const verifiedEvalIds = new Set(verified.map((v) => v.evaluationId));
  const unlinkedPassed = evaluations.filter((e) => e.passed && !verifiedEvalIds.has(e.id));

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin · Verification</h1>
        <AdminNote />
      </div>

      <div className="grid grid--3">
        <Card title={String(verified.length)} subtitle="Credentials issued" />
        <Card title={String(evaluations.filter((e) => e.passed).length)} subtitle="Passed evaluations" />
        <Card title={String(unlinkedPassed.length)} subtitle="Passed, awaiting linkage" />
      </div>

      <Card title="Issued credentials" subtitle="Skill Verification module" className="mt-4">
        <Table
          columns={[
            { key: 'skill', header: 'Skill', render: (r) => <strong className="small">{skillById(r.skillId)?.name ?? r.skillId}</strong> },
            { key: 'level', header: 'Level', render: (r) => <LevelBadge level={r.level} /> },
            { key: 'date', header: 'Verified', render: (r) => formatDate(r.verifiedAt) },
            {
              key: 'open',
              header: '',
              render: (r) => (
                <Link className="btn btn--ghost btn--sm" to={`/verified/${r.id}`}>
                  Open
                </Link>
              ),
            },
          ]}
          rows={verified.map((v) => ({ ...v }))}
          emptyText="No credentials issued yet."
        />
      </Card>

      {unlinkedPassed.length > 0 && (
        <Card title="Needs attention" subtitle="Passed evaluations without a linked credential" className="mt-4">
          <Table
            columns={[
              { key: 'ch', header: 'Challenge', render: (r) => r.challengeId },
              { key: 'score', header: 'Score', render: (r) => <Badge variant="success">{r.score}</Badge> },
              { key: 'date', header: 'When', render: (r) => formatDate(r.evaluatedAt) },
            ]}
            rows={unlinkedPassed.map((e) => ({ ...e }))}
          />
        </Card>
      )}
    </div>
  );
}
