/**
 * SKILLUP Part 2 — AI services (Groq).
 * Personalized learning paths, AI challenge grading + feedback,
 * and course content drafts. All calls degrade gracefully to local logic.
 */
import type { SkillGap } from '@/types';
import { groqEnabled, groqJson } from '@/lib/groq';
import type { ChallengeSpec } from '../data/catalog';

export const aiAvailable = groqEnabled;

/* ── Personalized learning path ─────────────────────────────────────────── */

export interface LearningPathStep {
  courseId: string;
  reason: string;
  focus: string;
  hours: number;
}

export interface LearningPath {
  overview: string;
  plan: LearningPathStep[];
}

export async function generateLearningPath(input: {
  gaps: SkillGap[];
  courses: { id: string; title: string; skillName: string; level: string; minutes: number; completed: boolean }[];
  weeklyHours: number;
}): Promise<LearningPath> {
  if (!input.courses.length) return { overview: '', plan: [] };

  const gaps = input.gaps
    .map((g) => `${g.skill?.name ?? g.skillId} (${g.currentLevel} → ${g.targetLevel}, gap ${g.gapScore}/100)`)
    .join('\n');
  const options = input.courses
    .map(
      (c) =>
        `- ${c.id} | ${c.title} | ${c.skillName} | ${c.level} | ${c.minutes} min | ${c.completed ? 'completed candidate' : 'not started'}`,
    )
    .join('\n');

  const data = await groqJson<{
    overview?: string;
    plan?: { courseId?: string; reason?: string; focus?: string; hours?: number }[];
  }>([
    {
      role: 'system',
      content:
        "You are a learning path designer who orders courses to close a learner's skill gaps in the fewest hours. Respond ONLY with valid JSON.",
    },
    {
      role: 'user',
      content: `Learner can study about ${input.weeklyHours} hours/week.

Skill gaps:
${gaps}

Course options:
${options}

Order the courses into a personalized path (array order = sequence). Rules:
- Start with the highest-gap, must-have skill
- Respect prerequisites: basics before advanced
- Skip completed courses
- Realistic per-course hours given weekly capacity

Return JSON: {"overview":"1-2 sentence strategy","plan":[{"courseId":"course_sk_js","reason":"why now","focus":"what to focus on","hours":3}]}`,
    },
  ]);

  const valid = new Set(input.courses.map((c) => c.id));
  const plan = (data.plan ?? [])
    .filter((p) => p && typeof p.courseId === 'string' && valid.has(p.courseId))
    .map((p) => ({
      courseId: p.courseId as string,
      reason: String(p.reason ?? ''),
      focus: String(p.focus ?? ''),
      hours: typeof p.hours === 'number' && p.hours > 0 ? Math.min(40, Math.round(p.hours)) : 2,
    }));
  return { overview: String(data.overview ?? ''), plan };
}

/* ── Challenge grading + feedback ───────────────────────────────────────── */

export interface AiGrade {
  completeness: number; // 0-60
  substance: number; // 0-30
  priorBonus: number; // 0-10
  feedback: string;
}

const clamp = (v: number, max: number) =>
  Math.max(0, Math.min(max, Math.round(typeof v === 'number' && Number.isFinite(v) ? v : 0)));

export async function gradeChallenge(input: {
  challenge: ChallengeSpec;
  solution: string;
  checks: boolean[];
  priorBonus: number;
}): Promise<AiGrade> {
  const { challenge, solution, checks, priorBonus } = input;

  const checklist = challenge.checklist
    .map((item, i) => `- ${item} ${checks[i] ? '[claimed✓]' : '[not claimed]'}`)
    .join('\n');

  const data = await groqJson<{
    completeness?: number;
    substance?: number;
    priorBonus?: number;
    feedback?: string;
  }>([
    {
      role: 'system',
      content:
        "You are a senior engineer mentor grading a challenge submission. Be fair, specific and encouraging. Respond ONLY with valid JSON.",
    },
    {
      role: 'user',
      content: `Challenge: ${challenge.title}
Description: ${challenge.description}
Skills: ${challenge.skillIds.join(', ')} · Difficulty: ${challenge.difficulty}

Rubric checklist:
${checklist}

Learner's submission:
"""
${solution}
"""

Score 0-100, split:
- completeness 0-60: award only for rubric items genuinely evidenced in the solution (a claimed check without evidence = no points)
- substance 0-30: depth, correctness, approach, clarity
- priorBonus 0-10: base ${priorBonus}

Return JSON: {"completeness":40,"substance":20,"priorBonus":10,"feedback":"2-4 sentences: what was strong, what to improve, one concrete next step"}`,
    },
  ]);

  return {
    completeness: clamp(Number(data.completeness), 60),
    substance: clamp(Number(data.substance), 30),
    priorBonus: clamp(Number(data.priorBonus), 10),
    feedback:
      typeof data.feedback === 'string' && data.feedback.trim()
        ? data.feedback.trim()
        : `Scored from rubric (${clamp(Number(data.completeness), 60) + clamp(Number(data.substance), 30) + clamp(Number(data.priorBonus), 10)}/100).`,
  };
}

/** Regenerate human-style feedback for an existing evaluation (feature 3). */
export async function improveFeedback(input: {
  challenge: ChallengeSpec;
  solution: string;
  checks: boolean[];
  score: number;
  currentFeedback: string;
}): Promise<string> {
  const checklist = input.challenge.checklist
    .map((item, i) => `- ${item} ${input.checks[i] ? '[claimed✓]' : '[not claimed]'}`)
    .join('\n');

  const data = await groqJson<{ feedback?: string }>([
    {
      role: 'system',
      content:
        'You are a warm, precise career mentor. Rewrite evaluation feedback so it is specific, actionable, and motivating. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: `Challenge: ${input.challenge.title}
Rubric checklist:
${checklist}

Submission:
"""
${input.solution}
"""

Score: ${input.score}/100.
Current robot feedback: "${input.currentFeedback}"

Write better feedback: 2-4 sentences naming specific strengths, 2 concrete improvements, and exactly one next step. Return JSON: {"feedback":"..."}`,
    },
  ]);

  return String(data.feedback ?? input.currentFeedback).trim();
}

/* ── Course content drafts ──────────────────────────────────────────────── */

export interface AiLessonDraft {
  title: string;
  minutes: number;
  kind: 'read' | 'video' | 'practice' | 'quiz';
}

export interface AiQuizDraft {
  prompt: string;
  options: string[];
  answerIndex: number;
  topic: string;
}

export interface AiCourseDraft {
  lessons: AiLessonDraft[];
  quiz: AiQuizDraft[];
}

export async function draftCourseContent(input: {
  skill: string;
  level: string;
  courseTitle: string;
  blurb: string;
  existingTitles: string[];
}): Promise<AiCourseDraft> {
  const existing = input.existingTitles.map((t) => `- ${t}`).join('\n');

  const data = await groqJson<{
    lessons?: { title?: string; minutes?: number; kind?: string }[];
    quiz?: { prompt?: string; options?: string[]; answerIndex?: number; topic?: string }[];
  }>([
    {
      role: 'system',
      content:
        'You are a curriculum designer drafting course content. Each lesson has a title, minutes, and kind (read | video | practice | quiz). Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: `Draft a focused lesson plan + short quiz for "${input.courseTitle}" (${input.level}) on ${input.skill}.
Course goal: ${input.blurb}

Existing lessons (keep different angle):
${existing}

Return 4 new lessons and 2 quiz questions.
Return JSON: {"lessons":[{"title":"...","minutes":10,"kind":"read"}],"quiz":[{"prompt":"...","options":["a","b","c","d"],"answerIndex":0,"topic":"..."}]}`,
    },
  ]);

  const lessons: AiLessonDraft[] = (data.lessons ?? [])
    .filter(
      (l) =>
        l && typeof l.title === 'string' && ['read', 'video', 'practice', 'quiz'].includes(String(l.kind)),
    )
    .slice(0, 4)
    .map((l) => ({
      title: l.title as string,
      minutes: typeof l.minutes === 'number' && l.minutes > 0 ? Math.min(90, Math.round(l.minutes)) : 10,
      kind: l.kind as AiLessonDraft['kind'],
    }));

  const quiz: AiQuizDraft[] = (data.quiz ?? [])
    .filter(
      (q) =>
        q &&
        typeof q.prompt === 'string' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.answerIndex === 'number',
    )
    .slice(0, 2)
    .map((q) => ({
      prompt: q.prompt as string,
      options: q.options?.slice(0, 4) ?? [],
      answerIndex: q.answerIndex as number,
      topic: String(q.topic ?? input.skill),
    }));

  return { lessons, quiz };
}