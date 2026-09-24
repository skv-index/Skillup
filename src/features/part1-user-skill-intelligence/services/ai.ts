/**
 * SKILLUP Part 1 — AI services (Groq).
 * Adaptive question generation, resume skill extraction, gap insights.
 * Revenue stream: replacing rule-of-thumb with grounded, explainable advice.
 * All calls degrade gracefully — callers fall back to local logic on error.
 */
import type { AssessmentResult, ClaimedSkill, SkillGap, SkillLevel } from '@/types';
import { groqEnabled, groqJson } from '@/lib/groq';
import type { QuizQuestion } from '../data/catalog';

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const aiAvailable = groqEnabled;

/* ── Adaptive question generation ───────────────────────────────────────── */

export async function generateQuestions(opts: {
  assessmentId: string;
  skill: string;
  level: SkillLevel;
  count: number;
}): Promise<QuizQuestion[]> {
  const { assessmentId, skill, level, count } = opts;

  const data = await groqJson<{
    questions: { prompt: string; options: string[]; answerIndex: number; topic: string }[];
  }>([
    {
      role: 'system',
      content:
        "You are an expert technical assessment writer. Respond ONLY with valid JSON. Questions must be accurate, self-contained and unambiguous.",
    },
    {
      role: 'user',
      content: `Create ${count} multiple-choice questions assessing ${level}-level ${skill}.
- Exactly 4 options per question
- answerIndex 0–3 points to the correct option
- Short topic label per question
- Mix conceptual and practical ("what does this code/snippet do") styles
- Allowed levels: beginner, intermediate, advanced, expert

Return JSON: {"questions":[{"prompt":"...","options":["a","b","c","d"],"answerIndex":0,"topic":"..."}]}`,
    },
  ]);

  const out: QuizQuestion[] = [];
  (data.questions ?? []).forEach((q, i) => {
    if (!q || typeof q.prompt !== 'string' || !Array.isArray(q.options) || q.options.length < 2) return;
    const answer =
      typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < q.options.length
        ? Math.round(q.answerIndex)
        : 0;
    out.push({
      id: `${assessmentId}_ai_${i + 1}`,
      prompt: q.prompt,
      options: q.options.slice(0, 4),
      answer,
      topic: typeof q.topic === 'string' && q.topic ? q.topic : skill,
    });
  });
  return out.slice(0, count);
}

/* ── Resume skill extraction ────────────────────────────────────────────── */

export interface ExtractedSkill {
  skillId: string;
  selfLevel: SkillLevel;
  yearsExperience: number;
}

export async function extractSkillsFromResume(
  resumeText: string,
  catalog: { id: string; name: string }[],
): Promise<ExtractedSkill[]> {
  if (!resumeText.trim()) return [];

  const allowed = catalog.map((s) => `${s.id}: ${s.name}`).join(', ');

  const data = await groqJson<{
    skills?: { skillId?: string; selfLevel?: string; yearsExperience?: number }[];
  }>([
    {
      role: 'system',
      content:
        "You are a precise skills extractor for a curriculum-aligned catalog. Respond ONLY with valid JSON. Never invent skills outside the catalog.",
    },
    {
      role: 'user',
      content: `Extract ONLY skills that appear in this catalog:

${allowed}

Resume:
"""
${resumeText}
"""

Return JSON: {"skills":[{"skillId":"sk_js","selfLevel":"intermediate","yearsExperience":2}]}
- skillId must match a catalog id exactly
- selfLevel ∈ beginner | intermediate | advanced | expert (infer from evidence: years, scope, seniority)
- yearsExperience is a non-negative number (0 if unknown)`,
    },
  ]);

  const validIds = new Set(catalog.map((s) => s.id));
  return (data.skills ?? [])
    .filter((s) => s && typeof s.skillId === 'string' && validIds.has(s.skillId))
    .map((s) => ({
      skillId: s.skillId as string,
      selfLevel: (LEVELS.includes(s.selfLevel as SkillLevel) ? s.selfLevel : 'beginner') as SkillLevel,
      yearsExperience:
        typeof s.yearsExperience === 'number' && s.yearsExperience >= 0
          ? Math.min(30, Math.round(s.yearsExperience))
          : 0,
    }));
}

/* ── Gap insights ───────────────────────────────────────────────────────── */

export interface GapInsight {
  skillId: string;
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  why: string;
  action: string;
}

export async function analyzeGaps(
  gaps: SkillGap[],
  ctx: { targetRole: string; results: AssessmentResult[]; claimed: ClaimedSkill[] },
): Promise<GapInsight[]> {
  if (!gaps.length) return [];

  const profile = gaps
    .map((g) => {
      const r = ctx.results.find((x) => x.skillId === g.skillId);
      return `${g.skillId} (${g.skill?.name ?? g.skillId}): ${g.currentLevel} → ${g.targetLevel}, gap ${g.gapScore}/100, lastScore ${r ? r.score : 'none'}`;
    })
    .join('\n');

  const data = await groqJson<{
    insights?: { skillId?: string; priority?: string; why?: string; action?: string }[];
  }>([
    {
      role: 'system',
      content:
        "You are a career coach who turns raw skill-gap data into prioritized, concrete next steps. Respond ONLY with valid JSON.",
    },
    {
      role: 'user',
      content: `Target role: ${ctx.targetRole}

Skill summary (current → target, gap size 0–100):
${profile}

For each skill return:
- why it matters for this role (grounded)
- one concrete next action (assess? course? challenge?)
- priority (high/medium/low)

Return JSON: {"insights":[{"skillId":"sk_js","priority":"high","why":"...","action":"..."}]}`,
    },
  ]);

  const byId = new Map(gaps.map((g) => [g.skillId, g]));
  return (data.insights ?? [])
    .filter((i) => i && typeof i.skillId === 'string' && byId.has(i.skillId))
    .map((i) => {
      const g = byId.get(i.skillId as string) as SkillGap;
      const priority = (['high', 'medium', 'low'].includes(String(i.priority)) ? i.priority : 'medium') as GapInsight['priority'];
      return {
        skillId: i.skillId as string,
        skillName: g.skill?.name ?? (i.skillId as string),
        priority,
        why: String(i.why ?? ''),
        action: String(i.action ?? ''),
      };
    });
}