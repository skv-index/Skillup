import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, ProgressBar, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  buildGraph,
  currentUserId,
  getGaps,
  latestResultForSkill,
  refreshGaps,
} from '../services/part1-store';
import { EmptyCta, LevelBadge, StatusBadge } from '../components/Part1Widgets';
import { assessmentsForSkill, LEVEL_INDEX } from '../data/catalog';
import '../part1.css';

const STATUS_COLOR: Record<string, string> = {
  assessed: '#16a34a',
  claimed: '#4f46e5',
};

const CAT_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];

const RING_R = 30;
const NODE_R = 26;

interface Point {
  x: number;
  y: number;
}

export function SkillGraphPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'radar'>('radar');
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUserId();
  const graph = useMemo(() => {
    refreshGaps(uid);
    return buildGraph(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const categories = useMemo(() => [...new Set(graph.nodes.map((n) => n.category))], [graph]);
  const catColor = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c, i) => m.set(c, CAT_COLORS[i % CAT_COLORS.length]));
    return m;
  }, [categories]);

  const scoreBy = useMemo(() => {
    const m = new Map<string, number | undefined>();
    graph.nodes.forEach((n) => m.set(n.id, latestResultForSkill(n.id, uid)?.score));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, uid]);

  const gapsMap = useMemo(() => new Map(getGaps(uid).map((g) => [g.skillId, g])), [uid]);
  const levelBy = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n.level ?? 'beginner'])), [graph]);

  /** Radar: current proficiency (assessed score, else level-based proxy). */
  const curScore = (id: string) => scoreBy.get(id) ?? 25 + LEVEL_INDEX[levelBy.get(id) ?? 'beginner'] * 23;
  /** Radar: target proficiency from gap targets. */
  const tarScore = (id: string) => {
    const t = gapsMap.get(id)?.targetLevel;
    return t ? 60 + LEVEL_INDEX[t] * 12 : 100;
  };

  const radar = useMemo(() => {
    const n = graph.nodes;
    if (n.length < 3) return null;
    const cx = 360;
    const cy = 262;
    const R = 200;
    const pts = n.map((node, i) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / n.length;
      const cur = curScore(node.id);
      const tar = tarScore(node.id);
      const x = cx + R * Math.cos(ang);
      const y = cy + R * Math.sin(ang);
      return {
        node,
        ang,
        cur,
        tar,
        x,
        y,
        curP: { x: cx + (R * cur) / 100 * Math.cos(ang), y: cy + (R * cur) / 100 * Math.sin(ang) },
        tarP: { x: cx + (R * tar) / 100 * Math.cos(ang), y: cy + (R * tar) / 100 * Math.sin(ang) },
      };
    });
    return {
      cx,
      cy,
      R,
      pts,
      curPoly: pts.map((p) => `${p.curP.x},${p.curP.y}`).join(' '),
      tarPoly: pts.map((p) => `${p.tarP.x},${p.tarP.y}`).join(' '),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, uid]);

  const sel = graph.nodes.find((n) => n.id === selected);
  const selResult = sel ? latestResultForSkill(sel.id, uid) : undefined;
  const selGap = sel ? getGaps(uid).find((g) => g.skillId === sel.id) : undefined;
  const selAssessment = sel ? assessmentsForSkill(sel.id)[0] : undefined;

  const pos = useMemo(() => {
    const m = new Map<string, Point>();
    if (!graph.nodes.length) return m;
    const cats = [...new Set(graph.nodes.map((n) => n.category))];
    const cx = 360;
    const cy = 320;
    if (cats.length === 1) {
      const n = graph.nodes;
      n.forEach((node, i) => {
        const a = n.length === 1 ? -Math.PI / 2 : (2 * Math.PI * i) / n.length - Math.PI / 2;
        const r = Math.max(60, 34 + n.length * 18);
        m.set(node.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      });
      return m;
    }
    const smallR = new Map(
      cats.map((cat) => {
        const k = graph.nodes.filter((n) => n.category === cat).length;
        return [cat, Math.max(52, 30 + k * 15)];
      }),
    );
    const maxR = Math.max(...[...smallR.values()]);
    const ring = 96 + maxR;
    cats.forEach((cat, c) => {
      const angle = (2 * Math.PI * c) / cats.length - Math.PI / 2;
      const cc: Point = { x: cx + ring * Math.cos(angle), y: cy + ring * Math.sin(angle) };
      const ks = graph.nodes.filter((n) => n.category === cat);
      const r = smallR.get(cat)!;
      ks.forEach((node, i) => {
        const a = ks.length === 1 ? -Math.PI / 2 : (2 * Math.PI * i) / ks.length - Math.PI / 2;
        m.set(node.id, { x: cc.x + r * Math.cos(a), y: cc.y + r * Math.sin(a) });
      });
    });
    return m;
  }, [graph]);

  const edgePath = (a: Point, b: Point) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = 26;
    return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 - (dy / len) * off} ${(a.y + b.y) / 2 + (dx / len) * off} ${b.x} ${b.y}`;
  };

  const assessed = graph.nodes.filter((n) => n.status === 'assessed').length;
  const topScore = Math.max(...graph.nodes.map((n) => scoreBy.get(n.id) ?? 0));

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">Skill Graph</h1>
          <p>
            Your skill landscape — Cluster Map shows category connections, Score Radar compares current level
            to your target role.
          </p>
        </div>
        <div className="row">
          <Link className="btn btn--secondary btn--sm" to={paths.skillGap}>
            View gaps
          </Link>
          <Link className="btn btn--primary btn--sm" to={paths.mySkills}>
            Edit skills
          </Link>
        </div>
      </div>

      {graph.nodes.length === 0 ? (
        <EmptyCta
          icon="🕸️"
          title="No graph yet"
          message="Claim at least 2 skills to see how they connect by category."
          to={paths.mySkills}
          action="Add skills"
        />
      ) : (
        <>
          <div className="graph-stats">
            <div className="graph-stat">
              <strong>{graph.nodes.length}</strong>
              <span>Skills</span>
            </div>
            <div className="graph-stat">
              <strong>
                {assessed}/{graph.nodes.length}
              </strong>
              <span>Assessed</span>
            </div>
            <div className="graph-stat">
              <strong>{categories.length}</strong>
              <span>Domains</span>
            </div>
            <div className="graph-stat">
              <strong>{graph.edges.length}</strong>
              <span>Links</span>
            </div>
          </div>

          <div className="graph-bar">
            <div className="graph-legend">
              {view === 'map' ? (
                <>
                  <span className="graph-legend__item">
                    <i className="dot" style={{ background: STATUS_COLOR.assessed }} /> assessed
                  </span>
                  <span className="graph-legend__item">
                    <i className="dot" style={{ background: STATUS_COLOR.claimed }} /> claimed
                  </span>
                  <span className="graph-legend__sep" />
                  {categories.map((c) => (
                    <span key={c} className="graph-legend__item">
                      <i className="dot" style={{ background: catColor.get(c) }} /> {c}
                    </span>
                  ))}
                </>
              ) : (
                <>
                  <span className="graph-legend__item">
                    <i className="swatch swatch--fill" /> current
                  </span>
                  <span className="graph-legend__item">
                    <i className="swatch swatch--dash" /> target
                  </span>
                  <span className="graph-legend__sep" />
                  <span className="graph-legend__item">
                    <i className="dot" style={{ background: STATUS_COLOR.assessed }} /> assessed
                  </span>
                  <span className="graph-legend__item">
                    <i className="dot" style={{ background: STATUS_COLOR.claimed }} /> claimed
                  </span>
                </>
              )}
            </div>

            <div className="seg" role="tablist" aria-label="Graph view">
              <button
                className={`seg__btn ${view === 'map' ? 'seg__btn--active' : ''}`}
                role="tab"
                aria-selected={view === 'map'}
                onClick={() => setView('map')}
              >
                Cluster map
              </button>
              <button
                className={`seg__btn ${view === 'radar' ? 'seg__btn--active' : ''}`}
                role="tab"
                aria-selected={view === 'radar'}
                disabled={graph.nodes.length < 3}
                title={graph.nodes.length < 3 ? 'Needs at least 3 skills' : 'Score vs target radar'}
                onClick={() => setView('radar')}
              >
                Score radar
              </button>
            </div>
          </div>

          <div className="graph-panel mt-4">
            {view === 'map' || !radar ? (
              <svg className="graph-svg" viewBox="0 0 720 640" role="img" aria-label="Skill cluster map">
                <defs>
                  <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.18" />
                  </filter>
                </defs>

                <rect width={720} height={640} className="graph-bg" onClick={() => setSelected(null)} />

                {graph.edges.map((e, i) => {
                  const a = pos.get(e.from);
                  const b = pos.get(e.to);
                  if (!a || !b) return null;
                  return (
                    <path
                      key={i}
                      d={edgePath(a, b)}
                      className="graph-edge"
                      stroke={catColor.get(e.label ?? '') ?? '#94a3b8'}
                      opacity={selected && !(selected === e.from || selected === e.to) ? 0.25 : 0.55}
                    />
                  );
                })}

                {graph.nodes.map((n) => {
                  const p = pos.get(n.id)!;
                  const active = selected === n.id;
                  const color = STATUS_COLOR[n.status ?? 'claimed'] ?? '#4f46e5';
                  const score = scoreBy.get(n.id);
                  const rank = LEVEL_INDEX[n.level ?? 'beginner'] + 1;
                  const circ = 2 * Math.PI * RING_R;
                  const initials = n.name.slice(0, 2).toUpperCase();
                  const tip = `${n.name} · ${n.level ?? 'unrated'}${score != null ? ` · ${score}/100` : ''} · ${n.status}`;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${p.x} ${p.y})`}
                      className={selected && !active ? 'node-dim' : ''}
                      onClick={() => setSelected(n.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{tip}</title>
                      {active && <circle r={RING_R + 6} className="node__pulse" />}
                      {score != null && (
                        <circle
                          r={RING_R}
                          fill="none"
                          stroke={color}
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeDasharray={`${circ * (score / 100)} ${circ}`}
                          transform="rotate(-90)"
                          style={{ transition: 'stroke-dasharray .4s ease' }}
                        />
                      )}
                      <g className="node">
                        <circle r={NODE_R} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={2.5} />
                        <circle r={16} fill={color} fillOpacity={0.12} />
                        <text y={5} textAnchor="middle" fontSize={15} fontWeight={800} fill={color}>
                          {initials}
                        </text>
                        <g style={{ opacity: 0.9 }}>
                          {[0, 1, 2, 3].map((i) => (
                            <circle
                              key={i}
                              cx={-7.5 + i * 5}
                              cy={34}
                              r={1.8}
                              fill={i < rank ? color : 'currentColor'}
                              opacity={i < rank ? 1 : 0.25}
                            />
                          ))}
                        </g>
                        <text y={47} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="currentColor">
                          {n.name.length > 16 ? `${n.name.slice(0, 15)}…` : n.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <svg className="graph-svg" viewBox="0 0 720 560" role="img" aria-label="Skill score radar">
                <defs>
                  <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                </defs>

                <rect width={720} height={560} className="graph-bg" onClick={() => setSelected(null)} />

                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <circle
                    key={f}
                    cx={radar.cx}
                    cy={radar.cy}
                    r={radar.R * f}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={f === 1 ? 1.5 : 1}
                  />
                ))}
                {[0.25, 0.5, 0.75].map((f) => (
                  <text
                    key={f}
                    x={radar.cx - 10}
                    y={radar.cy - radar.R * f + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--color-text-faint)"
                  >
                    {f * 100}
                  </text>
                ))}
                <text x={radar.cx - 10} y={radar.cy - radar.R + 4} textAnchor="end" fontSize={10} fill="var(--color-text-faint)">
                  100
                </text>

                {radar.pts.map((p) => (
                  <line
                    key={p.node.id}
                    x1={radar.cx}
                    y1={radar.cy}
                    x2={p.x}
                    y2={p.y}
                    stroke={catColor.get(p.node.category) ?? '#94a3b8'}
                    strokeWidth={1.5}
                    opacity={selected && selected !== p.node.id ? 0.25 : 0.5}
                  />
                ))}

                <polygon points={radar.tarPoly} fill="none" stroke="var(--color-text-faint)" strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round" />
                <polygon points={radar.curPoly} fill="url(#radarGrad)" fillOpacity={0.2} stroke="var(--color-primary-600)" strokeWidth={2.5} strokeLinejoin="round" />

                {radar.pts.map((p) => {
                  const active = selected === p.node.id;
                  const color = STATUS_COLOR[p.node.status ?? 'claimed'] ?? '#4f46e5';
                  return (
                    <g key={p.node.id} onClick={() => setSelected(p.node.id)} style={{ cursor: 'pointer' }} className={selected && !active ? 'node-dim' : ''}>
                      <title>{`${p.node.name} · ${p.node.level} · current ${p.cur}/100 → target ${p.tar}/100`}</title>
                      <circle cx={p.tarP.x} cy={p.tarP.y} r={4} fill="none" stroke="var(--color-text-faint)" strokeWidth={1.5} />
                      {active && <circle cx={p.curP.x} cy={p.curP.y} r={11} className="node__pulse" />}
                      <circle cx={p.curP.x} cy={p.curP.y} r={active ? 7 : 5} fill={color} stroke="#fff" strokeWidth={1.5} className="node" />
                      <text
                        x={p.x + (p.x >= radar.cx ? 14 : -14)}
                        y={p.y + (Math.abs(p.x - radar.cx) < 10 ? 4 : 0)}
                        textAnchor={Math.abs(p.x - radar.cx) < 10 ? 'middle' : p.x > radar.cx ? 'start' : 'end'}
                        fontSize={11.5}
                        fontWeight={600}
                        fill="var(--color-text)"
                      >
                        {p.node.name.length > 14 ? `${p.node.name.slice(0, 13)}…` : p.node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="graph-foot tiny">
            {view === 'map' || !radar ? (
              <>
                Ring = latest assessment score · dots = level (1–4, beginner → expert) ·{' '}
                {topScore > 0 ? `strongest assessment this session: ${topScore}/100` : 'no assessments yet'}
              </>
            ) : (
              <>
                Solid polygon = your current proficiency · dashed outline = target from Skill Gap · spokes
                colored by domain · click a vertex to inspect
              </>
            )}
          </div>

          <div className="grid grid--2 mt-4">
            <Card title="All skills" subtitle="Click a node to inspect it">
              <Table
                columns={[
                  { key: 'name', header: 'Skill', render: (r) => <strong className="small">{r.name}</strong> },
                  { key: 'cat', header: 'Domain', render: (r) => <span className="tiny">{r.category}</span> },
                  { key: 'level', header: 'Level', render: (r) => (r.level ? <LevelBadge level={r.level} /> : <span>—</span>) },
                  {
                    key: 'score',
                    header: 'Score',
                    render: (r) =>
                      r.score != null ? <Badge variant="success">{r.score}/100</Badge> : <span className="tiny muted">—</span>,
                  },
                  { key: 'status', header: 'Status', render: (r) => (r.status ? <StatusBadge status={r.status} /> : <span>—</span>) },
                ]}
                rows={graph.nodes.map((n) => ({ ...n, score: scoreBy.get(n.id) }))}
              />
            </Card>

            <Card title={sel ? sel.name : 'Inspector'} subtitle={sel ? sel.category : 'Click a node to inspect it'}>
              {!sel ? (
                <div className="state-block" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                  <div className="state-block__icon">🕸️</div>
                  <p className="small muted">Select a node to see its level, score and next steps.</p>
                </div>
              ) : (
                <div className="stack-4">
                  <div className="row">
                    {sel.level && <LevelBadge level={sel.level} />}
                    {sel.status && <StatusBadge status={sel.status} />}
                    <Badge variant="info">{sel.category}</Badge>
                  </div>

                  <div>
                    <div className="row row--between">
                      <span className="tiny muted">Latest score</span>
                      {selResult ? (
                        <Badge variant="success">{selResult.score}/100</Badge>
                      ) : (
                        <span className="tiny muted">not assessed</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={selResult?.score ?? 0} max={100} label="" />
                    </div>
                  </div>

                  {selGap && (
                    <div className="row row--between">
                      <span className="tiny muted">Gap to target</span>
                      <Badge variant={selGap.gapScore === 0 ? 'success' : selGap.gapScore >= 60 ? 'danger' : 'warning'}>
                        {selGap.currentLevel} → {selGap.targetLevel}
                      </Badge>
                    </div>
                  )}

                  <div className="row">
                    {selAssessment && (
                      <Link className="btn btn--primary btn--sm" to={`/skills/assessment/${selAssessment.id}`}>
                        Assess {sel.name}
                      </Link>
                    )}
                    <Link className="btn btn--secondary btn--sm" to={paths.skillGap}>
                      View gap
                    </Link>
                    <Link className="btn btn--ghost btn--sm" to={paths.mySkills}>
                      Edit
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