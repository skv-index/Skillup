/**
 * Part 3 store — consumes Parts 1+2, produces CareerReadiness + OpportunityMatch.
 * Also owns: Notification state, saved jobs, admin-managed opportunities.
 *
 * Keys (per user unless noted):
 *  skillup.part3.notifications.<uid> → Notification[]
 *  skillup.part3.saved.<uid>         → string[] (opportunityIds)
 *  skillup.part3.custom-opps        → Opportunity[] (global, admin-added)
 *  skillup.part3.prefs.<uid>        → { emailNotifs, weeklyDigest }
 */
import type {
  CareerReadiness,
  Notification,
  Opportunity,
  OpportunityMatch,
} from '@/types';
import { storage, uid } from '@/lib/utils';
import { OPPORTUNITIES } from '../data/opportunities';
// Read-only consumption of Parts 1+2 (integration contract):
import {
  currentUserId as part1User,
  effectiveLevel,
  getClaimed,
  getGaps,
  getResume,
  getResults,
} from '@/features/part1-user-skill-intelligence/services/part1-store';
import { LEVEL_INDEX } from '@/features/part1-user-skill-intelligence/data/catalog';
import {
  allProgress,
  getEvaluations,
  getVerified,
} from '@/features/part2-learning-challenges-verification/services/part2-store';

export const currentUser = part1User;

const K = {
  notifications: (u: string) => `skillup.part3.notifications.${u}`,
  saved: (u: string) => `skillup.part3.saved.${u}`,
  customOpps: 'skillup.part3.custom-opps',
  prefs: (u: string) => `skillup.part3.prefs.${u}`,
  seeded: (u: string) => `skillup.part3.seeded.${u}`,
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

/* ── Opportunities (static + admin-added) ───────── */
export function allOpportunities(): Opportunity[] {
  return [...read<Opportunity[]>(K.customOpps, []), ...OPPORTUNITIES];
}

export function getOpportunity(id: string): Opportunity | undefined {
  return allOpportunities().find((o) => o.id === id);
}

export function addOpportunity(input: Omit<Opportunity, 'id' | 'postedAt'>): Opportunity {
  const item: Opportunity = { ...input, id: uid('opp'), postedAt: new Date().toISOString() };
  write(K.customOpps, [item, ...read<Opportunity[]>(K.customOpps, [])]);
  return item;
}

export function removeCustomOpportunity(id: string): void {
  write(
    K.customOpps,
    read<Opportunity[]>(K.customOpps, []).filter((o) => o.id !== id),
  );
}

/* ── Matching ───────────────────────────────────── */
function levelScore(skillId: string, minLevel: keyof typeof LEVEL_INDEX, userId: string): { pts: number; state: 'verified' | 'assessed' | 'claimed' | 'missing' } {
  const verified = getVerified(userId).find((v) => v.skillId === skillId);
  if (verified) {
    return {
      pts: LEVEL_INDEX[verified.level] >= LEVEL_INDEX[minLevel] ? 100 : 60,
      state: 'verified',
    };
  }
  const { level, assessed } = effectiveLevel(skillId, userId);
  if (assessed) {
    return { pts: LEVEL_INDEX[level] >= LEVEL_INDEX[minLevel] ? 75 : 40, state: 'assessed' };
  }
  const claimed = getClaimed(userId).some((c) => c.skillId === skillId);
  if (claimed) {
    return { pts: LEVEL_INDEX[level] >= LEVEL_INDEX[minLevel] ? 35 : 15, state: 'claimed' };
  }
  return { pts: 0, state: 'missing' };
}

export function matchFor(opportunity: Opportunity, userId: string = currentUser()): OpportunityMatch {
  const reqs = opportunity.requiredSkills;
  const per = reqs.map((r) => levelScore(r.skillId, r.minLevel, userId));
  const matchScore = reqs.length === 0 ? 0 : Math.round(per.reduce((a, p) => a + p.pts, 0) / reqs.length);
  return {
    opportunityId: opportunity.id,
    opportunity,
    matchScore,
    matchedSkills: reqs.filter((_, i) => per[i].pts >= 35).map((r) => r.skillId),
    missingSkills: reqs.filter((_, i) => per[i].pts < 35).map((r) => r.skillId),
  };
}

export function matchAll(userId: string = currentUser()): OpportunityMatch[] {
  return allOpportunities()
    .map((o) => matchFor(o, userId))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/* ── Career readiness ───────────────────────────── */
export function careerReadiness(userId: string = currentUser()): CareerReadiness {
  const claimed = getClaimed(userId);
  const results = getResults(userId);
  const assessedSkills = new Set(results.map((r) => r.skillId)).size;
  const verified = getVerified(userId);
  const gaps = getGaps(userId);
  const openGaps = gaps.filter((g) => g.gapScore > 0).length;
  const gapsClosed = gaps.filter((g) => g.gapScore === 0).length;
  const progress = allProgress(userId);
  const lessonsTotal = progress.reduce((a, p) => a + p.totalLessons, 0);
  const lessonsDone = progress.reduce((a, p) => a + p.completedLessons, 0);
  const resume = getResume(userId);
  const evals = getEvaluations(userId);
  const passedChallenges = new Set(evals.filter((e) => e.passed).map((e) => e.challengeId)).size;

  const checklist = [
    { label: 'Complete onboarding', done: claimed.length > 0 },
    { label: 'Take your first assessment', done: results.length > 0 },
    { label: 'Finish 5 lessons', done: lessonsDone >= 5 },
    { label: 'Pass a challenge', done: passedChallenges > 0 },
    { label: 'Verify a skill', done: verified.length > 0 },
    { label: 'Add a resume summary', done: resume.summary.trim().length > 0 },
    { label: 'Close all skill gaps', done: gaps.length > 0 && openGaps === 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const score = Math.round(
    Math.min(40, verified.length * 13) + // verified skills (max 40)
      Math.min(20, assessedSkills * 7) + // assessed breadth (max 20)
      (lessonsTotal === 0 ? 0 : Math.min(20, (lessonsDone / lessonsTotal) * 20)) + // learning (max 20)
      Math.min(10, passedChallenges * 5) + // challenges (max 10)
      (doneCount / checklist.length) * 10, // checklist (max 10)
  );

  return {
    userId,
    score: Math.min(100, score),
    verifiedCount: verified.length,
    totalSkills: claimed.length,
    gapsClosed,
    checklist,
  };
}

/* ── Recommendations (Part 3 slice) ─────────────── */
export interface Part3Recommendation {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}

export function getPart3Recommendations(userId: string = currentUser()): Part3Recommendation[] {
  const recs: Part3Recommendation[] = [];
  const readiness = careerReadiness(userId);
  const matches = matchAll(userId);
  const best = matches[0];

  if (best && best.missingSkills.length > 0) {
    recs.push({
      id: 'rec_close_for_job',
      title: `Closest role: ${best.opportunity?.title} (${best.matchScore}%)`,
      body: `Missing: ${best.missingSkills.slice(0, 3).join(', ').replace(/sk_/g, '')}. Close one gap to jump 10–25 points.`,
      actionLabel: 'View role',
      actionTo: `/jobs/${best.opportunityId}`,
    });
  }
  const nextCheck = readiness.checklist.find((c) => !c.done);
  if (nextCheck) {
    recs.push({
      id: 'rec_checklist',
      title: `Next step: ${nextCheck.label}`,
      body: `Readiness is ${readiness.score}/100 — each checklist item moves real opportunities closer.`,
      actionLabel: 'Open readiness',
      actionTo: '/career',
    });
  }
  if (readiness.verifiedCount === 0) {
    recs.push({
      id: 'rec_verify_first',
      title: 'Earn your first verification',
      body: 'Verified skills weigh most in matching. Pass any challenge to get one.',
      actionLabel: 'Browse challenges',
      actionTo: '/challenges',
    });
  }
  return recs.slice(0, 3);
}

/* ── Saved jobs ─────────────────────────────────── */
export function savedIds(userId: string = currentUser()): string[] {
  return read<string[]>(K.saved(userId), []);
}

export function toggleSaved(opportunityId: string, userId: string = currentUser()): string[] {
  const set = new Set(savedIds(userId));
  if (set.has(opportunityId)) set.delete(opportunityId);
  else set.add(opportunityId);
  const arr = [...set];
  write(K.saved(userId), arr);
  return arr;
}

/* ── Notifications (owned by Part 3) ────────────── */
function seedFromState(userId: string): Notification[] {
  const items: Notification[] = [
    {
      id: uid('n'),
      userId,
      title: 'Welcome to SkillUp 🎉',
      body: 'Claim skills, take assessments, and watch your career readiness grow.',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];
  const verified = getVerified(userId);
  if (verified.length > 0) {
    items.push({
      id: uid('n'),
      userId,
      title: `${verified.length} skill${verified.length > 1 ? 's' : ''} verified`,
      body: 'Your credentials are live — check which jobs they unlock.',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  const openGaps = getGaps(userId).filter((g) => g.gapScore > 0).length;
  if (openGaps > 0) {
    items.push({
      id: uid('n'),
      userId,
      title: `${openGaps} open skill gaps`,
      body: 'Your learning list is ordered by biggest gap first.',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  return items;
}

export function getNotifications(userId: string = currentUser()): Notification[] {
  const stored = read<Notification[] | null>(K.notifications(userId), null);
  if (stored) return stored;
  const seeded = seedFromState(userId);
  write(K.notifications(userId), seeded);
  write(K.seeded(userId), '1');
  return seeded;
}

export function pushNotification(title: string, body: string, userId: string = currentUser()): Notification {
  const item: Notification = { id: uid('n'), userId, title, body, read: false, createdAt: new Date().toISOString() };
  write(K.notifications(userId), [item, ...getNotifications(userId)]);
  return item;
}

export function markRead(id: string, userId: string = currentUser()): void {
  write(
    K.notifications(userId),
    getNotifications(userId).map((n) => (n.id === id ? { ...n, read: true } : n)),
  );
}

export function markAllRead(userId: string = currentUser()): void {
  write(
    K.notifications(userId),
    getNotifications(userId).map((n) => ({ ...n, read: true })),
  );
}

export function unreadCount(userId: string = currentUser()): number {
  return getNotifications(userId).filter((n) => !n.read).length;
}

/* ── Notification prefs ─────────────────────────── */
export interface NotifPrefs {
  emailNotifs: boolean;
  weeklyDigest: boolean;
}

export function getNotifPrefs(userId: string = currentUser()): NotifPrefs {
  return read<NotifPrefs>(K.prefs(userId), { emailNotifs: true, weeklyDigest: true });
}

export function saveNotifPrefs(p: NotifPrefs, userId: string = currentUser()): void {
  write(K.prefs(userId), p);
}

/* ── Admin aggregates (local demo data) ─────────── */
export function adminOverview(userId: string = currentUser()): {
  claimed: number;
  assessmentsTaken: number;
  lessonsDone: number;
  lessonsTotal: number;
  evaluations: number;
  passedChallenges: number;
  verified: number;
  opportunities: number;
  readiness: number;
} {
  const s = {
    claimed: getClaimed(userId).length,
    assessmentsTaken: getResults(userId).length,
    lessonsDone: 0,
    lessonsTotal: 0,
    evaluations: getEvaluations(userId).length,
    passedChallenges: 0,
    verified: getVerified(userId).length,
    opportunities: allOpportunities().length,
    readiness: careerReadiness(userId).score,
  };
  const prog = allProgress(userId);
  s.lessonsDone = prog.reduce((a, p) => a + p.completedLessons, 0);
  s.lessonsTotal = prog.reduce((a, p) => a + p.totalLessons, 0);
  s.passedChallenges = new Set(
    getEvaluations(userId).filter((e) => e.passed).map((e) => e.challengeId),
  ).size;
  return s;
}
