import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  adminOverview,
  careerReadiness,
  currentUser,
  matchAll,
} from '../services/part3-store';
import { getGaps } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { AdminNote, ScoreBadge } from '../components/Part3Widgets';
import '../part3.css';

export function AdminAnalyticsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const stats = useMemo(() => adminOverview(uid), [uid]);
  const readiness = useMemo(() => careerReadiness(uid), [uid]);
  const matches = useMemo(() => matchAll(uid), [uid]);
  const gaps = useMemo(() => getGaps(uid), [uid]);

  const strong = matches.filter((m) => m.matchScore >= 70).length;
  const mid = matches.filter((m) => m.matchScore >= 40 && m.matchScore < 70).length;
  const weak = matches.filter((m) => m.matchScore < 40).length;
  const gapsClosedPct = gaps.length === 0 ? 0 : Math.round((gaps.filter((g) => g.gapScore === 0).length / gaps.length) * 100);
  const learningPct = stats.lessonsTotal === 0 ? 0 : Math.round((stats.lessonsDone / stats.lessonsTotal) * 100);

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">Admin · Analytics</h1>
          <AdminNote />
        </div>
        <ScoreBadge score={readiness.score} />
      </div>

      <div className="grid grid--2">
        <Card title="Learning funnel" subtitle="Progress Tracking aggregates">
          <div className="stack-4">
            <ProgressBar value={learningPct} label={`Lessons ${stats.lessonsDone}/${stats.lessonsTotal}`} />
            <ProgressBar
              value={stats.assessmentsTaken === 0 ? 0 : Math.min(100, stats.assessmentsTaken * 20)}
              label={`Assessments taken (${stats.assessmentsTaken})`}
            />
            <ProgressBar value={gapsClosedPct} label={`Gaps closed (${gapsClosedPct}%)`} />
            <ProgressBar value={readiness.score} label="Readiness" />
          </div>
        </Card>

        <Card title="Opportunity matches" subtitle="Match-score distribution across live roles">
          <div className="stack-4">
            <ProgressBar value={matches.length ? Math.round((strong / matches.length) * 100) : 0} label={`Strong ≥70% (${strong})`} />
            <ProgressBar value={matches.length ? Math.round((mid / matches.length) * 100) : 0} label={`Developing 40–69% (${mid})`} />
            <ProgressBar value={matches.length ? Math.round((weak / matches.length) * 100) : 0} label={`Stretch <40% (${weak})`} />
          </div>
          <p className="tiny muted mt-4">
            {matches.length} live roles scored against verified → assessed → claimed levels.
          </p>
        </Card>
      </div>

      <Card title="Checklist completion" subtitle="Career Readiness detail" className="mt-4">
        {readiness.checklist.map((c) => (
          <div key={c.label} className="check-line">
            <span className={`check-dot ${c.done ? 'check-dot--done' : ''}`}>{c.done ? '✓' : '○'}</span>
            <span className={c.done ? '' : 'muted'}>{c.label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
