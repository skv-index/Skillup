# SKILLUP — Common Foundation ✅

Shared by Parts 1/2/3. Created once — parts work inside their own feature folders.

## What's included

**Design System** (`src/styles/tokens.css`, `src/styles/globals.css`, `src/theme/`, `src/components/ui/`)
- Palette, typography (Inter), font sizes, spacing (4px), radius, shadows
- Buttons, Inputs, Textarea, Selects, Cards, Modals, Tabs, Badges, Progress bars, Tables, Dropdowns
- Loading states (`Loading`, `LoadingBlock`, `spinner`, `skeleton`), Error states (`ErrorState`, `Alert`), Empty states (`EmptyState`)
- Icons (`Icons.*`) — no external icon lib

**App Structure** (`src/app/`, `src/components/layout/`, `src/lib/`, `src/types/`)
- Global CSS + theme (light/dark via `document.documentElement.dataset.theme`)
- Layout: `AppLayout` + `Sidebar` + `Header`, responsive (drawer < 1024px)
- Routing: all 30 paths in `src/app/paths.ts`, wired in `src/app/router.tsx` (placeholders until parts implement)
- API client: `api.get/post/put/patch/del` in `src/lib/api-client.ts` (`VITE_API_URL`)
- Auth state: `AuthProvider` + `useAuth()` (`login/register/logout`, demo fallback)
- Types: integration contract in `src/types/models.ts` (`User, Skill, Assessment, SkillGap, LearningProgress, Challenge, Evaluation, VerifiedSkill, CareerReadiness, Opportunity…`)
- Utils: `cn, initials, formatDate, uid, clamp, debounce, storage`

## Run

```powershell
npm install
npm run dev      # http://localhost:5173
npm run typecheck
npm run build
```

Set backend URL in `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

## Ownership rule

```
src/features/part1-user-skill-intelligence/  → Part 1 (Claimed → Assessed → Gap)
src/features/part2-learning-challenges-verification/ → Part 2 (Gap → Learning → Verified)
src/features/part3-career-opportunities-admin/ → Part 3 (Verified → Career → Opportunity)
```

To implement a page: build it in its feature folder, then swap the `PlaceholderPage` in `src/app/router.tsx` for the real component — keep the same `paths.*` route.
