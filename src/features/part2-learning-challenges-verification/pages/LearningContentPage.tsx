import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import { CHALLENGES, courseById } from '../data/catalog';
import {
  completedLessons,
  currentUser,
  progressForCourse,
  toggleLesson,
} from '../services/part2-store';
import { getGaps } from '@/features/part1-user-skill-intelligence/services/part1-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import '../part2.css';

export function LearningContentPage() {
  const { user } = useAuth();
  const { contentId } = useParams<{ contentId: string }>();
  const [version, setVersion] = useState(0);

  if (!user) return <Navigate to={paths.login} replace />;
  const course = contentId ? courseById(contentId) : undefined;
  if (!course) {
    return (
      <div>
        <Alert variant="error">Course not found.</Alert>
        <p className="mt-4">
          <Link className="btn btn--secondary btn--sm" to={paths.learning}>
            Back to Learning
          </Link>
        </p>
      </div>
    );
  }

  const uid = currentUser();
  const done = useMemo(() => completedLessons(course.id, uid), [course.id, uid, version]);
  const progress = useMemo(() => progressForCourse(course.id, uid), [course.id, uid, version, done]);
  const gap = getGaps(uid).find((g) => g.skillId === course.skillId);
  const nextChallenge = CHALLENGES.find((c) => c.relatedCourseId === course.id);
  const totalMin = course.lessons.reduce((a, l) => a + l.minutes, 0);

  const flip = (lessonId: string) => {
    toggleLesson(course.id, lessonId, undefined, uid);
    setVersion((v) => v + 1);
  };
  const completeAll = () => {
    course.lessons.forEach((l) => toggleLesson(course.id, l.id, true, uid));
    setVersion((v) => v + 1);
  };

  const pct = progress?.percent ?? 0;

  return (
    <div>
      <p className="tiny">
        <Link to={paths.learning}>← Learning</Link>
      </p>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">{course.title}</h1>
          <p>
            {skillById(course.skillId)?.name} · {course.lessons.length} lessons · {totalMin} min
          </p>
        </div>
        {gap && (
          <div className="row">
            <LevelBadge level={gap.currentLevel} />
            <span className="muted">→</span>
            <LevelBadge level={gap.targetLevel} />
          </div>
        )}
      </div>

      <ProgressBar value={pct} label={`Course progress`} />

      {pct === 100 && nextChallenge && (
        <div className="mt-4">
          <Alert variant="success">
            Course complete 🎉 — prove it in <Link to={`/challenges/${nextChallenge.id}`}>{nextChallenge.title}</Link> (+
            {nextChallenge.points} pts).
          </Alert>
        </div>
      )}

      <div className="grid grid--2 mt-4">
        <div>
          {course.lessons.map((l, i) => {
            const isDone = done.includes(l.id);
            return (
              <label key={l.id} className={`lesson-row ${isDone ? 'lesson-row--done' : ''}`}>
                <input
                  type="checkbox"
                  className="lesson-check"
                  checked={isDone}
                  onChange={() => flip(l.id)}
                  aria-label={l.title}
                />
                <div>
                  <strong className="small">
                    {i + 1}. {l.title}
                  </strong>
                  <div className="tiny muted">
                    {l.kind} · {l.minutes} min
                  </div>
                </div>
                {isDone && <Badge variant="success">done</Badge>}
              </label>
            );
          })}
          <div className="row mt-4">
            <Button size="sm" variant="secondary" onClick={completeAll}>
              Mark all complete
            </Button>
            {nextChallenge && (
              <Link className="btn btn--primary btn--sm" to={`/challenges/${nextChallenge.id}`}>
                Go to challenge
              </Link>
            )}
          </div>
        </div>

        <div>
          <Card title="Why this course" subtitle="Linked to your gap analysis">
            <p className="small muted">{course.blurb}</p>
            {gap ? (
              <p className="small mt-4">
                Your {skillById(course.skillId)?.name} gap: <Badge>{gap.gapScore} pts</Badge> — finishing
                this course + its challenge is the fastest way to close it.
              </p>
            ) : (
              <p className="small mt-4">No open gap for this skill — learning keeps you sharp.</p>
            )}
          </Card>
          {nextChallenge && (
            <Card title="Prove it next" subtitle={nextChallenge.title} className="mt-4">
              <p className="small muted">{nextChallenge.description}</p>
              <div className="card__actions">
                <Link className="btn btn--secondary btn--sm" to={`/challenges/${nextChallenge.id}`}>
                  View challenge
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
