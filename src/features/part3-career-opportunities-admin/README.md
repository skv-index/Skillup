# PART 3 — Career, Opportunities & Admin

**Owns:** Career Readiness · Job/Internship Matching · Recommendation · Progress Tracking · Notification · Admin

**Flow responsibility:** `Verified Skill → Career Readiness → Opportunity`

## Pages to build here (keep paths in `src/app/paths.ts`)

| Page | Route | Modules |
|---|---|---|
| Career Readiness | `/career` | Career Readiness, Skill Management, Skill Verification, Progress Tracking, Recommendation |
| Jobs & Internships | `/jobs` | Job/Internship Matching, Skill Management, Skill Verification, Career Readiness, Recommendation |
| Job Details | `/jobs/:opportunityId` | Job/Internship Matching, Skill Management, Skill Verification, Career Readiness |
| Profile | `/profile` | User Profile, Skill Management, Skill Verification, Career Readiness, Progress Tracking |
| Settings | `/settings` | Authentication, User Profile, Notification |
| Admin Dashboard | `/admin` | Admin, User Profile, Progress Tracking, Notification |
| Admin Skills | `/admin/skills` | Admin, Skill Management, Skill Graph |
| Admin Assessments | `/admin/assessments` | Admin, AI Skill Assessment |
| Admin Challenges | `/admin/challenges` | Admin, Challenge, Performance Evaluation |
| Admin Verification | `/admin/verification` | Admin, Skill Verification, Performance Evaluation |
| Admin Jobs | `/admin/jobs` | Admin, Job/Internship Matching |
| Admin Analytics | `/admin/analytics` | Admin, Progress Tracking |

## Consumes (from Parts 1+2) → Produces

Consumes: `VerifiedSkill`, `LearningProgress`, `Evaluation`, `SkillGap`.
Produces: `CareerReadiness`, `OpportunityMatch` — types in `src/types/models.ts`.

## Rules

- Work ONLY inside this folder.
- Admin pages live under `/admin/*` inside `AppLayout`. Guard with `user.role === 'admin'` (add guard in `router.tsx` when backend ready).
