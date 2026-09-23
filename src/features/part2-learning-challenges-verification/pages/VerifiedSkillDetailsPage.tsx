import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { challengeById } from '../data/catalog';
import { currentUser, getEvaluations, getVerified } from '../services/part2-store';
import { latestResultForSkill } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { formatDate } from '@/lib/utils';
import '../part2.css';

export function VerifiedSkillDetailsPage() {
  const { user } = useAuth();
  const { verifiedSkillId } = useParams<{ verifiedSkillId: string }>();

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const record = getVerified(uid).find((v) => v.id === verifiedSkillId);

  if (!record) {
    return (
      <div>
        <Alert variant="error">Verified skill not found.</Alert>
        <p className="mt-4">
          <Link className="btn btn--secondary btn--sm" to={paths.verifiedSkills}>
            Back to Verified Skills
          </Link>
        </p>
      </div>
    );
  }

  const skill = skillById(record.skillId) ?? record.skill;
  const evaluation = getEvaluations(uid).find((e) => e.id === record.evaluationId);
  const challenge = evaluation ? challengeById(evaluation.challengeId) : undefined;
  const assessment = latestResultForSkill(record.skillId, uid);

  return (
    <div>
      <p className="tiny">
        <Link to={paths.verifiedSkills}>← Verified Skills</Link>
      </p>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">{skill?.name} — Verified ✓</h1>
          <p>Verified {formatDate(record.verifiedAt)} · level {record.level}</p>
        </div>
        <LevelBadge level={record.level} />
      </div>

      <div className="grid grid--2">
        <Card title="Credential" subtitle="Shareable proof (feeds Part 3)">
          <div className="cred-box">{record.credentialUrl}</div>
          <div className="card__actions">
            <Button
              size="sm"
              onClick={() => navigator.clipboard?.writeText(record.credentialUrl ?? '').catch(() => {})}
            >
              Copy link
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(JSON.stringify(record, null, 2)).catch(() => {})}
            >
              Copy JSON
            </Button>
          </div>
          <p className="tiny muted mt-4">
            {skill?.category} · {skill?.description}
          </p>
        </Card>

        <div>
          <Card title="How it was earned" subtitle="Performance Evaluation trail">
            {evaluation ? (
              <div className="small">
                <p>
                  <strong>{challenge?.title}</strong> — scored <Badge>{evaluation.score}/100</Badge>
                </p>
                <p className="muted mt-4">{evaluation.feedback}</p>
                <p className="mt-4">
                  <Link className="btn btn--ghost btn--sm" to={`/challenges/${evaluation.challengeId}/result`}>
                    View evaluation
                  </Link>
                </p>
              </div>
            ) : (
              <p className="small muted">Evaluation record not found.</p>
            )}
          </Card>
          <Card title="Assessment history" subtitle="Part 1 input" className="mt-4">
            {assessment ? (
              <p className="small">
                Latest assessment: <Badge variant="success">{assessment.score}/100</Badge>{' '}
                <LevelBadge level={assessment.level} />
              </p>
            ) : (
              <p className="small muted">No assessment record — verification came from challenge performance.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
