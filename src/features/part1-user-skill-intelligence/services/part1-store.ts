/**
 * Part 1 local store — persists integration-contract outputs so
 * Part 2 / Part 3 can consume them (same keys documented here).
 *
 * Keys (per user):
 *  skillup.part1.claimed.<uid>  → ClaimedSkill[]
 *  skillup.part1.results.<uid>   → AssessmentResult[]
 *  skillup.part1.gaps.<uid>      → SkillGap[] (with chosen target levels)
 *  skillup.part1.resume.<uid>    → ResumeDoc
 *  skillup.part1.prefs.<uid>     → { targetRoleId, goals }
 */
import type {
  AssessmentResult,
  ClaimedSkill,
  ID,
  SkillGap,
  SkillGraph,
  SkillLevel,
  SkillNode,
} from '@/types';
import { storage, uid } from '@/lib/utils';
import {
  LEVEL_INDEX,
  TARGET_ROLES,
  levelFromScore,
  skillById,
} from '../data/catalog';

export interface ResumeDoc {
  summary: string;
  experience: string;
  education: string;
  links: string;
  rawText: string;
  updatedAt: string;
}

export interface Part1Prefs {
  targetRoleId: string;
  goals: string;
}

const K = {
  claimed: (u: string) => `skillup.part1.claimed.${u}`,
  results: (u: string) => `skillup.part1.results.${u}`,
  gaps: (u: string) => `skillup.part1.gaps.${u}`,
  resume: (u: string) => `skillup.part1.resume.${u}`,
  prefs: (u: string) => `skillup.part1.prefs.${u}`,
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

export function currentUserId(): string {
  try {
    const raw = storage.get('skillup.user');
    if (raw) return (JSON.parse(raw) as { id: string }).id || 'u_demo';
  } catch {
    /* ignore */
  }
  return 'u_demo';
}

/* ── Claimed skills ─────────────────────────────── */
export function getClaimed(userId: string = currentUserId()): ClaimedSkill[] {
  return read<ClaimedSkill[]>(K.claimed(userId), []);
}

export function addClaimed(
  skillId: string,
  selfLevel: SkillLevel,
  yearsExperience = 0,
  userId: string = currentUserId(),
): ClaimedSkill {
  const list = getClaimed(userId);
  const existing = list.find((c) => c.skillId === skillId);
  if (existing) {
    existing.selfLevel = selfLevel;
    existing.yearsExperience = yearsExperience;
    write(K.claimed(userId), list);
    return existing;
  }
  const item: ClaimedSkill = {
    id: uid('cs'),
    userId,
    skillId,
    skill: skillById(skillId),
    selfLevel,
    yearsExperience,
    status: 'claimed',
    createdAt: new Date().toISOString(),
  };
  write(K.claimed(userId), [...list, item]);
  return item;
}

export function removeClaimed(id: string, userId: string = currentUserId()): void {
  write(
    K.claimed(userId),
    getClaimed(userId).filter((c) => c.id !== id),
  );
}

export function seedStarterSkills(userId: string = currentUserId()): ClaimedSkill[] {
  const starter: [string, SkillLevel, number][] = [
    ['sk_js', 'intermediate', 1],
    ['sk_react', 'beginner', 0],
    ['sk_git', 'intermediate', 1],
  ];
  starter.forEach(([s, l, y]) => addClaimed(s, l, y, userId));
  refreshGaps(userId);
  return getClaimed(userId);
}

/* ── Assessment results ─────────────────────────── */
export function getResults(userId: string = currentUserId()): AssessmentResult[] {
  return read<AssessmentResult[]>(K.results(userId), []);
}

export function latestResultForSkill(
  skillId: string,
  userId: string = currentUserId(),
): AssessmentResult | undefined {
  return getResults(userId)
    .filter((r) => r.skillId === skillId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

export function saveResult(
  input: Omit<AssessmentResult, 'id' | 'userId' | 'completedAt' | 'level'> & { score: number },
  userId: string = currentUserId(),
): AssessmentResult {
  const item: AssessmentResult = {
    ...input,
    id: uid('ar'),
    userId,
    level: levelFromScore(input.score),
    completedAt: new Date().toISOString(),
  };
  write(K.results(userId), [...getResults(userId), item]);

  // Mark claimed skill assessed
  const claimed = getClaimed(userId);
  const match = claimed.find((c) => c.skillId === item.skillId);
  if (match) {
    match.status = 'assessed';
    write(K.claimed(userId), claimed);
  }
  refreshGaps(userId);
  return item;
}

/** Effective level = assessed level if present, else self-claimed level. */
export function effectiveLevel(
  skillId: string,
  userId: string = currentUserId(),
): { level: SkillLevel; assessed: boolean } {
  const r = latestResultForSkill(skillId, userId);
  if (r) return { level: r.level, assessed: true };
  const c = getClaimed(userId).find((x) => x.skillId === skillId);
  return { level: c?.selfLevel ?? 'beginner', assessed: false };
}

/* ── Resume ─────────────────────────────────────── */
export function getResume(userId: string = currentUserId()): ResumeDoc {
  return read<ResumeDoc>(K.resume(userId), {
    summary: '',
    experience: '',
    education: '',
    links: '',
    rawText: '',
    updatedAt: '',
  });
}

export function saveResume(doc: Omit<ResumeDoc, 'updatedAt'>, userId: string = currentUserId()): ResumeDoc {
  const full: ResumeDoc = { ...doc, updatedAt: new Date().toISOString() };
  write(K.resume(userId), full);
  return full;
}

/* ── Prefs (target role + goals) ────────────────── */
export function getPrefs(userId: string = currentUserId()): Part1Prefs {
  return read<Part1Prefs>(K.prefs(userId), { targetRoleId: 'role_frontend', goals: '' });
}

export function savePrefs(p: Part1Prefs, userId: string = currentUserId()): void {
  write(K.prefs(userId), p);
  refreshGaps(userId);
}

/* ── Gaps (computed + target overrides) ─────────── */
export function getGaps(userId: string = currentUserId()): SkillGap[] {
  return read<SkillGap[]>(K.gaps(userId), []);
}

export function setGapTarget(
  skillId: string,
  targetLevel: SkillLevel,
  userId: string = currentUserId(),
): void {
  const gaps = getGaps(userId);
  const g = gaps.find((x) => x.skillId === skillId);
  if (g) {
    g.targetLevel = targetLevel;
    g.gapScore = Math.max(0, (LEVEL_INDEX[targetLevel] - LEVEL_INDEX[g.currentLevel]) * 34);
    write(K.gaps(userId), gaps);
  }
}

/** Recompute gaps from claimed + results + target role. Preserves manual target overrides. */
export function refreshGaps(userId: string = currentUserId()): SkillGap[] {
  const prefs = getPrefs(userId);
  const role = TARGET_ROLES.find((r) => r.id === prefs.targetRoleId) ?? TARGET_ROLES[0];
  const prev = new Map(getGaps(userId).map((g) => [g.skillId, g.targetLevel]));
  const claimed = getClaimed(userId);

  const skillIds = new Set<string>([
    ...role.requiredSkills.map((r) => r.skillId),
    ...claimed.map((c) => c.skillId),
  ]);

  const gaps: SkillGap[] = [...skillIds].map((skillId) => {
    const { level } = effectiveLevel(skillId, userId);
    const roleReq = role.requiredSkills.find((r) => r.skillId === skillId);
    const target: SkillLevel = prev.get(skillId) ?? roleReq?.minLevel ?? 'advanced';
    return {
      id: `gap_${skillId}`,
      userId,
      skillId,
      skill: skillById(skillId),
      currentLevel: level,
      targetLevel: target,
      gapScore: Math.max(0, (LEVEL_INDEX[target] - LEVEL_INDEX[level]) * 34),
      recommendedAction: `Assess, then learn ${skillById(skillId)?.name ?? skillId}`,
    };
  });

  write(K.gaps(userId), gaps);
  return gaps;
}

/* ── Graph ──────────────────────────────────────── */
export function buildGraph(userId: string = currentUserId()): SkillGraph {
  const claimed = getClaimed(userId);
  const nodes: SkillNode[] = claimed.map((c) => {
    const s = skillById(c.skillId);
    const { level, assessed } = effectiveLevel(c.skillId, userId);
    return {
      id: c.skillId,
      name: s?.name ?? c.skillId,
      slug: s?.slug ?? c.skillId,
      category: s?.category ?? 'Other',
      level,
      status: assessed ? 'assessed' : 'claimed',
      children: [],
    };
  });
  // Edges: link skills that share a category (keeps graph connected & truthful).
  const edges: SkillGraph['edges'] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].category === nodes[j].category) {
        edges.push({ from: nodes[i].id, to: nodes[j].id, label: nodes[i].category });
      }
    }
  }
  return { userId, nodes, edges };
}

/* ── Recommendations (rule-based, Part 1 slice) ─── */
export interface Part1Recommendation {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}

export function getRecommendations(userId: string = currentUserId()): Part1Recommendation[] {
  const gaps = [...getGaps(userId)].sort((a, b) => b.gapScore - a.gapScore);
  const recs: Part1Recommendation[] = [];

  const top = gaps.find((g) => g.gapScore > 0);
  if (top) {
    recs.push({
      id: 'rec_assess_top_gap',
      title: `Close your biggest gap: ${top.skill?.name}`,
      body: `You're ${top.currentLevel}, targeting ${top.targetLevel}. Take the assessment, then follow the learning path.`,
      actionLabel: 'Assess now',
      actionTo: `/skills/assessment/as_${top.skill?.slug}`,
    });
  }

  const unassessed = getClaimed(userId).filter(
    (c) => !latestResultForSkill(c.skillId, userId),
  )[0];
  if (unassessed) {
    const s = skillById(unassessed.skillId);
    recs.push({
      id: 'rec_assess_claimed',
      title: `Verify your claim: ${s?.name}`,
      body: 'Turn a self-claimed skill into an assessed skill employers trust.',
      actionLabel: 'Start assessment',
      actionTo: `/skills/assessment/as_${s?.slug}`,
    });
  }

  const resume = getResume(userId);
  if (!resume.summary) {
    recs.push({
      id: 'rec_resume',
      title: 'Strengthen your resume',
      body: 'Add a summary and experience on My Skills so readiness reflects real proof.',
      actionLabel: 'Update resume',
      actionTo: '/skills',
    });
  }

  return recs.slice(0, 3);
}

/* ── Dashboard stats ────────────────────────────── */
export function getStats(userId: string = currentUserId()): {
  claimed: number;
  assessed: number;
  avgScore: number;
  openGaps: number;
  readiness: number;
} {
  const claimed = getClaimed(userId).length;
  const results = getResults(userId);
  const assessedSkills = new Set(results.map((r) => r.skillId)).size;
  const avgScore = results.length
    ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
    : 0;
  const openGaps = getGaps(userId).filter((g) => g.gapScore > 0).length;
  const readiness = claimed === 0 ? 0 : Math.round((assessedSkills / Math.max(1, claimed)) * 60 + (avgScore / 100) * 40);
  return { claimed, assessed: assessedSkills, avgScore, openGaps, readiness };
}

export type { ID };
