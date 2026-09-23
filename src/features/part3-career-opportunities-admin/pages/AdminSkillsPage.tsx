import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge, Card, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { currentUser } from '../services/part3-store';
import { SKILLS_CATALOG } from '@/features/part1-user-skill-intelligence/data/catalog';
import {
  buildGraph,
  getClaimed,
  latestResultForSkill,
} from '@/features/part1-user-skill-intelligence/services/part1-store';
import { verifiedForSkill } from '@/features/part2-learning-challenges-verification/services/part2-store';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { AdminNote } from '../components/Part3Widgets';
import '../part3.css';

export function AdminSkillsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const claimed = useMemo(() => new Map(getClaimed(uid).map((c) => [c.skillId, c])), [uid]);
  const graph = useMemo(() => buildGraph(uid), [uid]);
  const categories = useMemo(() => [...new Set(SKILLS_CATALOG.map((s) => s.category))], []);

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin · Skills</h1>
        <AdminNote />
      </div>

      <div className="grid grid--3">
        <Card title={String(SKILLS_CATALOG.length)} subtitle="Skills in catalog" />
        <Card title={String(categories.length)} subtitle="Categories" />
        <Card title={String(graph.edges.length)} subtitle={`Graph edges (${graph.nodes.length} nodes)`} />
      </div>

      <div className="mt-4">
        <Table
          columns={[
            { key: 'name', header: 'Skill', render: (r) => <strong className="small">{r.name}</strong> },
            { key: 'cat', header: 'Category', render: (r) => <span className="tiny">{r.category}</span> },
            {
              key: 'claimed',
              header: 'Claimed',
              render: (r) => {
                const c = claimed.get(r.id);
                return c ? <LevelBadge level={c.selfLevel} /> : <span className="tiny">—</span>;
              },
            },
            {
              key: 'assessed',
              header: 'Assessed',
              render: (r) => {
                const res = latestResultForSkill(r.id, uid);
                return res ? <Badge variant="success">{res.score}</Badge> : <span className="tiny">—</span>;
              },
            },
            {
              key: 'verified',
              header: 'Verified',
              render: (r) =>
                verifiedForSkill(r.id, uid) ? (
                  <Badge variant="success">✓</Badge>
                ) : (
                  <span className="tiny">—</span>
                ),
            },
          ]}
          rows={SKILLS_CATALOG.map((s) => ({ ...s }))}
        />
      </div>
    </div>
  );
}
