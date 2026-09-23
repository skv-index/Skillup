# PART 2 — Learning, Challenges & Verification

**Owns:** Learning · Challenge · Performance Evaluation · Skill Verification

**Flow responsibility:** `Skill Gap → Learning → Demonstrated Skill → Verified Skill`

## Pages to build here (keep paths in `src/app/paths.ts`)

| Page | Route | Modules |
|---|---|---|
| Learning | `/learn` | Learning, Skill Gap Analysis, Recommendation, Progress Tracking |
| Learning Content | `/learn/:contentId` | Learning, Progress Tracking |
| Challenges | `/challenges` | Challenge, Recommendation, Progress Tracking |
| Challenge Details | `/challenges/:challengeId` | Challenge, Skill Management |
| Challenge Submission | `/challenges/:challengeId/submit` | Challenge, Performance Evaluation, Progress Tracking |
| Evaluation Result | `/challenges/:challengeId/result` | Performance Evaluation, Challenge, Skill Management, Recommendation |
| Verified Skills | `/verified` | Skill Verification, Skill Management, Performance Evaluation, Progress Tracking |
| Verified Skill Details | `/verified/:verifiedSkillId` | Skill Verification, Skill Management, Performance Evaluation |

## Consumes (from Part 1) → Produces (for Part 3)

Consumes: `SkillGap`, `AssessmentResult`, `ClaimedSkill`.
Produces: `LearningProgress`, `Challenge`, `Evaluation`, `VerifiedSkill` — types in `src/types/models.ts`.

## Rules

- Work ONLY inside this folder.
- UI: `@/components/ui` only. Data: `api` + `useAuth`. Never hard-code routes — import `paths`.
