import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { challengeById } from '../data/catalog';
import {
  currentUser,
  getEvaluations,
  improveEvaluationFeedback,
  latestEvaluationForChallenge,
  verifiedForSkill,
} from '../services/part2-store';
import { aiAvailable } from '../services/ai';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import '../part2.css';

export function EvaluationResultPage() {
  const { user } = useAuth();
  const { challengeId } = useParams<{ challengeId: string }>();
  const location = useLocation() as { state?: { evaluationId?: string } };
  const [version, setVersion] = useState(0);
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();

  const evaluation = useMemo(() => {
    if (location.state?.evaluationId) {
      return getEvaluations(uid).find((e) => e.id === location.state!.evaluationId);
    }
    return challengeId ? latestEvaluationForChallenge(challengeId, uid) : [...getEvaluations(uid)].reverse()[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, uid, version]);

  const rephraseFeedback = async () => {
    if (!evaluation) return;
    setFeedbackBusy(true);
    try {
      await improveEvaluationFeedback(evaluation.id, uid);
      setVersion((v) => v + 1);
    } catch {
      /* keep original feedback */
    } finally {
      setFeedbackBusy(false);
    }
  };

  if (!evaluation) {
    return (
      <div>
        <div className="page-head">
          <h1 className="h2">No evaluation yet</h1>
          <p>Submit a challenge solution first.</p>
        </div>
        <Link className="btn btn--primary btn--sm" to={paths.challenges}>
          Browse challenges
        </Link>
      </div>
    );
  }

  const challenge = challengeById(evaluation.challengeId);
  const verified = challenge ? verifiedForSkill(challenge.skillIds[0], uid) : undefined;

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">{evaluation.passed ? 'Passed 🎉' : 'Keep going 💪'} — {evaluation.score}/100</h1>
        <p>
          {challenge?.title} · evaluated {new Date(evaluation.evaluatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid--2">
        <Card title="Evaluation" subtitle="Performance Evaluation · Challenge · Skill Management">
          <ProgressBar value={evaluation.score} label="Score" />
          <div className="stack-4 mt-4 small">
            <div className="row row--between">
              <span>Completeness (checklist)</span>
              <strong>{evaluation.breakdown.completeness}/60</strong>
            </div>
            <div className="row row--between">
              <span>Substance (solution depth)</span>
              <strong>{evaluation.breakdown.substance}/30</strong>
            </div>
            <div className="row row--between">
              <span>Prior assessment bonus</span>
              <strong>+{evaluation.breakdown.priorBonus}/10</strong>
            </div>
          </div>
          <p className="mt-4">
            <Badge variant={evaluation.passed ? 'success' : 'warning'}>
              {evaluation.passed ? `Passed · +${challenge?.points} pts` : 'Not passed — resubmit allowed'}
            </Badge>
          </p>
          <div className="card__actions">
            {!evaluation.passed && challenge && (
              <Link className="btn btn--primary btn--sm" to={`/challenges/${challenge.id}/submit`}>
                Improve & resubmit
              </Link>
            )}
            <Link className="btn btn--secondary btn--sm" to={paths.challenges}>
              All challenges
            </Link>
          </div>
        </Card>

        <div>
          <Card
            title="Feedback"
            subtitle={aiAvailable() ? 'AI-adjusted' : 'What the rubric saw'}
            actions={
              aiAvailable() && evaluation ? (
                <Button size="sm" variant="secondary" onClick={rephraseFeedback} disabled={feedbackBusy}>
                  {feedbackBusy ? 'Rewriting…' : '✨ Improve (AI)'}
                </Button>
              ) : undefined
            }
          >
            <p className="small">{evaluation.feedback}</p>
            {challenge && (
              <p className="small muted mt-4">
                Skills: {challenge.skillIds.map((s) => skillById(s)?.name).join(' · ')}
              </p>
            )}
          </Card>
          {evaluation.passed && verified && (
            <Card title="Verified skill earned ✓" subtitle="Skill Verification" className="mt-4">
              <p className="small">
                <strong>{verified.skill?.name}</strong> verified at <strong>{verified.level}</strong>
              </p>
              <div className="cred-box mt-4">{verified.credentialUrl}</div>
              <div className="card__actions">
                <Link className="btn btn--primary btn--sm" to={`/verified/${verified.id}`}>
                  View credential
                </Link>
                <Link className="btn btn--ghost btn--sm" to={paths.verifiedSkills}>
                  All verified
                </Link>
              </div>
            </Card>
          )}
          {evaluation.passed && !verified && (
            <div className="mt-4">
              <Alert variant="info">Passed but not yet verified — this shouldn't happen. Resubmit to regenerate.</Alert>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(evaluation, null, 2)).catch(() => {})}
        >
          Copy evaluation JSON
        </Button>
      </div>
    </div>
  );
}
