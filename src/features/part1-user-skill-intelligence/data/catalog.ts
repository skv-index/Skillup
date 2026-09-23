import type { Assessment, Skill, SkillLevel } from '@/types';

export const LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
export const LEVEL_INDEX: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export function levelFromScore(score: number): SkillLevel {
  if (score >= 85) return 'expert';
  if (score >= 65) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'beginner';
}

export const SKILLS_CATALOG: Skill[] = [
  { id: 'sk_js', name: 'JavaScript', slug: 'javascript', category: 'Frontend', description: 'Core language of the web.' },
  { id: 'sk_ts', name: 'TypeScript', slug: 'typescript', category: 'Frontend', description: 'Typed superset of JavaScript.' },
  { id: 'sk_react', name: 'React', slug: 'react', category: 'Frontend', description: 'UI library for component apps.' },
  { id: 'sk_css', name: 'CSS & Layout', slug: 'css-layout', category: 'Frontend', description: 'Styling, flexbox, grid, responsive.' },
  { id: 'sk_node', name: 'Node.js', slug: 'nodejs', category: 'Backend', description: 'Server-side JavaScript runtime.' },
  { id: 'sk_python', name: 'Python', slug: 'python', category: 'Backend', description: 'General-purpose backend & scripting.' },
  { id: 'sk_sql', name: 'SQL', slug: 'sql', category: 'Backend', description: 'Relational queries & modeling.' },
  { id: 'sk_rest', name: 'REST APIs', slug: 'rest-apis', category: 'Backend', description: 'HTTP API design & integration.' },
  { id: 'sk_git', name: 'Git & GitHub', slug: 'git-github', category: 'Tooling', description: 'Version control & collaboration.' },
  { id: 'sk_testing', name: 'Testing', slug: 'testing', category: 'Tooling', description: 'Unit, integration & e2e testing.' },
  { id: 'sk_dsa', name: 'Data Structures', slug: 'data-structures', category: 'CS Fundamentals', description: 'Arrays, maps, trees, graphs.' },
  { id: 'sk_algo', name: 'Algorithms', slug: 'algorithms', category: 'CS Fundamentals', description: 'Complexity, sorting, searching.' },
  { id: 'sk_ui', name: 'UI Design', slug: 'ui-design', category: 'Design', description: 'Visual hierarchy & components.' },
  { id: 'sk_figma', name: 'Figma', slug: 'figma', category: 'Design', description: 'Design & prototyping tool.' },
  { id: 'sk_agile', name: 'Agile & Scrum', slug: 'agile-scrum', category: 'Professional', description: 'Sprints, standups, retros.' },
  { id: 'sk_comm', name: 'Communication', slug: 'communication', category: 'Professional', description: 'Writing & presenting clearly.' },
  { id: 'sk_ml', name: 'ML Basics', slug: 'ml-basics', category: 'Data & AI', description: 'Regression, classification, eval.' },
  { id: 'sk_data', name: 'Data Analysis', slug: 'data-analysis', category: 'Data & AI', description: 'Cleaning, viz & insight.' },
];

export const skillById = (id: string): Skill | undefined =>
  SKILLS_CATALOG.find((s) => s.id === id);

export const ASSESSMENTS: Assessment[] = SKILLS_CATALOG.filter((s) =>
  ['sk_js', 'sk_ts', 'sk_react', 'sk_css', 'sk_node', 'sk_python', 'sk_sql', 'sk_rest', 'sk_git', 'sk_testing', 'sk_dsa', 'sk_algo'].includes(s.id),
).map((s) => ({
  id: `as_${s.slug}`,
  skillId: s.id,
  title: `${s.name} Assessment`,
  questionCount: 5,
  durationMinutes: 10,
}));

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  topic: string;
}

const GENERIC_QUESTIONS: Omit<QuizQuestion, 'id'>[] = [
  { prompt: 'Which practice best shows intermediate skill?', options: ['Copy-paste without review', 'Write, test and document your work', 'Avoid all feedback', 'Skip planning'], answer: 1, topic: 'Craft' },
  { prompt: 'What do you do when stuck for 30 minutes?', options: ['Give up', 'Break the problem down and seek a minimal repro', 'Rewrite everything randomly', 'Wait silently'], answer: 1, topic: 'Problem solving' },
  { prompt: 'Which is a sign of production-ready work?', options: ['Works once on my machine', 'Tested, reviewed and handles edge cases', 'No error handling', 'Hardcoded secrets'], answer: 1, topic: 'Quality' },
  { prompt: 'How do you learn a new API fastest?', options: ['Read docs + build a tiny example', 'Memorize every page', 'Avoid trying it', 'Only watch others'], answer: 0, topic: 'Learning' },
  { prompt: 'Best response to code review feedback?', options: ['Ignore it', 'Discuss, adjust, and add a test', 'Argue without reason', 'Delete the project'], answer: 1, topic: 'Collaboration' },
];

export function questionsForAssessment(assessmentId: string): QuizQuestion[] {
  return GENERIC_QUESTIONS.map((q, i) => ({ ...q, id: `${assessmentId}_q${i + 1}` }));
}

export function assessmentById(id: string): Assessment | undefined {
  return ASSESSMENTS.find((a) => a.id === id);
}

export function assessmentsForSkill(skillId: string): Assessment[] {
  return ASSESSMENTS.filter((a) => a.skillId === skillId);
}

export interface TargetRole {
  id: string;
  title: string;
  requiredSkills: { skillId: string; minLevel: SkillLevel }[];
}

export const TARGET_ROLES: TargetRole[] = [
  {
    id: 'role_frontend',
    title: 'Frontend Developer',
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'advanced' },
      { skillId: 'sk_react', minLevel: 'advanced' },
      { skillId: 'sk_ts', minLevel: 'intermediate' },
      { skillId: 'sk_css', minLevel: 'advanced' },
      { skillId: 'sk_git', minLevel: 'intermediate' },
      { skillId: 'sk_testing', minLevel: 'intermediate' },
    ],
  },
  {
    id: 'role_backend',
    title: 'Backend Developer',
    requiredSkills: [
      { skillId: 'sk_node', minLevel: 'advanced' },
      { skillId: 'sk_rest', minLevel: 'advanced' },
      { skillId: 'sk_sql', minLevel: 'intermediate' },
      { skillId: 'sk_git', minLevel: 'intermediate' },
      { skillId: 'sk_testing', minLevel: 'intermediate' },
    ],
  },
  {
    id: 'role_fullstack',
    title: 'Full-Stack Developer',
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'advanced' },
      { skillId: 'sk_react', minLevel: 'intermediate' },
      { skillId: 'sk_node', minLevel: 'intermediate' },
      { skillId: 'sk_rest', minLevel: 'intermediate' },
      { skillId: 'sk_sql', minLevel: 'intermediate' },
      { skillId: 'sk_git', minLevel: 'intermediate' },
    ],
  },
];
