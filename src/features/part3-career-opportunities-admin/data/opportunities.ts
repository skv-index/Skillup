import type { Opportunity } from '@/types';

const at = (daysAgo: number): string =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'job_fe_junior',
    title: 'Junior Frontend Developer',
    company: 'Brightline Studio',
    type: 'job',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'intermediate' },
      { skillId: 'sk_react', minLevel: 'intermediate' },
      { skillId: 'sk_css', minLevel: 'intermediate' },
      { skillId: 'sk_git', minLevel: 'beginner' },
    ],
    description:
      'Own UI features in React + TypeScript: build accessible components, fix bugs from real tickets, and ship with tests. Mentorship from senior engineers included.',
    postedAt: at(2),
  },
  {
    id: 'job_fe_mid',
    title: 'Frontend Developer',
    company: 'Northwind Labs',
    type: 'job',
    location: 'Berlin · Hybrid',
    remote: false,
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'advanced' },
      { skillId: 'sk_react', minLevel: 'advanced' },
      { skillId: 'sk_ts', minLevel: 'intermediate' },
      { skillId: 'sk_testing', minLevel: 'intermediate' },
    ],
    description:
      'Build and scale our design-system-driven app used by 200k users. You will lead features end-to-end and raise our testing bar.',
    postedAt: at(5),
  },
  {
    id: 'job_be_junior',
    title: 'Backend Developer (Node)',
    company: 'Parcelpath',
    type: 'job',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_node', minLevel: 'intermediate' },
      { skillId: 'sk_rest', minLevel: 'intermediate' },
      { skillId: 'sk_sql', minLevel: 'beginner' },
      { skillId: 'sk_git', minLevel: 'beginner' },
    ],
    description:
      'Design REST endpoints, write integration tests, and help migrate a monolith to services. Great role for a first backend job.',
    postedAt: at(1),
  },
  {
    id: 'job_fs_mid',
    title: 'Full-Stack Developer',
    company: 'Helios Health',
    type: 'job',
    location: 'Amsterdam · Hybrid',
    remote: false,
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'advanced' },
      { skillId: 'sk_react', minLevel: 'intermediate' },
      { skillId: 'sk_node', minLevel: 'intermediate' },
      { skillId: 'sk_sql', minLevel: 'intermediate' },
    ],
    description:
      'Ship patient-facing features across React frontend and Node APIs. Small team, big ownership, on-call rotation with backup.',
    postedAt: at(7),
  },
  {
    id: 'int_fe',
    title: 'Frontend Intern',
    company: 'Craftly',
    type: 'internship',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_js', minLevel: 'beginner' },
      { skillId: 'sk_css', minLevel: 'beginner' },
      { skillId: 'sk_git', minLevel: 'beginner' },
    ],
    description:
      '12-week paid internship: pair with mentors, fix real UI bugs, and present a capstone. Converts to junior offers for top interns.',
    postedAt: at(3),
  },
  {
    id: 'int_data',
    title: 'Data Analysis Intern',
    company: 'OpenGrid',
    type: 'internship',
    location: 'Lagos · On-site',
    remote: false,
    requiredSkills: [
      { skillId: 'sk_python', minLevel: 'beginner' },
      { skillId: 'sk_sql', minLevel: 'beginner' },
      { skillId: 'sk_data', minLevel: 'beginner' },
    ],
    description:
      'Clean datasets, build dashboards, and present insights to the ops team. SQL + Python everyday; curiosity required.',
    postedAt: at(4),
  },
  {
    id: 'int_be',
    title: 'Backend Intern (Python)',
    company: 'Fathomly',
    type: 'internship',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_python', minLevel: 'beginner' },
      { skillId: 'sk_rest', minLevel: 'beginner' },
      { skillId: 'sk_git', minLevel: 'beginner' },
    ],
    description:
      'Help build internal APIs and automation scripts. You will be reviewed like a full engineer — and treated like one.',
    postedAt: at(6),
  },
  {
    id: 'job_qa',
    title: 'QA Automation Engineer',
    company: 'Testpilot',
    type: 'job',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_testing', minLevel: 'advanced' },
      { skillId: 'sk_js', minLevel: 'intermediate' },
      { skillId: 'sk_git', minLevel: 'intermediate' },
    ],
    description:
      'Own e2e suites, flaky-test hunts, and CI quality gates across three product teams.',
    postedAt: at(9),
  },
  {
    id: 'job_ds_junior',
    title: 'Junior Data Analyst',
    company: 'Meridian Retail',
    type: 'job',
    location: 'London · Hybrid',
    remote: false,
    requiredSkills: [
      { skillId: 'sk_sql', minLevel: 'intermediate' },
      { skillId: 'sk_data', minLevel: 'intermediate' },
      { skillId: 'sk_python', minLevel: 'beginner' },
    ],
    description:
      'Turn sales data into weekly insights. SQL-first role with room to grow into analytics engineering.',
    postedAt: at(8),
  },
  {
    id: 'int_design',
    title: 'UI Design Intern',
    company: 'Brightline Studio',
    type: 'internship',
    location: 'Remote',
    remote: true,
    requiredSkills: [
      { skillId: 'sk_ui', minLevel: 'beginner' },
      { skillId: 'sk_figma', minLevel: 'beginner' },
      { skillId: 'sk_comm', minLevel: 'beginner' },
    ],
    description:
      'Design real client screens in Figma, join crits, and leave with 3 portfolio pieces and a reference.',
    postedAt: at(10),
  },
];

export const opportunityById = (id: string): Opportunity | undefined =>
  OPPORTUNITIES.find((o) => o.id === id);
