import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { assessmentById, skillById } from '../data/catalog';
import {
  currentUserId,
  getGaps,
  getResults,
  latestResultForSkill,
} from '../services/part1-store';
import { LevelBadge, ScoreBar } from '../components/Part1Widgets';
import '../part1.css';

export function AssessmentResultPage() {
  const { user } = useAuth();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const location = useLocation() as { state?: { resultId?: string } };

  const result = useMemo(() => {
    const uid = currentUserId();
    const all = getResults(uid);
    if (location.state?.resultId) return all.find((r) => r.id === location.state!.resultId);
    const a = assessmentId ? assessmentById(assessmentId) : undefined;
    if (a) return latestResultForSkill(a.skillId, uid);
    return [...all].reverse()[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  if (!user) return <Navigate to={paths.login} replace />;
  if (!result) {
    return (
      <div>
        <div className="page-head">
          <h1 className="h2">No result yet</h1>
          <p>Take an assessment first — then your score, level and recommendations appear here.</p>
        </div>
        <Link className="btn btn--primary btn--sm" to={paths.mySkills}>
          Go to My Skills
        </Link>
      </div>
    );
  }

  const skill = skillById(result.skillId);
  const gap = getGaps(currentUserId()).find((g) => g.skillId === result.skillId);
  const passed = result.score >= 40;

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">{skill?.name} — Result</h1>
        <p>
          AI Skill Assessment · <LevelBadge level={result.level} /> ·{' '}
          {new Date(result.completedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid--2">
        <Card title="Your score" subtitle={`Assessment ${result.assessmentId}`}>
          <ScoreBar score={result.score} />
          <p className="mt-4">
            <Badge variant={passed ? 'success' : 'warning'}>
              {passed ? 'Passed — skill assessed ✓' : 'Below bar — keep practicing'}
            </Badge>
          </p>
          <div className="card__actions">
            <Link className="btn btn--primary btn--sm" to={paths.skillGap}>
              See my gaps
            </Link>
            <Link className="btn btn--secondary btn--sm" to={`/skills/assessment/${result.assessmentId}`}>
              Retake
            </Link>
          </div>
        </Card>

        <Card title="Strengths & focus areas" subtitle="Recommendation input for Part 2 learning">
          <p className="small">
            <strong>Strengths:</strong>{' '}
            {result.strengths.length ? result.strengths.join(' · ') : '—'}
          </p>
          <p className="small mt-4">
            <strong>To improve:</strong>{' '}
            {result.weaknesses.length ? result.weaknesses.join(' · ') : '—'}
          </p>
          {gap && (
            <p className="small mt-4">
              <strong>Gap vs target ({gap.targetLevel}):</strong>{' '}
              <Badge>{gap.gapScore} pts</Badge>
            </p>
          )}
          <div className="card__actions">
            <Link className="btn btn--secondary btn--sm" to={paths.mySkills}>
              Back to skills
            </Link>
            <Link className="btn btn--ghost btn--sm" to={paths.dashboard}>
              Dashboard
            </Link>
          </div>
        </Card>
      </div>

      <Card title="What this unlocks" subtitle="Integration contract → Part 2" className="mt-4">
        <p className="small muted">
          This <code>AssessmentResult</code> ({result.id}) is stored locally and readable by Part 2
          via <code>getResults()</code>. Continue to Learning / Challenges (Part 2) once built, or
          explore your <Link to={paths.skillGraph}>skill graph</Link>.
        </p>
        <div className="mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2)).catch(() => {})}
          >
            Copy result JSON
          </Button>
        </div>
      </Card>
    </div>
  );
}
