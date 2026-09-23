import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input, Select, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import type { SkillLevel } from '@/types';
import {
  SKILLS_CATALOG,
  TARGET_ROLES,
} from '../data/catalog';
import {
  addClaimed,
  currentUserId,
  getClaimed,
  getPrefs,
  refreshGaps,
  savePrefs,
  saveResume,
} from '../services/part1-store';
import '../part1.css';

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');

  const [picked, setPicked] = useState<Record<string, SkillLevel>>(() => {
    const existing = Object.fromEntries(getClaimed().map((c) => [c.skillId, c.selfLevel]));
    return existing;
  });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState('');
  const [targetRoleId, setTargetRoleId] = useState(getPrefs().targetRoleId);
  const [goals, setGoals] = useState('');
  const [done, setDone] = useState(false);

  const pickedCount = useMemo(() => Object.keys(picked).length, [picked]);

  if (!user) {
    return (
      <div className="auth-wrap">
        <Card title="Please log in first" subtitle="Onboarding needs an account.">
          <div className="mt-4">
            <Button onClick={() => navigate(paths.login)}>Go to login</Button>
          </div>
        </Card>
      </div>
    );
  }

  const toggle = (skillId: string) => {
    setPicked((p) => {
      const next = { ...p };
      if (next[skillId]) delete next[skillId];
      else next[skillId] = 'beginner';
      return next;
    });
  };

  const next = () => {
    if (step === 0) {
      setUser({ ...user, name: name.trim() || user.name, headline, bio, location });
    }
    setStep((s) => Math.min(2, s + 1));
  };

  const finish = () => {
    const uid = currentUserId();
    Object.entries(picked).forEach(([skillId, level]) => addClaimed(skillId, level, 0, uid));
    saveResume({ summary, experience, education: '', links: '', rawText: `${summary}\n${experience}` }, uid);
    savePrefs({ targetRoleId, goals }, uid);
    refreshGaps(uid);
    setUser({ ...user, name: name.trim() || user.name, headline, bio, location, onboardingCompleted: true });
    setDone(true);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 640 }}>
        <div className="auth-brand">
          <span className="sidebar__brand-mark">S</span> SkillUp onboarding
        </div>
        <div className="steps" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`step ${i <= step ? 'step--done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <Card title="Tell us about you" subtitle="Step 1 of 3 · User Profile">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Headline"
              placeholder="e.g. Aspiring Frontend Developer"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
            <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you working toward?" />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <Button block onClick={next}>
              Continue
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card
            title="Claim your skills"
            subtitle={`Step 2 of 3 · Skill Management — picked ${pickedCount}`}
          >
            <div className="grid grid--2">
              {SKILLS_CATALOG.map((s) => {
                const active = !!picked[s.id];
                return (
                  <div key={s.id} className="card" style={{ padding: 12 }}>
                    <label className="row small" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={active} onChange={() => toggle(s.id)} />
                      <strong>{s.name}</strong>
                    </label>
                    <div className="tiny muted">{s.category}</div>
                    {active && (
                      <select
                        className="select mt-4"
                        value={picked[s.id]}
                        onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.value as SkillLevel }))}
                        aria-label={`${s.name} level`}
                      >
                        {LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="row row--between mt-4">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={next} disabled={pickedCount === 0}>
                Continue{pickedCount === 0 ? ' (pick at least 1)' : ''}
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && !done && (
          <Card title="Resume & goal" subtitle="Step 3 of 3 · Resume">
            <Textarea
              label="Professional summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1–3 sentences about you…"
            />
            <Textarea
              label="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Roles, projects, internships…"
            />
            <Select
              label="Target role"
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              options={TARGET_ROLES.map((r) => ({ value: r.id, label: r.title }))}
            />
            <Input label="Goals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Job-ready in 6 months" />
            <div className="row row--between mt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={finish}>Finish setup</Button>
            </div>
          </Card>
        )}

        {done && (
          <Card title="You're set 🎉" subtitle="Claimed skills → assessments → gaps are ready.">
            <Alert variant="success">
              Profile saved. We computed your first skill gaps for{' '}
              {TARGET_ROLES.find((r) => r.id === targetRoleId)?.title}.
            </Alert>
            <div className="row mt-4">
              <Button onClick={() => navigate(paths.dashboard)}>Open dashboard</Button>
              <Button variant="secondary" onClick={() => navigate(paths.mySkills)}>
                Review my skills
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
