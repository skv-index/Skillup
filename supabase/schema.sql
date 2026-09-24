-- ============================================================================
-- SKILLUP — Supabase schema
-- Mirrors the integration contract in src/types/models.ts (camelCase TS -> snake_case SQL).
-- Flow: ClaimedSkill -> AssessmentResult -> SkillGap -> LearningProgress
--       -> Challenge -> Evaluation -> VerifiedSkill -> CareerReadiness -> Opportunity
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'skill_level') then
    create type public.skill_level as enum ('beginner','intermediate','advanced','expert');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'skill_status') then
    create type public.skill_status as enum ('claimed','assessed','learning','demonstrated','verified');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('learner','admin');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'opportunity_type') then
    create type public.opportunity_type as enum ('job','internship');
  end if;
end $$;

-- ── User profile (extends auth.users) ───────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  name                 text not null,
  avatar_url           text,
  role                 public.user_role not null default 'learner',
  headline             text,
  bio                  text,
  location             text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- ── Skill catalog ───────────────────────────────────────────────────────────
create table if not exists public.skills (
  id          text primary key,
  name        text not null,
  slug        text not null unique,
  category    text not null,
  description text
);

-- ── Assessments ─────────────────────────────────────────────────────────────
create table if not exists public.assessments (
  id              text primary key,
  skill_id        text not null references public.skills (id),
  title           text not null,
  question_count  int  not null default 5,
  duration_minutes int not null default 10
);

-- ── Claimed skills (Part 1) ────────────────────────────────────────────────
create table if not exists public.claimed_skills (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  skill_id         text not null references public.skills (id),
  self_level       public.skill_level not null default 'beginner',
  years_experience numeric not null default 0,
  status           public.skill_status not null default 'claimed',
  created_at       timestamptz not null default now(),
  unique (user_id, skill_id)
);

-- ── Assessment results (Part 1) ─────────────────────────────────────────────
create table if not exists public.assessment_results (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  assessment_id text not null references public.assessments (id),
  skill_id      text not null references public.skills (id),
  score         int  not null check (score between 0 and 100),
  level         public.skill_level not null,
  strengths     jsonb not null default '[]'::jsonb,
  weaknesses    jsonb not null default '[]'::jsonb,
  completed_at  timestamptz not null default now()
);

-- ── Skill gaps (Part 1) ─────────────────────────────────────────────────────
create table if not exists public.skill_gaps (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  skill_id          text not null references public.skills (id),
  current_level     public.skill_level not null,
  target_level      public.skill_level not null,
  gap_score         int  not null default 0 check (gap_score between 0 and 100),
  recommended_action text,
  unique (user_id, skill_id)
);

-- ── Learning progress (Part 2) ──────────────────────────────────────────────
create table if not exists public.learning_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  skill_id         text not null references public.skills (id),
  completed_lessons int not null default 0,
  total_lessons    int not null default 0,
  percent          numeric not null default 0,
  last_accessed_at timestamptz,
  unique (user_id, skill_id)
);

-- ── Challenges (Part 2, catalog) ────────────────────────────────────────────
create table if not exists public.challenges (
  id                text primary key,
  title             text not null,
  description       text not null,
  skill_ids         jsonb not null default '[]'::jsonb,
  difficulty        public.skill_level not null default 'intermediate',
  points            int not null default 0,
  deadline          timestamptz,
  tasks             jsonb not null default '[]'::jsonb,
  checklist         jsonb not null default '[]'::jsonb
);

-- ── Evaluations (Part 2) ────────────────────────────────────────────────────
create table if not exists public.evaluations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  challenge_id text not null references public.challenges (id),
  score        int  not null check (score between 0 and 100),
  feedback     text,
  passed       boolean not null default false,
  evaluated_at timestamptz not null default now()
);

-- ── Verified skills (Part 2) ────────────────────────────────────────────────
create table if not exists public.verified_skills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  skill_id      text not null references public.skills (id),
  level         public.skill_level not null,
  evaluation_id uuid references public.evaluations (id),
  verified_at   timestamptz not null default now(),
  credential_url text,
  unique (user_id, skill_id)
);

-- ── Career readiness (Part 3) ───────────────────────────────────────────────
create table if not exists public.career_readiness (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  score         int not null default 0,
  verified_count int not null default 0,
  total_skills  int not null default 0,
  gaps_closed   int not null default 0,
  checklist     jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ── Opportunities (Part 3, catalog) ─────────────────────────────────────────
create table if not exists public.opportunities (
  id              text primary key,
  title           text not null,
  company         text not null,
  type            public.opportunity_type not null default 'job',
  location        text not null,
  remote          boolean not null default false,
  required_skills jsonb not null default '[]'::jsonb,
  description     text,
  posted_at       timestamptz not null default now()
);

-- ── Notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Indexes (foreign-key lookups) ───────────────────────────────────────────
create index if not exists idx_claimed_skills_user    on public.claimed_skills (user_id);
create index if not exists idx_claimed_skills_skill   on public.claimed_skills (skill_id);
create index if not exists idx_results_user           on public.assessment_results (user_id);
create index if not exists idx_results_skill          on public.assessment_results (skill_id);
create index if not exists idx_gaps_user              on public.skill_gaps (user_id);
create index if not exists idx_learning_user          on public.learning_progress (user_id);
create index if not exists idx_evaluations_user       on public.evaluations (user_id);
create index if not exists idx_verified_user          on public.verified_skills (user_id);
create index if not exists idx_notifications_user     on public.notifications (user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.skills            enable row level security;
alter table public.assessments       enable row level security;
alter table public.claimed_skills    enable row level security;
alter table public.assessment_results enable row level security;
alter table public.skill_gaps        enable row level security;
alter table public.learning_progress enable row level security;
alter table public.challenges        enable row level security;
alter table public.evaluations       enable row level security;
alter table public.verified_skills   enable row level security;
alter table public.career_readiness  enable row level security;
alter table public.opportunities     enable row level security;
alter table public.notifications     enable row level security;

-- Reference / catalog tables: anyone may read; only admins may write.
drop policy if exists catalog_read_all on public.skills;
create policy catalog_read_all on public.skills for select using (true);

drop policy if exists catalog_admin_write on public.skills;
create policy catalog_admin_write on public.skills for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists catalog_read_all on public.assessments;
create policy catalog_read_all on public.assessments for select using (true);

drop policy if exists catalog_admin_write on public.assessments;
create policy catalog_admin_write on public.assessments for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists catalog_read_all on public.challenges;
create policy catalog_read_all on public.challenges for select using (true);

drop policy if exists catalog_admin_write on public.challenges;
create policy catalog_admin_write on public.challenges for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists catalog_read_all on public.opportunities;
create policy catalog_read_all on public.opportunities for select using (true);

drop policy if exists catalog_admin_write on public.opportunities;
create policy catalog_admin_write on public.opportunities for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Profile: users may read/update their own row.
drop policy if exists profile_own_all on public.profiles;
create policy profile_own_all on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- User-owned tables: users may CRUD their own rows.
do $$ declare t text; begin
  foreach t in array array[
    'claimed_skills', 'assessment_results', 'skill_gaps', 'learning_progress',
    'evaluations', 'verified_skills', 'career_readiness', 'notifications'
  ] loop
    execute format('drop policy if exists user_own_all on public.%I', t);
    execute format($p$
      create policy user_own_all on public.%I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id)
    $p$, t);
  end loop;
end $$;

-- ============================================================================
-- Seed data (matches src/features/*/data/catalog.ts)
-- ============================================================================
insert into public.skills (id, name, slug, category, description) values
  ('sk_js',      'JavaScript',        'javascript',    'Frontend',        'Core language of the web.'),
  ('sk_ts',      'TypeScript',        'typescript',    'Frontend',        'Typed superset of JavaScript.'),
  ('sk_react',   'React',             'react',         'Frontend',        'UI library for component apps.'),
  ('sk_css',     'CSS & Layout',      'css-layout',    'Frontend',        'Styling, flexbox, grid, responsive.'),
  ('sk_node',    'Node.js',           'nodejs',        'Backend',         'Server-side JavaScript runtime.'),
  ('sk_python',  'Python',            'python',        'Backend',         'General-purpose backend & scripting.'),
  ('sk_sql',     'SQL',               'sql',           'Backend',         'Relational queries & modeling.'),
  ('sk_rest',    'REST APIs',         'rest-apis',     'Backend',         'HTTP API design & integration.'),
  ('sk_git',     'Git & GitHub',      'git-github',    'Tooling',         'Version control & collaboration.'),
  ('sk_testing', 'Testing',           'testing',       'Tooling',         'Unit, integration & e2e testing.'),
  ('sk_dsa',     'Data Structures',   'data-structures','CS Fundamentals','Arrays, maps, trees, graphs.'),
  ('sk_algo',    'Algorithms',        'algorithms',    'CS Fundamentals', 'Complexity, sorting, searching.'),
  ('sk_ui',      'UI Design',         'ui-design',     'Design',          'Visual hierarchy & components.'),
  ('sk_figma',   'Figma',             'figma',         'Design',          'Design & prototyping tool.'),
  ('sk_agile',   'Agile & Scrum',     'agile-scrum',   'Professional',    'Sprints, standups, retros.'),
  ('sk_comm',    'Communication',     'communication', 'Professional',    'Writing & presenting clearly.'),
  ('sk_ml',      'ML Basics',         'ml-basics',     'Data & AI',       'Regression, classification, eval.'),
  ('sk_data',    'Data Analysis',     'data-analysis', 'Data & AI',       'Cleaning, viz & insight.')
on conflict (id) do nothing;

insert into public.assessments (id, skill_id, title, question_count, duration_minutes) values
  ('as_javascript',     'sk_js',      'JavaScript Assessment',    5, 10),
  ('as_typescript',     'sk_ts',      'TypeScript Assessment',    5, 10),
  ('as_react',          'sk_react',   'React Assessment',         5, 10),
  ('as_css-layout',     'sk_css',     'CSS & Layout Assessment',  5, 10),
  ('as_nodejs',         'sk_node',    'Node.js Assessment',       5, 10),
  ('as_python',         'sk_python',  'Python Assessment',        5, 10),
  ('as_sql',            'sk_sql',     'SQL Assessment',           5, 10),
  ('as_rest-apis',      'sk_rest',    'REST APIs Assessment',     5, 10),
  ('as_git-github',     'sk_git',     'Git & GitHub Assessment',  5, 10),
  ('as_testing',        'sk_testing', 'Testing Assessment',       5, 10),
  ('as_data-structures','sk_dsa',     'Data Structures Assessment', 5, 10),
  ('as_algorithms',     'sk_algo',    'Algorithms Assessment',    5, 10)
on conflict (id) do nothing;

insert into public.challenges (id, title, description, skill_ids, difficulty, points, tasks, checklist) values
  ('ch_react_todo', 'Todo App with Filters',
   'Build a React todo app: add, toggle, delete and filter (all/active/done) with localStorage persistence.',
   '["sk_js","sk_react"]', 'intermediate', 100,
   '["Scaffold list + add form","Toggle & delete items","All/Active/Done filter","Persist to localStorage"]',
   '["App renders and adds items","Toggle + delete work","Filter works","Persists after reload"]'),
  ('ch_ts_types', 'Type a Utility Library',
   'Add correct TypeScript types to 5 untyped utility functions including one generic.',
   '["sk_ts"]', 'intermediate', 80,
   '["Type 4 concrete functions","Write 1 generic helper","No `any` leaks"]',
   '["All functions typed","Generic works for 2 types","tsc passes with strict"]'),
  ('ch_css_layout', 'Responsive Landing Clone',
   'Recreate a landing page hero + 3-card grid that collapses cleanly at 900px and 600px.',
   '["sk_css"]', 'advanced', 90,
   '["Hero section","3-card responsive grid","Breakpoints 900/600"]',
   '["Grid collapses at breakpoints","No horizontal scroll on mobile","Spacing system used"]'),
  ('ch_node_api', 'Todos REST API',
   'Build CRUD endpoints for todos with validation and proper status codes.',
   '["sk_node","sk_rest"]', 'advanced', 120,
   '["GET/POST/PATCH/DELETE routes","Input validation","Correct status codes + errors"]',
   '["All CRUD routes work","Validation rejects bad input","404/400 handled"]'),
  ('ch_sql_report', 'Sales Report Query',
   'Write SQL producing monthly revenue by category with a JOIN and aggregation.',
   '["sk_sql"]', 'intermediate', 70,
   '["JOIN orders × products","GROUP BY month + category","ORDER chronologically"]',
   '["JOIN correct","Aggregation correct","Ordered output"]'),
  ('ch_git_flow', 'Clean Collaboration Flow',
   'Submit a feature via branch + PR with clear commits and a conflict resolved.',
   '["sk_git"]', 'beginner', 50,
   '["Feature branch","3+ clear commits","PR description + merge"]',
   '["Branch used","Commits tell a story","PR reviewed/merged"]'),
  ('ch_testing_suite', 'First Unit Suite',
   'Write unit tests covering happy path, edge case and one mock for a small module.',
   '["sk_testing","sk_js"]', 'intermediate', 80,
   '["Happy-path tests","Edge-case tests","One mocked dependency"]',
   '["All tests pass","Edge case covered","Mock used correctly"]'),
  ('ch_dsa_two_sum', 'Two Pointers Sprint',
   'Solve 3 array problems with optimal complexity and explain trade-offs.',
   '["sk_dsa","sk_algo"]', 'advanced', 110,
   '["Two-sum variant","Sorted squares / dedupe","Complexity notes"]',
   '["Optimal complexity","All cases pass","Trade-offs explained"]'),
  ('ch_python_reporter', 'CSV Reporter Script',
   'Python script reading a CSV and printing a summary table with totals.',
   '["sk_python"]', 'beginner', 60,
   '["Parse CSV safely","Aggregate totals","Print readable table"]',
   '["Handles missing values","Totals correct","Usable CLI output"]')
on conflict (id) do nothing;

insert into public.opportunities (id, title, company, type, location, remote, required_skills, description) values
  ('job_fe_junior', 'Junior Frontend Developer', 'Brightline Studio', 'job', 'Remote', true,
   '[{"skillId":"sk_js","minLevel":"intermediate"},{"skillId":"sk_react","minLevel":"intermediate"},{"skillId":"sk_css","minLevel":"intermediate"},{"skillId":"sk_git","minLevel":"beginner"}]',
   'Own UI features in React + TypeScript: build accessible components, fix bugs from real tickets, and ship with tests. Mentorship from senior engineers included.'),
  ('job_fe_mid', 'Frontend Developer', 'Northwind Labs', 'job', 'Berlin · Hybrid', false,
   '[{"skillId":"sk_js","minLevel":"advanced"},{"skillId":"sk_react","minLevel":"advanced"},{"skillId":"sk_ts","minLevel":"intermediate"},{"skillId":"sk_testing","minLevel":"intermediate"}]',
   'Build and scale our design-system-driven app used by 200k users. You will lead features end-to-end and raise our testing bar.'),
  ('job_be_junior', 'Backend Developer (Node)', 'Parcelpath', 'job', 'Remote', true,
   '[{"skillId":"sk_node","minLevel":"intermediate"},{"skillId":"sk_rest","minLevel":"intermediate"},{"skillId":"sk_sql","minLevel":"beginner"},{"skillId":"sk_git","minLevel":"beginner"}]',
   'Design REST endpoints, write integration tests, and help migrate a monolith to services. Great role for a first backend job.'),
  ('job_fs_mid', 'Full-Stack Developer', 'Helios Health', 'job', 'Amsterdam · Hybrid', false,
   '[{"skillId":"sk_js","minLevel":"advanced"},{"skillId":"sk_react","minLevel":"intermediate"},{"skillId":"sk_node","minLevel":"intermediate"},{"skillId":"sk_sql","minLevel":"intermediate"}]',
   'Ship patient-facing features across React frontend and Node APIs. Small team, big ownership, on-call rotation with backup.'),
  ('int_fe', 'Frontend Intern', 'Craftly', 'internship', 'Remote', true,
   '[{"skillId":"sk_js","minLevel":"beginner"},{"skillId":"sk_css","minLevel":"beginner"},{"skillId":"sk_git","minLevel":"beginner"}]',
   '12-week paid internship: pair with mentors, fix real UI bugs, and present a capstone. Converts to junior offers for top interns.'),
  ('int_data', 'Data Analysis Intern', 'OpenGrid', 'internship', 'Lagos · On-site', false,
   '[{"skillId":"sk_python","minLevel":"beginner"},{"skillId":"sk_sql","minLevel":"beginner"},{"skillId":"sk_data","minLevel":"beginner"}]',
   'Clean datasets, build dashboards, and present insights to the ops team. SQL + Python everyday; curiosity required.'),
  ('int_be', 'Backend Intern (Python)', 'Fathomly', 'internship', 'Remote', true,
   '[{"skillId":"sk_python","minLevel":"beginner"},{"skillId":"sk_rest","minLevel":"beginner"},{"skillId":"sk_git","minLevel":"beginner"}]',
   'Help build internal APIs and automation scripts. You will be reviewed like a full engineer — and treated like one.'),
  ('job_qa', 'QA Automation Engineer', 'Testpilot', 'job', 'Remote', true,
   '[{"skillId":"sk_testing","minLevel":"advanced"},{"skillId":"sk_js","minLevel":"intermediate"},{"skillId":"sk_git","minLevel":"intermediate"}]',
   'Own e2e suites, flaky-test hunts, and CI quality gates across three product teams.'),
  ('job_ds_junior', 'Junior Data Analyst', 'Meridian Retail', 'job', 'London · Hybrid', false,
   '[{"skillId":"sk_sql","minLevel":"intermediate"},{"skillId":"sk_data","minLevel":"intermediate"},{"skillId":"sk_python","minLevel":"beginner"}]',
   'Turn sales data into weekly insights. SQL-first role with room to grow into analytics engineering.'),
  ('int_design', 'UI Design Intern', 'Brightline Studio', 'internship', 'Remote', true,
   '[{"skillId":"sk_ui","minLevel":"beginner"},{"skillId":"sk_figma","minLevel":"beginner"},{"skillId":"sk_comm","minLevel":"beginner"}]',
   'Design real client screens in Figma, join crits, and leave with 3 portfolio pieces and a reference.')
on conflict (id) do nothing;