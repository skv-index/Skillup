import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Button, Card, Input, Select, Table, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import type { SkillLevel } from '@/types';
import { SKILLS_CATALOG, assessmentsForSkill } from '../data/catalog';
import {
  addClaimed,
  currentUserId,
  getClaimed,
  getResume,
  latestResultForSkill,
  refreshGaps,
  removeClaimed,
  saveResume,
  seedStarterSkills,
} from '../services/part1-store';
import { EmptyCta, LevelBadge, StatusBadge } from '../components/Part1Widgets';
import '../part1.css';

export function MySkillsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState<SkillLevel>('beginner');
  const [years, setYears] = useState(0);

  const [summary, setSummary] = useState(() => getResume().summary);
  const [experience, setExperience] = useState(() => getResume().experience);
  const [education, setEducation] = useState(() => getResume().education);
  const [links, setLinks] = useState(() => getResume().links);
  const [resumeMsg, setResumeMsg] = useState('');

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUserId();

  const claimed = useMemo(() => getClaimed(uid), [uid, version]);
  const filtered = claimed.filter((c) => {
    const s = SKILLS_CATALOG.find((x) => x.id === c.skillId);
    return !search || s?.name.toLowerCase().includes(search.toLowerCase());
  });
  const available = SKILLS_CATALOG.filter((s) => !claimed.some((c) => c.skillId === s.id));

  const bump = () => {
    refreshGaps(uid);
    setVersion((v) => v + 1);
  };

  const add = () => {
    if (!newSkill) return;
    addClaimed(newSkill, newLevel, years, uid);
    setNewSkill('');
    bump();
  };

  const save = () => {
    saveResume({ summary, experience, education, links, rawText: `${summary}\n${experience}` }, uid);
    setResumeMsg(`Saved · ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setResumeMsg(''), 2500);
  };

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">My Skills</h1>
          <p>Skill Management · Resume · Assessment entry · Progress</p>
        </div>
        {claimed.length === 0 && (
          <Button
            size="sm"
            onClick={() => {
              seedStarterSkills(uid);
              bump();
            }}
          >
            Add 3 starter skills
          </Button>
        )}
      </div>

      <Card title="Add a skill" subtitle="Claim first — assess right after.">
        <div className="input-group">
          <Select
            label="Skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            options={available.map((s) => ({ value: s.id, label: `${s.name} (${s.category})` }))}
            placeholder={available.length ? 'Choose a skill…' : 'All catalog skills claimed 🎉'}
          />
          <Select
            label="Self level"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' },
            ]}
          />
          <Input
            label="Years"
            type="number"
            min={0}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          />
        </div>
        <Button size="sm" onClick={add} disabled={!newSkill}>
          Claim skill
        </Button>
      </Card>

      <div className="mt-4">
        <Input placeholder="Search claimed skills…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search skills" />
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyCta
            title="No skills yet"
            message="Claim your first skill, then run an AI assessment to turn it into proof."
            to={paths.onboarding}
            action="Start onboarding"
          />
        ) : (
          <Table
            columns={[
              {
                key: 'skill',
                header: 'Skill',
                render: (r) => (
                  <div>
                    <strong>{SKILLS_CATALOG.find((s) => s.id === r.skillId)?.name}</strong>
                    <div className="tiny muted">{SKILLS_CATALOG.find((s) => s.id === r.skillId)?.category}</div>
                  </div>
                ),
              },
              { key: 'level', header: 'Self level', render: (r) => <LevelBadge level={r.selfLevel} /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'result',
                header: 'Latest score',
                render: (r) => {
                  const res = latestResultForSkill(r.skillId, uid);
                  return res ? <Badge variant="success">{res.score} · {res.level}</Badge> : <span className="tiny">—</span>;
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => {
                  const a = assessmentsForSkill(r.skillId)[0];
                  return (
                    <div className="row">
                      {a && (
                        <Link className="btn btn--primary btn--sm" to={`/skills/assessment/${a.id}`}>
                          Assess
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          removeClaimed(r.id, uid);
                          bump();
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            rows={filtered.map((c) => ({ ...c }))}
          />
        )}
      </div>

      <Card title="Resume" subtitle="Stored locally · feeds readiness in Part 3" className="mt-4">
        <Textarea label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <Textarea label="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
        <div className="input-group">
          <Input label="Education" value={education} onChange={(e) => setEducation(e.target.value)} />
          <Input label="Links (portfolio, GitHub)" value={links} onChange={(e) => setLinks(e.target.value)} />
        </div>
        <div className="row">
          <Button size="sm" onClick={save}>
            Save resume
          </Button>
          {resumeMsg && <span className="tiny muted">{resumeMsg}</span>}
        </div>
      </Card>
    </div>
  );
}
