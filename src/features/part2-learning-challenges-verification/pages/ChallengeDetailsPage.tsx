import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, Badge, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { challengeById, courseById } from '../data/catalog';
import { currentUser, latestEvaluationForChallenge } from '../services/part2-store';
import { effectiveLevel } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { DifficultyBadge, PointsBadge } from '../components/Part2Widgets';
import '../part2.css';

export function ChallengeDetailsPage() {
  const { user } = useAuth();
  const { challengeId } = useParams<{ challengeId: string }>();

  if (!user) return <Navigate to={paths.login} replace />;
  const challenge = challengeId ? challengeById(challengeId) : undefined;
  if (!challenge) {
    return (
      <div>
        <Alert variant="error">Challenge not found.</Alert>
        <p className="mt-4">
          <Link className="btn btn--secondary btn--sm" to={paths.challenges}>
            Back to Challenges
          </Link>
        </p>
      </div>
    );
  }

  const uid = currentUser();
  const evaluation = latestEvaluationForChallenge(challenge.id, uid);
  const course = challenge.relatedCourseId ? courseById(challenge.relatedCourseId) : undefined;

  return (
    <div>
      <p className="tiny">
        <Link to={paths.challenges}>← Challenges</Link>
      </p>
      <div className="page-head">
        <h1 className="h2">{challenge.title}</h1>
        <p>{challenge.description}</p>
      </div>

      <div className="row">
        <DifficultyBadge level={challenge.difficulty} />
        <PointsBadge points={challenge.points} />
        {evaluation && (
          <Badge variant={evaluation.passed ? 'success' : 'warning'}>
            {evaluation.passed ? `passed ${evaluation.score} ✓` : `attempted ${evaluation.score}`}
          </Badge>
        )}
      </div>

      <div className="grid grid--2 mt-4">
        <Card
          title="Tasks"
          subtitle="Complete all, then submit"
          actions={
            <>
              <Link className="btn btn--primary btn--sm" to={`/challenges/${challenge.id}/submit`}>
                {evaluation ? 'Resubmit solution' : 'Submit solution'}
              </Link>
              {evaluation && (
                <Link className="btn btn--secondary btn--sm" to={`/challenges/${challenge.id}/result`}>
                  View result
                </Link>
              )}
            </>
          }
        >
          <ol className="small" style={{ paddingLeft: 20 }}>
            {challenge.tasks.map((t) => (
              <li key={t} style={{ marginBottom: 6 }}>
                {t}
              </li>
            ))}
          </ol>
          <p className="tiny muted mt-4">Graded on: {challenge.checklist.join(' · ')}</p>
        </Card>

        <div>
          <Card title="Skills involved" subtitle="Your current level per skill">
            <div className="stack-4">
              {challenge.skillIds.map((s) => {
                const eff = effectiveLevel(s, uid);
                return (
                  <div key={s} className="row row--between">
                    <strong className="small">{skillById(s)?.name}</strong>
                    <span className="row">
                      <LevelBadge level={eff.level} />
                      {eff.assessed && <Badge variant="success">assessed</Badge>}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
          {course && (
            <Card title="Prepare first" subtitle={course.title} className="mt-4">
              <p className="small muted">{course.blurb}</p>
              <div className="card__actions">
                <Link className="btn btn--secondary btn--sm" to={`/learn/${course.id}`}>
                  Open course
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
