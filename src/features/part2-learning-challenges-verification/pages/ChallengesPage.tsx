import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, Input, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { CHALLENGES } from '../data/catalog';
import { currentUser, getEvaluations, latestEvaluationForChallenge } from '../services/part2-store';
import { getGaps } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { DifficultyBadge, PointsBadge } from '../components/Part2Widgets';
import '../part2.css';

export function ChallengesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [onlyRecommended, setOnlyRecommended] = useState(false);

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const gapSkills = useMemo(() => new Set(getGaps(uid).filter((g) => g.gapScore > 0).map((g) => g.skillId)), [uid]);
  const evals = useMemo(() => getEvaluations(uid), [uid]);
  const passedSet = useMemo(() => new Set(evals.filter((e) => e.passed).map((e) => e.challengeId)), [evals]);

  const list = CHALLENGES.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    if (onlyRecommended && !c.skillIds.some((s) => gapSkills.has(s))) return false;
    return true;
  }).sort((a, b) => {
    const ra = a.skillIds.some((s) => gapSkills.has(s)) ? 0 : 1;
    const rb = b.skillIds.some((s) => gapSkills.has(s)) ? 0 : 1;
    return ra - rb;
  });

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Challenges</h1>
        <p>Demonstrate skills → get evaluated → earn verification. Recommended ones close your gaps.</p>
      </div>

      <div className="input-group">
        <Input placeholder="Search challenges…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search challenges" />
        <Select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'expert', label: 'Expert' },
          ]}
          placeholder="All difficulties"
        />
      </div>
      <label className="row small mt-4" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={onlyRecommended} onChange={(e) => setOnlyRecommended(e.target.checked)} />
        Only show challenges matching my open gaps
      </label>

      <div className="grid grid--2 mt-4">
        {list.map((c) => {
          const ev = latestEvaluationForChallenge(c.id, uid);
          const recommended = c.skillIds.some((s) => gapSkills.has(s));
          return (
            <Card
              key={c.id}
              title={c.title}
              subtitle={c.skillIds.map((s) => skillById(s)?.name).join(' · ')}
              actions={
                <>
                  <Link className="btn btn--primary btn--sm" to={`/challenges/${c.id}`}>
                    View
                  </Link>
                  <Link className="btn btn--secondary btn--sm" to={`/challenges/${c.id}/submit`}>
                    {ev ? 'Resubmit' : 'Submit'}
                  </Link>
                </>
              }
            >
              <div className="row">
                <DifficultyBadge level={c.difficulty} />
                <PointsBadge points={c.points} />
                {recommended && <Badge variant="primary">recommended</Badge>}
                {passedSet.has(c.id) && <Badge variant="success">passed ✓</Badge>}
                {ev && !ev.passed && <Badge variant="warning">attempted {ev.score}</Badge>}
              </div>
              <p className="small muted mt-4">{c.description}</p>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="state-block mt-4">No challenges match these filters.</div>
      )}
    </div>
  );
}
