import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, Input, ProgressBar, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { COURSES, CHALLENGES } from '../data/catalog';
import {
  allProgress,
  currentUser,
  getPart2Recommendations,
  stats,
} from '../services/part2-store';
import { getGaps } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { DifficultyBadge } from '../components/Part2Widgets';
import '../part2.css';

export function LearningPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const s = useMemo(() => stats(uid), [uid]);
  const recs = useMemo(() => getPart2Recommendations(uid), [uid]);
  const gaps = useMemo(() => new Map(getGaps(uid).map((g) => [g.skillId, g.gapScore])), [uid]);
  const progress = useMemo(() => new Map(allProgress(uid).map((p) => [p.skillId, p])), [uid]);

  const courses = COURSES.filter(
    (c) =>
      (!search || c.title.toLowerCase().includes(search.toLowerCase())) &&
      (!level || c.level === level),
  ).sort((a, b) => (gaps.get(b.skillId) ?? 0) - (gaps.get(a.skillId) ?? 0));

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Learning</h1>
        <p>Courses ordered by your biggest skill gaps · progress feeds Part 3 readiness</p>
      </div>

      <div className="grid grid--3">
        <Card title={`${s.lessonsDone}/${s.lessonsTotal}`} subtitle="Lessons completed">
          <div className="mt-4">
            <ProgressBar value={s.lessonsDone} max={Math.max(1, s.lessonsTotal)} label="" />
          </div>
        </Card>
        <Card title={String(s.challengesPassed)} subtitle={`Challenges passed (${s.challengesAttempted} attempted)`} />
        <Card title={String(s.verified)} subtitle="Skills verified">
          <div className="card__actions">
            <Link className="btn btn--ghost btn--sm" to={paths.verifiedSkills}>
              View verified
            </Link>
          </div>
        </Card>
      </div>

      {recs.length > 0 && (
        <Card title="Recommended for you" subtitle="From Skill Gap + Assessment data" className="mt-4">
          <div className="grid grid--2">
            {recs.map((r) => (
              <div key={r.id} className="card" style={{ padding: 12 }}>
                <strong className="small">{r.title}</strong>
                <p className="tiny muted">{r.body}</p>
                <p className="mt-4">
                  <Link className="btn btn--primary btn--sm" to={r.actionTo}>
                    {r.actionLabel}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="input-group mt-4">
        <Input placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search courses" />
        <Select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'expert', label: 'Expert' },
          ]}
          placeholder="All levels"
        />
      </div>

      <div className="grid grid--2 mt-4">
        {courses.map((c) => {
          const p = progress.get(c.skillId);
          const gap = gaps.get(c.skillId) ?? 0;
          const ch = CHALLENGES.find((x) => x.relatedCourseId === c.id);
          return (
            <Card
              key={c.id}
              title={c.title}
              subtitle={`${skillById(c.skillId)?.name} · ${c.lessons.length} lessons`}
              actions={
                <>
                  <Link className="btn btn--primary btn--sm" to={`/learn/${c.id}`}>
                    {p && p.completedLessons > 0 ? 'Continue' : 'Start'}
                  </Link>
                  {ch && (
                    <Link className="btn btn--secondary btn--sm" to={`/challenges/${ch.id}`}>
                      Challenge
                    </Link>
                  )}
                </>
              }
            >
              <div className="row">
                <DifficultyBadge level={c.level} />
                {gap > 0 ? <Badge variant="warning">gap {gap}</Badge> : <Badge variant="success">on target ✓</Badge>}
                <span className="tiny muted">{c.lessons.reduce((a, l) => a + l.minutes, 0)} min</span>
              </div>
              <p className="small muted mt-4">{c.blurb}</p>
              <div className="mt-4">
                <ProgressBar value={p?.completedLessons ?? 0} max={p?.totalLessons ?? c.lessons.length} label={`Progress`} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
