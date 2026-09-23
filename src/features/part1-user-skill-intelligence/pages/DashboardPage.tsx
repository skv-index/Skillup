import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  currentUserId,
  getClaimed,
  getGaps,
  getRecommendations,
  getResults,
  getStats,
  refreshGaps,
} from '../services/part1-store';
import { LevelBadge } from '../components/Part1Widgets';
import { formatDate } from '@/lib/utils';
import '../part1.css';

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUserId();
  const stats = useMemo(() => {
    refreshGaps(uid);
    return getStats(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  const claimed = useMemo(() => getClaimed(uid), [uid]);
  const results = useMemo(() => [...getResults(uid)].reverse().slice(0, 5), [uid]);
  const gaps = useMemo(
    () => [...getGaps(uid)].sort((a, b) => b.gapScore - a.gapScore).slice(0, 4),
    [uid],
  );
  const recs = useMemo(() => getRecommendations(uid), [uid]);

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Welcome back, {user.name} 👋</h1>
        <p>Claimed → Assessed → Gap. Here's where your skill intelligence stands.</p>
      </div>

      {!user.onboardingCompleted && (
        <div className="mb-4">
          <Alert variant="info">
            Finish onboarding to unlock gap analysis.{' '}
            <Link to={paths.onboarding}>Complete setup →</Link>
          </Alert>
        </div>
      )}

      {claimed.length === 0 ? (
        <Card title="Start by claiming skills" subtitle="Add 3 starter skills to see the full flow.">
          <div className="card__actions">
            <Link className="btn btn--primary btn--sm" to={paths.mySkills}>
              Add my skills
            </Link>
            <Link className="btn btn--secondary btn--sm" to={paths.onboarding}>
              Redo onboarding
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid--4">
            <Card title={String(stats.claimed)} subtitle="Claimed skills" />
            <Card title={String(stats.assessed)} subtitle="Assessed skills" />
            <Card title={`${stats.avgScore}/100`} subtitle="Average score" />
            <Card title={`${stats.readiness}%`} subtitle="Skill readiness">
              <div className="mt-4">
                <ProgressBar value={stats.readiness} label="" />
              </div>
            </Card>
          </div>

          <div className="grid grid--2 mt-4">
            <Card
              title="Recommended next steps"
              subtitle="Rule-based from your biggest gaps"
              actions={
                <Link className="btn btn--ghost btn--sm" to={paths.skillGap}>
                  Open gap analysis
                </Link>
              }
            >
              <div className="stack-4">
                {recs.length === 0 && <p className="small muted">No gaps — you're on target. 🎉</p>}
                {recs.map((r) => (
                  <div key={r.id} className="card" style={{ padding: 12 }}>
                    <strong className="small">{r.title}</strong>
                    <p className="tiny muted">{r.body}</p>
                    <p className="mt-4">
                      <Link className="btn btn--secondary btn--sm" to={r.actionTo}>
                        {r.actionLabel}
                      </Link>
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Top skill gaps"
              subtitle={`${stats.openGaps} open gaps`}
              actions={
                <Link className="btn btn--ghost btn--sm" to={paths.skillGap}>
                  View all
                </Link>
              }
            >
              <div className="stack-4">
                {gaps.map((g) => (
                  <div key={g.id} className="row row--between">
                    <div>
                      <strong className="small">{g.skill?.name}</strong>{' '}
                      <Badge>{g.gapScore}</Badge>
                      <div className="tiny muted">
                        <LevelBadge level={g.currentLevel} /> → <LevelBadge level={g.targetLevel} />
                      </div>
                    </div>
                    <ProgressBar value={100 - g.gapScore} label="" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card
            title="Recent assessments"
            subtitle="Latest AssessmentResults (consumed by Part 2)"
            className="mt-4"
            actions={
              <Link className="btn btn--ghost btn--sm" to={paths.mySkills}>
                Manage skills
              </Link>
            }
          >
            <Table
              columns={[
                { key: 'skill', header: 'Skill', render: (r) => r.skillId.replace('sk_', '').toUpperCase() },
                { key: 'score', header: 'Score', render: (r) => `${r.score}/100` },
                { key: 'level', header: 'Level', render: (r) => <LevelBadge level={r.level} /> },
                { key: 'date', header: 'Date', render: (r) => formatDate(r.completedAt) },
              ]}
              rows={results.map((r) => ({ ...r }))}
              emptyText="No assessments yet — start one from My Skills."
            />
          </Card>

          <div className="row mt-4">
            <Link className="btn btn--secondary btn--sm" to={paths.skillGraph}>
              Explore skill graph
            </Link>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Refresh stats
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
