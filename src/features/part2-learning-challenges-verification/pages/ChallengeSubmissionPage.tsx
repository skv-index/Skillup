import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { challengeById } from '../data/catalog';
import { currentUser, submitChallenge } from '../services/part2-store';
import '../part2.css';

export function ChallengeSubmissionPage() {
  const { user } = useAuth();
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const [solution, setSolution] = useState('');
  const [checks, setChecks] = useState<boolean[]>([]);
  const [error, setError] = useState('');

  const challenge = challengeId ? challengeById(challengeId) : undefined;
  const checklistLen = challenge?.checklist.length ?? 0;

  useEffect(() => {
    setChecks((c) => (c.length === checklistLen ? c : challenge?.checklist.map(() => false) ?? []));
  }, [checklistLen, challenge]);

  if (!user) return <Navigate to={paths.login} replace />;
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

  const flip = (i: number) => {
    setChecks((c) => c.map((v, idx) => (idx === i ? !v : v)));
  };

  const submit = () => {
    setError('');
    if (solution.trim().length < 80) {
      setError('Describe your solution with at least 80 characters (what you built + how to run it + link if any).');
      return;
    }
    const evaluation = submitChallenge(challenge.id, solution.trim(), checks, currentUser());
    navigate(`/challenges/${challenge.id}/result`, { state: { evaluationId: evaluation.id } });
  };

  return (
    <div>
      <p className="tiny">
        <Link to={`/challenges/${challenge.id}`}>← {challenge.title}</Link>
      </p>
      <div className="page-head">
        <h1 className="h2">Submit: {challenge.title}</h1>
        <p>Performance Evaluation · auto-graded against the rubric · +{challenge.points} pts</p>
      </div>

      <div className="grid grid--2">
        <Card title="Your solution" subtitle="Paste code, describe approach, add repo/demo link">
          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          <Textarea
            label="Solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder={'What I built…\nHow to run…\nLink: https://…'}
            className="solution-input"
          />
          <p className="tiny muted">{solution.trim().length} characters (min 80)</p>
          <div className="row mt-4">
            <Button onClick={submit}>Submit for evaluation</Button>
            <Link className="btn btn--ghost btn--sm" to={`/challenges/${challenge.id}`}>
              Cancel
            </Link>
          </div>
        </Card>

        <Card title="Self-check rubric" subtitle="Honest checks raise your completeness score">
          {challenge.checklist.map((item, i) => (
            <label key={item} className="check-item" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={!!checks[i]} onChange={() => flip(i)} />
              <span>{item}</span>
            </label>
          ))}
          <Alert variant="info">
            Scoring: checklist completeness (60) + solution substance (30) + prior assessment bonus (10).
            Pass at 60+.
          </Alert>
        </Card>
      </div>
    </div>
  );
}
