/**
 * SKILLUP — Shared data models (Integration Contract).
 * All three parts MUST use these types. Extend, don't duplicate.
 *
 * Flow:
 * PART1: ClaimedSkill → AssessmentResult → SkillGap (+ SkillGraph)
 * PART2: LearningProgress → Challenge → Evaluation → VerifiedSkill
 * PART3: CareerReadiness → OpportunityMatch
 */

export type ID = string;

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillStatus = 'claimed' | 'assessed' | 'learning' | 'demonstrated' | 'verified';
export type UserRole = 'learner' | 'admin';

// ── User ──────────────────────────────────────────
export interface User {
  id: ID;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

// ── Skill ─────────────────────────────────────────
export interface Skill {
  id: ID;
  name: string;
  slug: string;
  category: string;
  description?: string;
}

/** Part 1 produces */
export interface ClaimedSkill {
  id: ID;
  userId: ID;
  skillId: ID;
  skill?: Skill;
  selfLevel: SkillLevel;
  yearsExperience?: number;
  status: SkillStatus;
  createdAt: string;
}

export interface Assessment {
  id: ID;
  skillId: ID;
  title: string;
  questionCount: number;
  durationMinutes: number;
}

/** Part 1 produces */
export interface AssessmentResult {
  id: ID;
  userId: ID;
  assessmentId: ID;
  skillId: ID;
  score: number; // 0-100
  level: SkillLevel;
  strengths: string[];
  weaknesses: string[];
  completedAt: string;
}

export interface SkillNode extends Skill {
  level?: SkillLevel;
  status?: SkillStatus;
  children?: ID[];
}

/** Part 1 produces */
export interface SkillGraph {
  userId: ID;
  nodes: SkillNode[];
  edges: { from: ID; to: ID; label?: string }[];
}

/** Part 1 produces */
export interface SkillGap {
  id: ID;
  userId: ID;
  skillId: ID;
  skill?: Skill;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  gapScore: number; // 0-100, higher = bigger gap
  recommendedAction?: string;
}

// ── Part 2 produces ───────────────────────────────
export interface LearningProgress {
  id: ID;
  userId: ID;
  skillId: ID;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  lastAccessedAt?: string;
}

export interface Challenge {
  id: ID;
  title: string;
  description: string;
  skillIds: ID[];
  difficulty: SkillLevel;
  points: number;
  deadline?: string;
}

export interface Evaluation {
  id: ID;
  userId: ID;
  challengeId: ID;
  score: number;
  feedback: string;
  passed: boolean;
  evaluatedAt: string;
}

export interface VerifiedSkill {
  id: ID;
  userId: ID;
  skillId: ID;
  skill?: Skill;
  level: SkillLevel;
  evaluationId?: ID;
  verifiedAt: string;
  credentialUrl?: string;
}

// ── Part 3 produces ───────────────────────────────
export interface CareerReadiness {
  userId: ID;
  score: number; // 0-100
  verifiedCount: number;
  totalSkills: number;
  gapsClosed: number;
  checklist: { label: string; done: boolean }[];
}

export interface Opportunity {
  id: ID;
  title: string;
  company: string;
  type: 'job' | 'internship';
  location: string;
  remote: boolean;
  requiredSkills: { skillId: ID; minLevel: SkillLevel }[];
  description: string;
  postedAt: string;
}

export interface OpportunityMatch {
  opportunityId: ID;
  opportunity?: Opportunity;
  matchScore: number; // 0-100
  matchedSkills: ID[];
  missingSkills: ID[];
}

export interface Notification {
  id: ID;
  userId: ID;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ── Shared envelopes ──────────────────────────────
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
