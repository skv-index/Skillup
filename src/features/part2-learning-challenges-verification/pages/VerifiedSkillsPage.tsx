import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { CHALLENGES } from '../data/catalog';
import { currentUser, getEvaluations, getVerified, stats } from '../services/part2-store';
import { getClaimed } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { EmptyCta2 } from '../components/Part2Widgets';
import { formatDate } from '@/lib/utils';
import '../part2.css';

export function VerifiedSkillsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;

  const uid = currentUser();
  const verified = useMemo(() => getVerified(uid), [uid]);
  const s = useMemo(() => stats(uid), [uid]);
  const claimedCount = useMemo(() => getClaimed(uid).length, [uid]);
  const attemptedIds = useMemo(() => new Set(getEvaluations(uid).map((e) => e.challengeId)), [uid]);
  const nextUp = CHALLENGES.filter(
    (c) => !attemptedIds.has(c.id) && !verified.some((v) => c.skillIds.includes(v.skillId)),
  ).slice(0, 3);

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Verified Skills</h1>
        <p>Demonstrated → Verified · credentials feed Part 3 career readiness</p>
      </div>

      <div className="grid grid--3">
        <Card title={String(verified.length)} subtitle="Verified skills" />
        <Card title={`${s.challengesPassed}/${s.challengesAttempted}`} subtitle="Challenges passed / attempted" />
        <Card title={`${claimedCount}`} subtitle="Claimed skills (Part 1)">
          <div className="card__actions">
            <Link className="btn btn--ghost btn--sm" to={paths.mySkills}>
              Manage claims
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        {verified.length === 0 ? (
          <EmptyCta2
            icon="🛡️"
            title="No verified skills yet"
            message="Pass a challenge evaluation to turn a demonstrated skill into a verified one."
            to={paths.challenges}
            action="Browse challenges"
          />
        ) : (
          <Table
            columns={[
              {
                key: 'skill',
                header: 'Skill',
                render: (r) => (
                  <Link to={`/verified/${r.id}`}>
                    <strong>{skillById(r.skillId)?.name ?? r.skillId}</strong>
                  </Link>
                ),
              },
              { key: 'level', header: 'Level', render: (r) => <LevelBadge level={r.level} /> },
              { key: 'date', header: 'Verified', render: (r) => formatDate(r.verifiedAt) },
              {
                key: 'cred',
                header: 'Credential',
                render: () => <Badge variant="success">✓ issued</Badge>,
              },
            ]}
            rows={verified.map((v) => ({ ...v }))}
          />
        )}
      </div>

      {nextUp.length > 0 && (
        <Card title="Verify your next skill" subtitle="Unattempted challenges for unverified skills" className="mt-4">
          <div className="grid grid--3">
            {nextUp.map((c) => (
              <div key={c.id} className="card" style={{ padding: 12 }}>
                <strong className="small">{c.title}</strong>
                <p className="tiny muted">{c.skillIds.map((x) => skillById(x)?.name).join(' · ')}</p>
                <p className="mt-4">
                  <Link className="btn btn--secondary btn--sm" to={`/challenges/${c.id}`}>
                    View challenge
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
