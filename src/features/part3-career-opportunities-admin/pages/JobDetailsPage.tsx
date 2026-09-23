import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  currentUser,
  getOpportunity,
  matchFor,
  savedIds,
  toggleSaved,
} from '../services/part3-store';
import { effectiveLevel } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { getVerified } from '@/features/part2-learning-challenges-verification/services/part2-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { MatchBadge } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function JobDetailsPage() {
  const { user } = useAuth();
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const [saved, setSaved] = useState<string[]>(() => savedIds());

  if (!user) return <Navigate to={paths.login} replace />;
  const opportunity = opportunityId ? getOpportunity(opportunityId) : undefined;
  if (!opportunity) {
    return (
      <div>
        <Alert variant="error">Opportunity not found.</Alert>
        <p className="mt-4">
          <Link className="btn btn--secondary btn--sm" to={paths.jobs}>
            Back to Jobs
          </Link>
        </p>
      </div>
    );
  }

  const uid = currentUser();
  const match = matchFor(opportunity, uid);
  const verifiedSet = new Set(getVerified(uid).map((v) => v.skillId));
  const isSaved = saved.includes(opportunity.id);

  return (
    <div>
      <p className="tiny">
        <Link to={paths.jobs}>← Jobs & Internships</Link>
      </p>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">{opportunity.title}</h1>
          <p>
            {opportunity.company} · {opportunity.location} · {formatDate(opportunity.postedAt)}
          </p>
        </div>
        <MatchBadge score={match.matchScore} />
      </div>

      <div className="job-meta">
        <Badge>{opportunity.type}</Badge>
        {opportunity.remote && <Badge variant="info">remote</Badge>}
        <Button size="sm" variant={isSaved ? 'secondary' : 'ghost'} onClick={() => setSaved(toggleSaved(opportunity.id, uid))}>
          {isSaved ? '★ Saved' : '☆ Save role'}
        </Button>
      </div>

      <div className="grid grid--2 mt-4">
        <Card title="About the role" subtitle={opportunity.company}>
          <p className="small">{opportunity.description}</p>
          <div className="mt-4">
            <ProgressBar value={match.matchScore} label="Your match" />
          </div>
          {match.matchScore >= 70 ? (
            <div className="mt-4">
              <Alert variant="success">Strong match — apply with your verified credentials attached.</Alert>
            </div>
          ) : (
            <div className="mt-4">
              <Alert variant="info">
                {match.missingSkills.length} skill{match.missingSkills.length > 1 ? 's' : ''} below bar — see
                exactly which below.
              </Alert>
            </div>
          )}
        </Card>

        <Card title="Requirement breakdown" subtitle="Your level vs required minimum">
          {opportunity.requiredSkills.map((r) => {
            const eff = effectiveLevel(r.skillId, uid);
            const ok = match.matchedSkills.includes(r.skillId);
            return (
              <div key={r.skillId} className="req-row">
                <div>
                  <strong className="small">{skillById(r.skillId)?.name}</strong>
                  <div className="tiny muted">
                    needs <LevelBadge level={r.minLevel} /> · you have <LevelBadge level={eff.level} />
                    {eff.assessed && ' (assessed)'}
                    {verifiedSet.has(r.skillId) && <Badge variant="success">verified</Badge>}
                  </div>
                </div>
                <Badge variant={ok ? 'success' : 'danger'}>{ok ? '✓ met' : 'gap'}</Badge>
              </div>
            );
          })}
          {match.missingSkills.length > 0 && (
            <div className="card__actions">
              <Link className="btn btn--secondary btn--sm" to={paths.skillGap}>
                Close gaps
              </Link>
              <Link className="btn btn--ghost btn--sm" to={paths.learning}>
                Learn
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
