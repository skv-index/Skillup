/**
 * Part 2 local store — consumes Part 1 outputs, produces:
 *  LearningProgress, Challenge(into static catalog), Evaluation, VerifiedSkill
 *
 * Keys (per user):
 *  skillup.part2.lessons.<uid>      → Record<courseId, lessonId[]>
 *  skillup.part2.submissions.<uid>  → Submission[]
 *  skillup.part2.evaluations.<uid>  → StoredEvaluation[]
 *  skillup.part2.verified.<uid>     → VerifiedSkill[]
 */
import type { Evaluation, LearningProgress, SkillLevel, VerifiedSkill } from '@/types';
import { storage, uid } from '@/lib/utils';
import { COURSES, challengeById, challengesForSkill } from '../data/catalog';
// Read-only consumption of Part 1 outputs (integration contract):
import {
  currentUserId as part1User,
  getGaps,
  getResults,
  latestResultForSkill,
} from '@/features/part1-user-skill-intelligence/services/part1-store';
import { levelFromScore } from '@/features/part1-user-skill-intelligence/data/catalog';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';

export const currentUser = part1User;

export interface Submission {
  id: ID;
  challengeId: string;
  userId: string;
  solution: string;
  checks: boolean[];
  submittedAt: string;
}
type ID = string;

export interface StoredEvaluation extends Evaluation {
  breakdown: { completeness: number; substance: number; priorBonus: number };
  submissionId: string;
}

const K = {
  lessons: (u: string) => `skillup.part2.lessons.${u}`,
  submissions: (u: string) => `skillup.part2.submissions.${u}`,
  evaluations: (u: string) => `skillup.part2.evaluations.${u}`,
  verified: (u: string) => `skillup.part2.verified.${u}`,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = storage.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

/* ── Learning progress ──────────────────────────── */
export function completedLessons(courseId: string, userId: string = currentUser()): string[] {
  const all = read<Record<string, string[]>>(K.lessons(userId), {});
  return all[courseId] ?? [];
}

export function toggleLesson(
  courseId: string,
  lessonId: string,
  done?: boolean,
  userId: string = currentUser(),
): string[] {
  const all = read<Record<string, string[]>>(K.lessons(userId), {});
  const set = new Set(all[courseId] ?? []);
  const shouldAdd = done ?? !set.has(lessonId);
  if (shouldAdd) set.add(lessonId);
  else set.delete(lessonId);
  write(K.lessons(userId), { ...all, [courseId]: [...set] });
  return [...set];
}

export function progressForCourse(courseId: string, userId: string = currentUser()): LearningProgress | undefined {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return undefined;
  const done = completedLessons(courseId, userId).length;
  const total = course.lessons.length;
  return {
    id: `lp_${course.skillId}`,
    userId,
    skillId: course.skillId,
    completedLessons: done,
    totalLessons: total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    lastAccessedAt: done > 0 ? new Date().toISOString() : undefined,
  };
}

export function allProgress(userId: string = currentUser()): LearningProgress[] {
  return COURSES.map((c) => progressForCourse(c.id, userId)!).filter(Boolean);
}

/* ── Submissions + evaluation ───────────────────── */
export function getSubmissions(userId: string = currentUser()): Submission[] {
  return read<Submission[]>(K.submissions(userId), []);
}

export function getEvaluations(userId: string = currentUser()): StoredEvaluation[] {
  return read<StoredEvaluation[]>(K.evaluations(userId), []);
}

export function latestEvaluationForChallenge(
  challengeId: string,
  userId: string = currentUser(),
): StoredEvaluation | undefined {
  return getEvaluations(userId)
    .filter((e) => e.challengeId === challengeId)
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0];
}

/** Deterministic rubric: completeness (checklist) + substance (solution depth) + prior bonus. */
export function submitChallenge(
  challengeId: string,
  solution: string,
  checks: boolean[],
  userId: string = currentUser(),
): StoredEvaluation {
  const challenge = challengeById(challengeId);
  const submission: Submission = {
    id: uid('sub'),
    challengeId,
    userId,
    solution,
    checks,
    submittedAt: new Date().toISOString(),
  };
  write(K.submissions(userId), [...getSubmissions(userId), submission]);

  const completeness = checks.length === 0 ? 0 : Math.round((checks.filter(Boolean).length / checks.length) * 60);
  const substance = Math.min(30, Math.floor(solution.trim().length / 40));
  const prior = challenge?.skillIds.some((s) => {
    const r = latestResultForSkill(s, userId);
    return r && r.score >= 40;
  });
  const priorBonus = prior ? 10 : 0;
  const score = Math.min(100, completeness + substance + priorBonus);
  const passed = score >= 60;

  const missing = (challenge?.checklist ?? []).filter((_, i) => !checks[i]);
  const feedback = passed
    ? `Solid work (${score}/100). ${missing.length === 0 ? 'All requirements met.' : `Polish: ${missing.slice(0, 2).join('; ')}.`} Eligible for verification.`
    : `Not yet (${score}/100). Focus: ${missing.slice(0, 2).join('; ') || 'add more substance to your solution'}. Review the linked course, then resubmit.`;

  const evaluation: StoredEvaluation = {
    id: uid('ev'),
    userId,
    challengeId,
    score,
    feedback,
    passed,
    evaluatedAt: new Date().toISOString(),
    breakdown: { completeness, substance, priorBonus },
    submissionId: submission.id,
  };
  write(K.evaluations(userId), [...getEvaluations(userId), evaluation]);

  if (passed) autoVerify(challengeId, evaluation, userId);
  return evaluation;
}

/* ── Verification ───────────────────────────────── */
export function getVerified(userId: string = currentUser()): VerifiedSkill[] {
  return read<VerifiedSkill[]>(K.verified(userId), []);
}

export function verifiedForSkill(skillId: string, userId: string = currentUser()): VerifiedSkill | undefined {
  return getVerified(userId).find((v) => v.skillId === skillId);
}

function levelFor(score: number): SkillLevel {
  return levelFromScore(score);
}

/** Auto-verify primary skill on passed evaluation (idempotent per challenge). */
export function autoVerify(
  challengeId: string,
  evaluation: StoredEvaluation,
  userId: string = currentUser(),
): VerifiedSkill | undefined {
  const challenge = challengeById(challengeId);
  if (!challenge || !evaluation.passed) return undefined;
  const existing = getVerified(userId).find(
    (v) => v.evaluationId === evaluation.id,
  );
  if (existing) return existing;

  const primary = challenge.skillIds[0];
  // One verified record per skill — upgrade level on better score.
  const current = verifiedForSkill(primary, userId);
  const level = levelFor(evaluation.score);
  if (current) {
    const better = evaluation.score >= 80 ? level : current.level;
    const updated: VerifiedSkill = { ...current, level: better, evaluationId: evaluation.id };
    write(
      K.verified(userId),
      getVerified(userId).map((v) => (v.id === current.id ? updated : v)),
    );
    return updated;
  }
  const record: VerifiedSkill = {
    id: uid('vs'),
    userId,
    skillId: primary,
    skill: skillById(primary),
    level,
    evaluationId: evaluation.id,
    verifiedAt: new Date().toISOString(),
    credentialUrl: `https://skillup.io/verify/${userId}/${primary}`,
  };
  write(K.verified(userId), [...getVerified(userId), record]);
  return record;
}

/* ── Recommendations (Part 2 slice) ─────────────── */
export interface Part2Recommendation {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}

export function getPart2Recommendations(userId: string = currentUser()): Part2Recommendation[] {
  const gaps = [...getGaps(userId)].sort((a, b) => b.gapScore - a.gapScore);
  const recs: Part2Recommendation[] = [];
  const top = gaps.find((g) => g.gapScore > 0);
  if (top) {
    const course = COURSES.find((c) => c.skillId === top.skillId);
    if (course) {
      const p = progressForCourse(course.id, userId);
      recs.push({
        id: 'rec_learn_gap',
        title: `Learn: ${course.title}`,
        body: `${p?.completedLessons ?? 0}/${p?.totalLessons ?? 0} lessons done · closes your ${top.skill?.name} gap.`,
        actionLabel: 'Continue learning',
        actionTo: `/learn/${course.id}`,
      });
    }
  }
  const assessedUnverified = getResults(userId)
    .map((r) => r.skillId)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .filter((s) => !verifiedForSkill(s, userId))[0];
  if (assessedUnverified) {
    const ch = challengesForSkill(assessedUnverified)[0];
    if (ch) {
      recs.push({
        id: 'rec_challenge_verify',
        title: `Prove it: ${ch.title}`,
        body: `You're assessed in ${skillById(assessedUnverified)?.name}. Pass this challenge (+${ch.points} pts) to earn verification.`,
        actionLabel: 'View challenge',
        actionTo: `/challenges/${ch.id}`,
      });
    }
  }
  return recs.slice(0, 3);
}

export function stats(userId: string = currentUser()): {
  lessonsDone: number;
  lessonsTotal: number;
  challengesPassed: number;
  challengesAttempted: number;
  verified: number;
} {
  const all = allProgress(userId);
  const lessonsDone = all.reduce((a, p) => a + p.completedLessons, 0);
  const lessonsTotal = all.reduce((a, p) => a + p.totalLessons, 0);
  const evals = getEvaluations(userId);
  const attempted = new Set(evals.map((e) => e.challengeId)).size;
  const passed = new Set(evals.filter((e) => e.passed).map((e) => e.challengeId)).size;
  return { lessonsDone, lessonsTotal, challengesPassed: passed, challengesAttempted: attempted, verified: getVerified(userId).length };
}
