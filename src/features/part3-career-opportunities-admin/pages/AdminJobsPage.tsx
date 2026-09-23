import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge, Button, Card, Input, Select, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import type { SkillLevel } from '@/types';
import {
  addOpportunity,
  allOpportunities,
  currentUser,
  removeCustomOpportunity,
} from '../services/part3-store';
import { SKILLS_CATALOG } from '@/features/part1-user-skill-intelligence/data/catalog';
import { skillById } from '@/features/part1-user-skill-intelligence/data/catalog';
import { AdminNote } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function AdminJobsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'job' | 'internship'>('job');
  const [location, setLocation] = useState('Remote');
  const [remote, setRemote] = useState(true);
  const [skillId, setSkillId] = useState('sk_js');
  const [minLevel, setMinLevel] = useState<SkillLevel>('intermediate');

  if (!user) return <Navigate to={paths.login} replace />;
  const opps = useMemo(() => allOpportunities(), [version]);
  const customCount = useMemo(
    () => opps.filter((o) => o.id.startsWith('opp_')).length,
    [opps],
  );

  const add = () => {
    if (!title.trim() || !company.trim()) return;
    addOpportunity({
      title: title.trim(),
      company: company.trim(),
      type,
      location: location.trim() || 'Remote',
      remote,
      requiredSkills: [{ skillId, minLevel }],
      description: `${title.trim()} at ${company.trim()} — added via Admin. Edit expectations with candidates directly.`,
    });
    setTitle('');
    setCompany('');
    setVersion((v) => v + 1);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Admin · Jobs</h1>
        <AdminNote />
      </div>

      <div className="grid grid--3">
        <Card title={String(opps.length)} subtitle="Total opportunities" />
        <Card title={String(opps.filter((o) => o.type === 'job').length)} subtitle="Jobs" />
        <Card title={String(customCount)} subtitle="Added via admin" />
      </div>

      <Card title="Add opportunity" subtitle="Appends to the matching pool instantly" className="mt-4">
        <div className="input-group">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Junior QA Engineer" />
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="input-group">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as 'job' | 'internship')}
            options={[
              { value: 'job', label: 'Job' },
              { value: 'internship', label: 'Internship' },
            ]}
          />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="input-group">
          <Select
            label="Required skill"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            options={SKILLS_CATALOG.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Min level"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value as SkillLevel)}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' },
            ]}
          />
        </div>
        <label className="row small" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Remote
        </label>
        <div className="mt-4">
          <Button size="sm" onClick={add} disabled={!title.trim() || !company.trim()}>
            Publish opportunity
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <Table
          columns={[
            { key: 'title', header: 'Role', render: (r) => <strong className="small">{r.title}</strong> },
            { key: 'co', header: 'Company', render: (r) => r.company },
            { key: 'type', header: 'Type', render: (r) => <Badge>{r.type}</Badge> },
            {
              key: 'reqs',
              header: 'Requires',
              render: (r) => (
                <span className="tiny">
                  {r.requiredSkills.map((q: { skillId: string; minLevel: SkillLevel }) => `${skillById(q.skillId)?.name} (${q.minLevel})`).join(' · ')}
                </span>
              ),
            },
            { key: 'date', header: 'Posted', render: (r) => formatDate(r.postedAt) },
            {
              key: 'del',
              header: '',
              render: (r) =>
                r.id.startsWith('opp_') ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      removeCustomOpportunity(r.id);
                      setVersion((v) => v + 1);
                    }}
                  >
                    Delete
                  </Button>
                ) : (
                  <span className="tiny muted">seed</span>
                ),
            },
          ]}
          rows={opps.map((o) => ({ ...o }))}
        />
      </div>
    </div>
  );
}
