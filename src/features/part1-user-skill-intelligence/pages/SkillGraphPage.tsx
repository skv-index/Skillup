import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  buildGraph,
  currentUserId,
  latestResultForSkill,
  refreshGaps,
} from '../services/part1-store';
import { EmptyCta, LevelBadge, StatusBadge } from '../components/Part1Widgets';
import { assessmentsForSkill } from '../data/catalog';
import '../part1.css';

const COLOR: Record<string, string> = {
  assessed: '#16a34a',
  claimed: '#4f46e5',
};

export function SkillGraphPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUserId();
  const graph = useMemo(() => {
    refreshGaps(uid);
    return buildGraph(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const pos = useMemo(() => {
    const n = graph.nodes.length;
    const m = new Map<string, { x: number; y: number }>();
    graph.nodes.forEach((node, i) => {
      const angle = n === 1 ? -Math.PI / 2 : (2 * Math.PI * i) / n - Math.PI / 2;
      m.set(node.id, { x: 300 + 210 * Math.cos(angle), y: 210 + 165 * Math.sin(angle) });
    });
    return m;
  }, [graph]);

  const sel = graph.nodes.find((n) => n.id === selected);
  const selResult = sel ? latestResultForSkill(sel.id, uid) : undefined;
  const selAssessment = sel ? assessmentsForSkill(sel.id)[0] : undefined;

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Skill Graph</h1>
        <p>
          Skill Graph · Skill Management — nodes are your claimed skills, edges link shared
          categories. Produced for Part 2/3 via <code>buildGraph()</code>.
        </p>
      </div>

      {graph.nodes.length === 0 ? (
        <EmptyCta
          icon="🕸️"
          title="No graph yet"
          message="Claim at least 2 skills to see connections."
          to={paths.mySkills}
          action="Add skills"
        />
      ) : (
        <>
          <div className="graph-legend small muted">
            <span>
              <Badge variant="success">● assessed</Badge>
            </span>
            <span>
              <Badge variant="primary">● claimed</Badge>
            </span>
            <span className="tiny">
              {graph.nodes.length} nodes · {graph.edges.length} edges
            </span>
          </div>

          <svg className="graph-svg mt-4" viewBox="0 0 600 420" role="img" aria-label="Skill graph">
            {graph.edges.map((e, i) => {
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              );
            })}
            {graph.nodes.map((n) => {
              const p = pos.get(n.id)!;
              const active = selected === n.id;
              return (
                <g
                  key={n.id}
                  onClick={() => setSelected(n.id)}
                  style={{ cursor: 'pointer' }}
                  opacity={selected && !active ? 0.55 : 1}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 34 : 28}
                    fill={COLOR[n.status ?? 'claimed'] ?? '#4f46e5'}
                    fillOpacity={0.15}
                    stroke={COLOR[n.status ?? 'claimed'] ?? '#4f46e5'}
                    strokeWidth={active ? 3 : 2}
                  />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="currentColor">
                    {n.name.slice(0, 2).toUpperCase()}
                  </text>
                  <text x={p.x} y={p.y + 48} textAnchor="middle" fontSize={11} fill="currentColor">
                    {n.name.length > 14 ? `${n.name.slice(0, 13)}…` : n.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid--2 mt-4">
            <Card title="Nodes" subtitle="Click a node to inspect it">
              <Table
                columns={[
                  { key: 'name', header: 'Skill', render: (r) => <strong className="small">{r.name}</strong> },
                  { key: 'cat', header: 'Category', render: (r) => <span className="tiny">{r.category}</span> },
                  { key: 'level', header: 'Level', render: (r) => r.level ? <LevelBadge level={r.level} /> : <span>—</span> },
                  { key: 'status', header: 'Status', render: (r) => r.status ? <StatusBadge status={r.status} /> : <span>—</span> },
                ]}
                rows={graph.nodes.map((n) => ({ ...n }))}
              />
            </Card>

            <Card
              title={sel ? sel.name : 'Inspector'}
              subtitle={sel ? `${sel.category} · click another node to switch` : 'Select a node in the graph'}
            >
              {!sel ? (
                <p className="small muted">Nothing selected.</p>
              ) : (
                <div className="stack-4">
                  <div className="row">
                    {sel.level && <LevelBadge level={sel.level} />}
                    {sel.status && <StatusBadge status={sel.status} />}
                  </div>
                  <p className="small">
                    Latest score:{' '}
                    {selResult ? <Badge variant="success">{selResult.score}/100</Badge> : 'not assessed yet'}
                  </p>
                  <div className="row">
                    {selAssessment && (
                      <Link className="btn btn--primary btn--sm" to={`/skills/assessment/${selAssessment.id}`}>
                        Assess {sel.name}
                      </Link>
                    )}
                    <Link className="btn btn--secondary btn--sm" to={paths.skillGap}>
                      View gap
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
