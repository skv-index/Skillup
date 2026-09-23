import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  careerReadiness,
  currentUser,
  getPart3Recommendations,
  matchAll,
} from '../services/part3-store';
import { MatchBadge, ScoreBadge } from '../components/Part3Widgets';
import '../part3.css';

export function CareerReadinessPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const readiness = useMemo(() => careerReadiness(uid), [uid]);
  const matches = useMemo(() => matchAll(uid).slice(0, 3), [uid]);
  const recs = useMemo(() => getPart3Recommendations(uid), [uid]);

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">Career Readiness</h1>
          <p>
            Verified skills → readiness → opportunities · <ScoreBadge score={readiness.score} />
          </p>
        </div>
        <Link className="btn btn--primary btn--sm" to={paths.jobs}>
          Find jobs
        </Link>
      </div>

      <div className="grid grid--3">
        <Card title={`${readiness.score}/100`} subtitle="Readiness score">
          <div className="mt-4">
            <ProgressBar value={readiness.score} label="" />
          </div>
        </Card>
        <Card title={String(readiness.verifiedCount)} subtitle={`Verified of ${readiness.totalSkills} claimed`} />
        <Card title={String(readiness.gapsClosed)} subtitle="Skill gaps closed" />
      </div>

      <div className="grid grid--2 mt-4">
        <Card title="Readiness checklist" subtitle="Each item raises real match scores">
          {readiness.checklist.map((c) => (
            <div key={c.label} className="check-line">
              <span className={`check-dot ${c.done ? 'check-dot--done' : ''}`}>{c.done ? '✓' : '○'}</span>
              <span className={c.done ? '' : 'muted'}>{c.label}</span>
            </div>
          ))}
        </Card>

        <div>
          <Card
            title="Top role matches"
            subtitle="Computed from verified + assessed + claimed levels"
            actions={
              <Link className="btn btn--ghost btn--sm" to={paths.jobs}>
                All roles
              </Link>
            }
          >
            <div className="stack-4">
              {matches.map((m) => (
                <div key={m.opportunityId} className="row row--between">
                  <div>
                    <Link to={`/jobs/${m.opportunityId}`}>
                      <strong className="small">{m.opportunity?.title}</strong>
                    </Link>
                    <div className="tiny muted">{m.opportunity?.company}</div>
                  </div>
                  <MatchBadge score={m.matchScore} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recommended next" subtitle="What moves the needle" className="mt-4">
            <div className="stack-4">
              {recs.map((r) => (
                <div key={r.id}>
                  <strong className="small">{r.title}</strong>
                  <p className="tiny muted">{r.body}</p>
                  <p className="mt-4">
                    <Link className="btn btn--secondary btn--sm" to={r.actionTo}>
                      {r.actionLabel}
                    </Link>
                  </p>
                </div>
              ))}
              {recs.length === 0 && <Badge variant="success">Fully ready — apply! 🎉</Badge>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
