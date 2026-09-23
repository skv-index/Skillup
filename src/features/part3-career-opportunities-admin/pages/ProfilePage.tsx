import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button, Card, Input, ProgressBar, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  careerReadiness,
  currentUser,
  matchAll,
} from '../services/part3-store';
import {
  getClaimed,
  getResume,
  saveResume,
} from '@/features/part1-user-skill-intelligence/services/part1-store';
import { getVerified } from '@/features/part2-learning-challenges-verification/services/part2-store';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { LevelBadge } from '@/features/part1-user-skill-intelligence/components/Part1Widgets';
import { MatchBadge, ScoreBadge } from '../components/Part3Widgets';
import { initials } from '@/lib/utils';
import '../part3.css';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [summary, setSummary] = useState(() => getResume().summary);
  const [msg, setMsg] = useState('');

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const readiness = useMemo(() => careerReadiness(uid), [uid]);
  const claimed = useMemo(() => getClaimed(uid), [uid]);
  const verified = useMemo(() => getVerified(uid), [uid]);
  const best = useMemo(() => matchAll(uid)[0], [uid]);

  const save = () => {
    setUser({ ...user, name: name.trim() || user.name, headline, bio, location });
    const r = getResume(uid);
    saveResume({ ...r, summary, rawText: `${summary}\n${r.experience}` }, uid);
    setEditing(false);
    setMsg(`Saved · ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Profile</h1>
        <p>User Profile · verified proof · readiness snapshot</p>
      </div>

      <div className="grid grid--2">
        <Card
          title={editing ? 'Edit profile' : user.name}
          subtitle={editing ? undefined : user.headline || user.email}
          actions={
            editing ? (
              <>
                <Button size="sm" onClick={save}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => {
                setName(user.name);
                setHeadline(user.headline ?? '');
                setBio(user.bio ?? '');
                setLocation(user.location ?? '');
                setEditing(true);
              }}>
                Edit
              </Button>
            )
          }
        >
          {editing ? (
            <>
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <Textarea label="Resume summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
              {msg && <p className="tiny muted">{msg}</p>}
            </>
          ) : (
            <div className="row">
              <span className="avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                {initials(user.name)}
              </span>
              <div>
                <p className="small">{user.bio || 'No bio yet.'}</p>
                <p className="tiny muted">
                  {[user.location, user.email, user.role].filter(Boolean).join(' · ')}
                </p>
                {msg && <p className="tiny muted">{msg}</p>}
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Career snapshot"
          subtitle="Live from Parts 1+2"
          actions={
            <Link className="btn btn--ghost btn--sm" to={paths.career}>
              Full readiness
            </Link>
          }
        >
          <div className="row row--between small">
            <span>
              Readiness <ScoreBadge score={readiness.score} />
            </span>
            {best?.opportunity && <MatchBadge score={best.matchScore} />}
          </div>
          <div className="mt-4">
            <ProgressBar value={readiness.score} label="" />
          </div>
          <p className="small mt-4">
            {verified.length} verified · {claimed.length} claimed · {readiness.gapsClosed} gaps closed
          </p>
          {best?.opportunity && (
            <p className="small muted">
              Best match: <Link to={`/jobs/${best.opportunityId}`}>{best.opportunity.title}</Link> @{' '}
              {best.opportunity.company}
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid--2 mt-4">
        <Card title="Claimed skills" subtitle={`${claimed.length} total`}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {claimed.map((c) => (
              <span key={c.id} className="row" style={{ gap: 6 }}>
                <span className="small">{skillById(c.skillId)?.name}</span>
                <LevelBadge level={c.selfLevel} />
              </span>
            ))}
            {claimed.length === 0 && <span className="small muted">None yet.</span>}
          </div>
          <div className="card__actions">
            <Link className="btn btn--ghost btn--sm" to={paths.mySkills}>
              Manage
            </Link>
          </div>
        </Card>
        <Card title="Verified skills" subtitle={`${verified.length} credentials`}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {verified.map((v) => (
              <Link key={v.id} to={`/verified/${v.id}`} className="row" style={{ gap: 6 }}>
                <span className="small">{v.skill?.name ?? v.skillId}</span>
                <LevelBadge level={v.level} />
              </Link>
            ))}
            {verified.length === 0 && <span className="small muted">None yet — pass a challenge.</span>}
          </div>
        </Card>
      </div>
    </div>
  );
}
