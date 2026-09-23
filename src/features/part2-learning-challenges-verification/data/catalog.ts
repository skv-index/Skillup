import type { Challenge, SkillLevel } from '@/types';

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  kind: 'read' | 'video' | 'practice' | 'quiz';
}

export interface Course {
  id: string;
  skillId: string;
  title: string;
  level: SkillLevel;
  blurb: string;
  lessons: Lesson[];
}

function course(
  skillId: string,
  title: string,
  level: SkillLevel,
  blurb: string,
  lessons: [string, number, Lesson['kind']][],
): Course {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: `course_${skillId}`,
    skillId,
    title,
    level,
    blurb,
    lessons: lessons.map(([t, m, k], i) => ({ id: `course_${skillId}_l${i + 1}_${slug}`, title: t, minutes: m, kind: k })),
  };
}

export const COURSES: Course[] = [
  course('sk_js', 'JavaScript Foundations', 'intermediate', 'Closures, async, modules and clean patterns.', [
    ['Scope & closures, explained', 12, 'read'],
    ['Async JS: promises & await', 15, 'video'],
    ['ES modules in practice', 10, 'practice'],
    ['Mini-quiz: async pitfalls', 8, 'quiz'],
    ['Project: fetch & render list', 25, 'practice'],
  ]),
  course('sk_ts', 'TypeScript Essentials', 'intermediate', 'Types, interfaces, generics without fear.', [
    ['Why types pay off', 8, 'read'],
    ['Interfaces vs types', 12, 'video'],
    ['Generics playground', 15, 'practice'],
    ['Mini-quiz: narrowing', 8, 'quiz'],
  ]),
  course('sk_react', 'React in Practice', 'advanced', 'Hooks, state, effects and data fetching.', [
    ['Thinking in components', 10, 'read'],
    ['useState & useEffect deep-dive', 18, 'video'],
    ['Forms & controlled inputs', 14, 'practice'],
    ['Mini-quiz: hooks rules', 8, 'quiz'],
    ['Project: todo with filter', 30, 'practice'],
  ]),
  course('sk_css', 'CSS & Responsive Layout', 'advanced', 'Flexbox, grid and responsive systems.', [
    ['Flexbox mental model', 12, 'video'],
    ['Grid for page layouts', 14, 'practice'],
    ['Responsive without frameworks', 12, 'read'],
    ['Project: landing page clone', 30, 'practice'],
  ]),
  course('sk_node', 'Node.js APIs', 'advanced', 'Build JSON APIs with routing and middleware.', [
    ['Node & event loop basics', 10, 'read'],
    ['Routing a JSON API', 16, 'video'],
    ['Middleware & errors', 12, 'practice'],
    ['Project: todos API', 30, 'practice'],
  ]),
  course('sk_rest', 'REST API Design', 'advanced', 'Resources, status codes and versioning.', [
    ['Resources & verbs', 10, 'read'],
    ['Status codes that matter', 8, 'video'],
    ['Practice: design a spec', 15, 'practice'],
  ]),
  course('sk_sql', 'SQL from Zero', 'intermediate', 'SELECT to JOINs with real datasets.', [
    ['SELECT, WHERE, ORDER BY', 12, 'video'],
    ['JOINs without tears', 14, 'practice'],
    ['Aggregations & GROUP BY', 12, 'practice'],
    ['Mini-quiz: join types', 8, 'quiz'],
  ]),
  course('sk_git', 'Git & Collaboration', 'intermediate', 'Branches, PRs and clean history.', [
    ['Commits that make sense', 8, 'read'],
    ['Branching & pull requests', 14, 'video'],
    ['Practice: resolve a conflict', 15, 'practice'],
  ]),
  course('sk_testing', 'Testing Basics', 'intermediate', 'Unit tests that actually help.', [
    ['What to test first', 8, 'read'],
    ['Your first unit suite', 16, 'practice'],
    ['Mini-quiz: mocks', 8, 'quiz'],
  ]),
  course('sk_python', 'Python for Backend', 'intermediate', 'Functions, modules and file I/O.', [
    ['Pythonic functions', 12, 'video'],
    ['Modules & venv', 10, 'read'],
    ['Practice: CSV reporter', 25, 'practice'],
  ]),
  course('sk_dsa', 'Data Structures Primer', 'intermediate', 'Arrays, maps, sets, stacks.', [
    ['Big-O in 10 minutes', 10, 'video'],
    ['Maps & sets patterns', 12, 'practice'],
    ['Mini-quiz: complexity', 8, 'quiz'],
  ]),
  course('sk_algo', 'Algorithms Workout', 'advanced', 'Two pointers, sliding window, sorting.', [
    ['Two pointers pattern', 14, 'practice'],
    ['Sliding window pattern', 14, 'practice'],
    ['Sorting: when & why', 10, 'read'],
  ]),
];

export const courseById = (id: string): Course | undefined => COURSES.find((c) => c.id === id);
export const courseForSkill = (skillId: string): Course | undefined =>
  COURSES.find((c) => c.skillId === skillId);

export interface ChallengeSpec extends Challenge {
  tasks: string[];
  checklist: string[];
  relatedCourseId?: string;
}

export const CHALLENGES: ChallengeSpec[] = [
  {
    id: 'ch_react_todo',
    title: 'Todo App with Filters',
    description: 'Build a React todo app: add, toggle, delete and filter (all/active/done) with localStorage persistence.',
    skillIds: ['sk_js', 'sk_react'],
    difficulty: 'intermediate',
    points: 100,
    tasks: ['Scaffold list + add form', 'Toggle & delete items', 'All/Active/Done filter', 'Persist to localStorage'],
    checklist: ['App renders and adds items', 'Toggle + delete work', 'Filter works', 'Persists after reload'],
    relatedCourseId: 'course_sk_react',
  },
  {
    id: 'ch_ts_types',
    title: 'Type a Utility Library',
    description: 'Add correct TypeScript types to 5 untyped utility functions including one generic.',
    skillIds: ['sk_ts'],
    difficulty: 'intermediate',
    points: 80,
    tasks: ['Type 4 concrete functions', 'Write 1 generic helper', 'No `any` leaks'],
    checklist: ['All functions typed', 'Generic works for 2 types', 'tsc passes with strict'],
    relatedCourseId: 'course_sk_ts',
  },
  {
    id: 'ch_css_layout',
    title: 'Responsive Landing Clone',
    description: 'Recreate a landing page hero + 3-card grid that collapses cleanly at 900px and 600px.',
    skillIds: ['sk_css'],
    difficulty: 'advanced',
    points: 90,
    tasks: ['Hero section', '3-card responsive grid', 'Breakpoints 900/600'],
    checklist: ['Grid collapses at breakpoints', 'No horizontal scroll on mobile', 'Spacing system used'],
    relatedCourseId: 'course_sk_css',
  },
  {
    id: 'ch_node_api',
    title: 'Todos REST API',
    description: 'Build CRUD endpoints for todos with validation and proper status codes.',
    skillIds: ['sk_node', 'sk_rest'],
    difficulty: 'advanced',
    points: 120,
    tasks: ['GET/POST/PATCH/DELETE routes', 'Input validation', 'Correct status codes + errors'],
    checklist: ['All CRUD routes work', 'Validation rejects bad input', '404/400 handled'],
    relatedCourseId: 'course_sk_node',
  },
  {
    id: 'ch_sql_report',
    title: 'Sales Report Query',
    description: 'Write SQL producing monthly revenue by category with a JOIN and aggregation.',
    skillIds: ['sk_sql'],
    difficulty: 'intermediate',
    points: 70,
    tasks: ['JOIN orders × products', 'GROUP BY month + category', 'ORDER chronologically'],
    checklist: ['JOIN correct', 'Aggregation correct', 'Ordered output'],
    relatedCourseId: 'course_sk_sql',
  },
  {
    id: 'ch_git_flow',
    title: 'Clean Collaboration Flow',
    description: 'Submit a feature via branch + PR with clear commits and a conflict resolved.',
    skillIds: ['sk_git'],
    difficulty: 'beginner',
    points: 50,
    tasks: ['Feature branch', '3+ clear commits', 'PR description + merge'],
    checklist: ['Branch used', 'Commits tell a story', 'PR reviewed/merged'],
    relatedCourseId: 'course_sk_git',
  },
  {
    id: 'ch_testing_suite',
    title: 'First Unit Suite',
    description: 'Write unit tests covering happy path, edge case and one mock for a small module.',
    skillIds: ['sk_testing', 'sk_js'],
    difficulty: 'intermediate',
    points: 80,
    tasks: ['Happy-path tests', 'Edge-case tests', 'One mocked dependency'],
    checklist: ['All tests pass', 'Edge case covered', 'Mock used correctly'],
    relatedCourseId: 'course_sk_testing',
  },
  {
    id: 'ch_dsa_two_sum',
    title: 'Two Pointers Sprint',
    description: 'Solve 3 array problems with optimal complexity and explain trade-offs.',
    skillIds: ['sk_dsa', 'sk_algo'],
    difficulty: 'advanced',
    points: 110,
    tasks: ['Two-sum variant', 'Sorted squares / dedupe', 'Complexity notes'],
    checklist: ['Optimal complexity', 'All cases pass', 'Trade-offs explained'],
    relatedCourseId: 'course_sk_dsa',
  },
  {
    id: 'ch_python_reporter',
    title: 'CSV Reporter Script',
    description: 'Python script reading a CSV and printing a summary table with totals.',
    skillIds: ['sk_python'],
    difficulty: 'beginner',
    points: 60,
    tasks: ['Parse CSV safely', 'Aggregate totals', 'Print readable table'],
    checklist: ['Handles missing values', 'Totals correct', 'Usable CLI output'],
    relatedCourseId: 'course_sk_python',
  },
];

export const challengeById = (id: string): ChallengeSpec | undefined =>
  CHALLENGES.find((c) => c.id === id);

export function challengesForSkill(skillId: string): ChallengeSpec[] {
  return CHALLENGES.filter((c) => c.skillIds.includes(skillId));
}
