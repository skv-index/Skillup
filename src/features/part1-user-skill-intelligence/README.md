# PART 1 — User Profile & Skill Intelligence

**Owns:** Authentication · User Profile · Resume · Skill Management · AI Skill Assessment · Skill Graph · Skill Gap Analysis

**Flow responsibility:** `Claimed Skill → Assessed Skill → Skill Gap`

## Pages to build here (keep paths in `src/app/paths.ts`)

| Page | Route | Modules |
|---|---|---|
| Landing | `/` | Authentication, User Profile |
| Login | `/login` | Authentication |
| Register | `/register` | Authentication |
| Onboarding | `/onboarding` | User Profile, Skill Management, Resume |
| Dashboard | `/dashboard` | User Profile, Skill Management, Career Readiness, Progress Tracking, Recommendation, Notification |
| My Skills | `/skills` | Skill Management, Resume, AI Skill Assessment, Skill Verification, Progress Tracking |
| Skill Assessment | `/skills/assessment/:assessmentId` | AI Skill Assessment, Skill Management, Progress Tracking |
| Assessment Result | `/skills/assessment/:assessmentId/result` | AI Skill Assessment, Skill Management, Recommendation, Progress Tracking |
| Skill Graph | `/skills/graph` | Skill Graph, Skill Management |
| Skill Gap Analysis | `/skills/gap` | Skill Gap Analysis, Skill Management, Recommendation, Progress Tracking |

## Produces (for Part 2)

`User`, `ClaimedSkill`, `AssessmentResult`, `SkillGraph`, `SkillGap` — types in `src/types/models.ts`.

## Rules

- Work ONLY inside this folder: `pages/`, `components/`, `hooks/`, `services/`.
- UI: import from `@/components/ui`. Tokens: `var(--...)`. No new button/input styles.
- Data: use `api` from `@/lib/api-client`, auth from `@/lib/auth-context`.
- To wire a page: replace its `PlaceholderPage` in `src/app/router.tsx` with your page, same path.
