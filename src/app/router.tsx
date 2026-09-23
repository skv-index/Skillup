import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout, PlaceholderPage } from '@/components/layout';
import { paths } from './paths';

// Part 1 — real pages (own feature folder; same paths as foundation)
import { LandingPage } from '@/features/part1-user-skill-intelligence/pages/LandingPage';
import { LoginPage } from '@/features/part1-user-skill-intelligence/pages/LoginPage';
import { RegisterPage } from '@/features/part1-user-skill-intelligence/pages/RegisterPage';
import { OnboardingPage } from '@/features/part1-user-skill-intelligence/pages/OnboardingPage';
import { DashboardPage } from '@/features/part1-user-skill-intelligence/pages/DashboardPage';
import { MySkillsPage } from '@/features/part1-user-skill-intelligence/pages/MySkillsPage';
import { AssessmentPage } from '@/features/part1-user-skill-intelligence/pages/AssessmentPage';
import { AssessmentResultPage } from '@/features/part1-user-skill-intelligence/pages/AssessmentResultPage';
import { SkillGraphPage } from '@/features/part1-user-skill-intelligence/pages/SkillGraphPage';
import { SkillGapPage } from '@/features/part1-user-skill-intelligence/pages/SkillGapPage';

// Part 2 — real pages (own feature folder; same paths as foundation)
import { LearningPage } from '@/features/part2-learning-challenges-verification/pages/LearningPage';
import { LearningContentPage } from '@/features/part2-learning-challenges-verification/pages/LearningContentPage';
import { ChallengesPage } from '@/features/part2-learning-challenges-verification/pages/ChallengesPage';
import { ChallengeDetailsPage } from '@/features/part2-learning-challenges-verification/pages/ChallengeDetailsPage';
import { ChallengeSubmissionPage } from '@/features/part2-learning-challenges-verification/pages/ChallengeSubmissionPage';
import { EvaluationResultPage } from '@/features/part2-learning-challenges-verification/pages/EvaluationResultPage';
import { VerifiedSkillsPage } from '@/features/part2-learning-challenges-verification/pages/VerifiedSkillsPage';
import { VerifiedSkillDetailsPage } from '@/features/part2-learning-challenges-verification/pages/VerifiedSkillDetailsPage';

// Part 3 — real pages (own feature folder; same paths as foundation)
import { CareerReadinessPage } from '@/features/part3-career-opportunities-admin/pages/CareerReadinessPage';
import { JobsPage } from '@/features/part3-career-opportunities-admin/pages/JobsPage';
import { JobDetailsPage } from '@/features/part3-career-opportunities-admin/pages/JobDetailsPage';
import { ProfilePage } from '@/features/part3-career-opportunities-admin/pages/ProfilePage';
import { SettingsPage } from '@/features/part3-career-opportunities-admin/pages/SettingsPage';
import { AdminDashboardPage } from '@/features/part3-career-opportunities-admin/pages/AdminDashboardPage';
import { AdminSkillsPage } from '@/features/part3-career-opportunities-admin/pages/AdminSkillsPage';
import { AdminAssessmentsPage } from '@/features/part3-career-opportunities-admin/pages/AdminAssessmentsPage';
import { AdminChallengesPage } from '@/features/part3-career-opportunities-admin/pages/AdminChallengesPage';
import { AdminVerificationPage } from '@/features/part3-career-opportunities-admin/pages/AdminVerificationPage';
import { AdminJobsPage } from '@/features/part3-career-opportunities-admin/pages/AdminJobsPage';
import { AdminAnalyticsPage } from '@/features/part3-career-opportunities-admin/pages/AdminAnalyticsPage';

/**
 * Routing structure — shared foundation.
 * Rule: parts keep these paths and only swap PlaceholderPage → real page.
 * Auth pages render standalone; app pages render inside <AppLayout/>.
 */

function ph(part: string, title: string, modules: string[]) {
  return <PlaceholderPage part={part} title={title} modules={modules} />;
}

export const router = createBrowserRouter([
  // ── Public (no sidebar/header) — Part 1 wired ──
  { path: paths.landing, element: <LandingPage /> },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },
  { path: paths.onboarding, element: <OnboardingPage /> },

  // ── Authenticated app shell ──
  {
    element: <AppLayout />,
    children: [
      // Part 1 — wired
      { path: paths.dashboard, element: <DashboardPage /> },
      { path: paths.mySkills, element: <MySkillsPage /> },
      { path: paths.assessment, element: <AssessmentPage /> },
      { path: paths.assessmentResult, element: <AssessmentResultPage /> },
      { path: paths.skillGraph, element: <SkillGraphPage /> },
      {
        path: paths.skillGap,
        element: <SkillGapPage />,
      },

      // Part 2 — wired
      { path: paths.learning, element: <LearningPage /> },
      { path: paths.learningContent, element: <LearningContentPage /> },
      { path: paths.challenges, element: <ChallengesPage /> },
      { path: paths.challengeDetails, element: <ChallengeDetailsPage /> },
      { path: paths.challengeSubmission, element: <ChallengeSubmissionPage /> },
      { path: paths.evaluationResult, element: <EvaluationResultPage /> },
      { path: paths.verifiedSkills, element: <VerifiedSkillsPage /> },
      { path: paths.verifiedSkillDetails, element: <VerifiedSkillDetailsPage /> },

      // Part 3 — wired
      { path: paths.career, element: <CareerReadinessPage /> },
      { path: paths.jobs, element: <JobsPage /> },
      { path: paths.jobDetails, element: <JobDetailsPage /> },
      { path: paths.profile, element: <ProfilePage /> },
      { path: paths.settings, element: <SettingsPage /> },
      { path: paths.admin, element: <AdminDashboardPage /> },
      { path: paths.adminSkills, element: <AdminSkillsPage /> },
      { path: paths.adminAssessments, element: <AdminAssessmentsPage /> },
      { path: paths.adminChallenges, element: <AdminChallengesPage /> },
      { path: paths.adminVerification, element: <AdminVerificationPage /> },
      { path: paths.adminJobs, element: <AdminJobsPage /> },
      { path: paths.adminAnalytics, element: <AdminAnalyticsPage /> },
    ],
  },

  { path: '*', element: ph('Foundation', '404 — Page not found', []) },
]);
