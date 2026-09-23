/**
 * Single source of truth for all 30 routes.
 * Parts must import from here — never hard-code path strings.
 */
export const paths = {
  // Public — Part 1
  landing: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',

  // Part 1 — User Profile & Skill Intelligence
  dashboard: '/dashboard',
  mySkills: '/skills',
  assessment: '/skills/assessment/:assessmentId',
  assessmentResult: '/skills/assessment/:assessmentId/result',
  skillGraph: '/skills/graph',
  skillGap: '/skills/gap',

  // Part 2 — Learning, Challenges & Verification
  learning: '/learn',
  learningContent: '/learn/:contentId',
  challenges: '/challenges',
  challengeDetails: '/challenges/:challengeId',
  challengeSubmission: '/challenges/:challengeId/submit',
  evaluationResult: '/challenges/:challengeId/result',
  verifiedSkills: '/verified',
  verifiedSkillDetails: '/verified/:verifiedSkillId',

  // Part 3 — Career, Opportunities & Admin
  career: '/career',
  jobs: '/jobs',
  jobDetails: '/jobs/:opportunityId',
  profile: '/profile',
  settings: '/settings',

  admin: '/admin',
  adminSkills: '/admin/skills',
  adminAssessments: '/admin/assessments',
  adminChallenges: '/admin/challenges',
  adminVerification: '/admin/verification',
  adminJobs: '/admin/jobs',
  adminAnalytics: '/admin/analytics',

  notFound: '*',
} as const;
