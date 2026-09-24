import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Input, ProgressBar, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { COURSES, CHALLENGES } from '../data/catalog';
import {
  allProgress,
  currentUser,
  getPart2Recommendations,
  stats,
} from '../services/part2-store';
import { aiAvailable, generateLearningPath, type LearningPath } from '../services/ai';
import { getGaps } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { DifficultyBadge } from '../components/Part2Widgets';
import '../part2.css';

export function LearningPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [path, setPath] = useState<LearningPath | null>(null);
  const [pathBusy, setPathBusy] = useState(false);
  const [pathMsg, setPathMsg] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(8);

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const s = useMemo(() => stats(uid), [uid]);
  const recs = useMemo(() => getPart2Recommendations(uid), [uid]);
  const gaps = useMemo(() => new Map(getGaps(uid).map((g) => [g.skillId, g.gapScore])), [uid]);
  const progress = useMemo(() => new Map(allProgress(uid).map((p) => [p.skillId, p])), [uid]);

  const runPath = async () => {
    setPathBusy(true);
    setPathMsg('');
    const allGaps = getGaps(uid);
    const completed = new Map(
      allProgress(uid).map((p) => [p.skillId, p.completedLessons >= (p.totalLessons || 1)]),
    );
    try {
      const result = await generateLearningPath({
        gaps: allGaps,
        courses: COURSES.map((c) => ({
          id: c.id,
          title: c.title,
          skillName: skillById(c.skillId)?.name ?? c.skillId,
          level: c.level,
          minutes: c.lessons.reduce((a, l) => a + l.minutes, 0),
          completed: completed.get(c.skillId) ?? false,
        })),
        weeklyHours,
      });
      setPath(result);
      if (!result.plan.length) setPathMsg('AI returned no plan — try again.');
    } catch (err) {
      setPathMsg(err instanceof Error ? `AI error: ${err.message}` : 'Path generation failed.');
    } finally {
      setPathBusy(false);
      setTimeout(() => setPathMsg(''), 6000);
    }
  };

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

      {aiAvailable() && (
        <Card
          title="✨ AI personalized learning path"
          subtitle="Ordered course plan from your gaps + study time"
          className="mt-4"
          actions={
            <div className="row">
              <Select
                value={String(weeklyHours)}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                options={[
                  { value: '3', label: '3 hrs/week' },
                  { value: '8', label: '8 hrs/week' },
                  { value: '15', label: '15 hrs/week' },
                ]}
                aria-label="Weekly study hours"
                className="measure-s"
              />
              <Button size="sm" onClick={runPath} disabled={pathBusy}>
                {pathBusy ? 'Planning…' : path ? 'Re-plan' : 'Generate path'}
              </Button>
            </div>
          }
        >
          {pathMsg && <Alert variant="error">{pathMsg}</Alert>}
          {!path && !pathMsg && <p className="small muted">Generate a step-by-step study plan tuned to your gaps and weekly hours.</p>}
          {path && (
            <div className="stack-4 small">
              <p className="small">{path.overview}</p>
              {path.plan.map((step, i) => {
                const course = COURSES.find((c) => c.id === step.courseId);
                return (
                  <div key={step.courseId} className="card" style={{ padding: 12 }}>
                    <div className="row row--between">
                      <strong className="small">
                        {i + 1}. {course?.title ?? step.courseId}
                      </strong>
                      <Badge variant="info">~{step.hours} hrs</Badge>
                    </div>
                    <p className="tiny muted mt-4">{step.reason}</p>
                    <p className="tiny mt-4">
                      <strong>Focus:</strong> {step.focus}
                    </p>
                    <p className="mt-4">
                      <Link className="btn btn--secondary btn--sm" to={`/learn/${step.courseId}`}>
                        Open course
                      </Link>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
