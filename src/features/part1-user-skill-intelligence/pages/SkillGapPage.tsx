import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar, Select, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import type { SkillLevel } from '@/types';
import { TARGET_ROLES, skillById } from '../data/catalog';
import {
  currentUserId,
  getClaimed,
  getGaps,
  getPrefs,
  getResults,
  refreshGaps,
  savePrefs,
  setGapTarget,
} from '../services/part1-store';
import { aiAvailable, analyzeGaps, type GapInsight } from '../services/ai';
import { EmptyCta, LevelBadge } from '../components/Part1Widgets';
import '../part1.css';

type Filter = 'all' | 'open' | 'closed';

export function SkillGapPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [roleId, setRoleId] = useState(() => getPrefs().targetRoleId);
  const [insights, setInsights] = useState<GapInsight[]>([]);
  const [insightBusy, setInsightBusy] = useState(false);
  const [insightMsg, setInsightMsg] = useState('');

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUserId();

  const gaps = useMemo(() => {
    refreshGaps(uid);
    return getGaps(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, version, roleId]);

  const visible = gaps.filter((g) => {
    if (filter === 'open') return g.gapScore > 0;
    if (filter === 'closed') return g.gapScore === 0;
    return true;
  });

  const open = gaps.filter((g) => g.gapScore > 0).length;
  const avgGap = gaps.length ? Math.round(gaps.reduce((a, g) => a + g.gapScore, 0) / gaps.length) : 0;

  const changeRole = (id: string) => {
    setRoleId(id);
    const prefs = getPrefs(uid);
    savePrefs({ ...prefs, targetRoleId: id }, uid);
    setVersion((v) => v + 1);
  };

  const changeTarget = (skillId: string, level: SkillLevel) => {
    setGapTarget(skillId, level, uid);
    setVersion((v) => v + 1);
  };

  const runInsights = async () => {
    setInsightBusy(true);
    setInsightMsg('');
    try {
      const targetRole = TARGET_ROLES.find((r) => r.id === roleId)?.title ?? '';
      const res = await analyzeGaps(gaps, {
        targetRole,
        results: getResults(uid),
        claimed: getClaimed(uid),
      });
      setInsights(res);
      if (!res.length) setInsightMsg('No insights returned — try again.');
    } catch (err) {
      setInsightMsg(err instanceof Error ? `AI error: ${err.message}` : 'AI analysis failed.');
    } finally {
      setInsightBusy(false);
      setTimeout(() => setInsightMsg(''), 5000);
    }
  };

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">Skill Gap Analysis</h1>
          <p>Current level vs target · recommendations · progress input for Part 2</p>
        </div>
        <Link className="btn btn--secondary btn--sm" to={paths.skillGraph}>
          View graph
        </Link>
      </div>

      <div className="grid grid--3">
        <Card title={String(open)} subtitle={`Open gaps of ${gaps.length}`} />
        <Card title={`${avgGap} pts`} subtitle="Average gap size">
          <div className="mt-4">
            <ProgressBar value={100 - avgGap} label="" />
          </div>
        </Card>
        <Card title={TARGET_ROLES.find((r) => r.id === roleId)?.title ?? '—'} subtitle="Target role">
          <div className="mt-4">
            <Select
              value={roleId}
              onChange={(e) => changeRole(e.target.value)}
              options={TARGET_ROLES.map((r) => ({ value: r.id, label: r.title }))}
              aria-label="Target role"
            />
          </div>
        </Card>
      </div>

      <div className="row mt-4">
        {(['all', 'open', 'closed'] as Filter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <span className="tiny muted" style={{ marginLeft: 'auto' }}>
          Adjust a target level inline — gaps recompute instantly.
        </span>
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <EmptyCta
            icon="🎯"
            title={gaps.length === 0 ? 'No skills to analyze' : 'No gaps in this view'}
            message={
              gaps.length === 0
                ? 'Claim skills first, then gaps compute against your target role.'
                : 'Every skill in this filter meets its target. Nice work.'
            }
            to={paths.mySkills}
            action="Manage skills"
          />
        ) : (
          <Table
            columns={[
              {
                key: 'skill',
                header: 'Skill',
                render: (r) => (
                  <div>
                    <strong>{skillById(r.skillId)?.name}</strong>
                    <div className="tiny muted">{r.recommendedAction}</div>
                  </div>
                ),
              },
              { key: 'current', header: 'Current', render: (r) => <LevelBadge level={r.currentLevel} /> },
              {
                key: 'target',
                header: 'Target',
                render: (r) => (
                  <select
                    className="select"
                    value={r.targetLevel}
                    onChange={(e) => changeTarget(r.skillId, e.target.value as SkillLevel)}
                    aria-label={`Target for ${r.skillId}`}
                    style={{ minWidth: 140 }}
                  >
                    {(['beginner', 'intermediate', 'advanced', 'expert'] as SkillLevel[]).map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: 'gap',
                header: 'Gap',
                render: (r) => (
                  <div style={{ minWidth: 140 }}>
                    <Badge variant={r.gapScore === 0 ? 'success' : r.gapScore >= 60 ? 'danger' : 'warning'}>
                      {r.gapScore === 0 ? 'Closed ✓' : `${r.gapScore} pts`}
                    </Badge>
                    <div className="mt-4">
                      <ProgressBar value={100 - r.gapScore} label="" />
                    </div>
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Next',
                render: (r) => {
                  const s = skillById(r.skillId);
                  return (
                    <Link className="btn btn--primary btn--sm" to={`/skills/assessment/as_${s?.slug}`}>
                      Assess
                    </Link>
                  );
                },
              },
            ]}
            rows={visible.map((g) => ({ ...g }))}
          />
        )}
      </div>

      {aiAvailable() && (
        <Card
          title="AI gap insights"
          subtitle="Why these gaps matter for your role — and what to do first"
          className="mt-4"
          actions={
            <Button size="sm" onClick={runInsights} disabled={insightBusy || gaps.length === 0}>
              {insightBusy ? 'Analyzing…' : insights.length ? 'Re-run analysis' : 'Generate insights'}
            </Button>
          }
        >
          {insightMsg && <Alert variant="error">{insightMsg}</Alert>}
          {insights.length === 0 && !insightMsg && (
            <p className="small muted">Generate AI-powered, prioritized advice for your skill gaps.</p>
          )}
          {insights.map((i) => (
            <div key={i.skillId} className="card mt-4" style={{ padding: 12 }}>
              <div className="row row--between">
                <strong className="small">{i.skillName}</strong>
                <Badge variant={i.priority === 'high' ? 'danger' : i.priority === 'medium' ? 'warning' : 'info'}>
                  {i.priority} priority
                </Badge>
              </div>
              <p className="tiny muted mt-4">{i.why}</p>
              <p className="tiny mt-4">
                <strong>Next:</strong> {i.action}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
