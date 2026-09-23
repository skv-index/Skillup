import { Link } from 'react-router-dom';
import { Badge, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import '../part1.css';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <header className="row row--between" style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="row">
          <span className="sidebar__brand-mark">S</span>
          <strong>SkillUp</strong>
        </div>
        <div className="row">
          {isAuthenticated ? (
            <Link className="btn btn--primary btn--sm" to={paths.dashboard}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn--ghost btn--sm" to={paths.login}>
                Log in
              </Link>
              <Link className="btn btn--primary btn--sm" to={paths.register}>
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto' }}>
        <section className="landing-hero">
          <Badge variant="primary">Claimed Skill → Assessed Skill → Skill Gap</Badge>
          <h1 className="mt-4">
            Learn. <span>Prove.</span> Get hired.
          </h1>
          <p>
            SkillUp turns self-claimed skills into AI-assessed proof, maps your skill graph,
            and shows exactly which gaps to close for your target role.
          </p>
          <div className="landing-cta">
            <Link className="btn btn--primary btn--lg" to={isAuthenticated ? paths.dashboard : paths.register}>
              Start free
            </Link>
            <Link className="btn btn--secondary btn--lg" to={paths.skillGap}>
              See how gaps work
            </Link>
          </div>
          <div className="flow-strip tiny muted">
            <Badge>1 · Claim skills</Badge>→<Badge>2 · AI assessment</Badge>→
            <Badge>3 · Skill graph</Badge>→<Badge variant="primary">4 · Gap analysis</Badge>
          </div>
        </section>

        <section className="grid grid--3" style={{ padding: '0 24px 48px' }}>
          <Card title="Claim your skills" subtitle="User Profile · Skill Management · Resume">
            Add skills with self-levels and years of experience. Import your resume summary so
            everything lives in one profile.
          </Card>
          <Card title="Get assessed by AI" subtitle="AI Skill Assessment · Progress Tracking">
            Timed quizzes per skill produce a 0–100 score, a verified level, and strengths vs
            weaknesses you can act on.
          </Card>
          <Card title="See gaps & graph" subtitle="Skill Graph · Skill Gap Analysis · Recommendations">
            Compare current vs target levels for roles like Frontend or Backend Developer, and
            explore how your skills connect.
          </Card>
        </section>
      </main>
    </div>
  );
}
