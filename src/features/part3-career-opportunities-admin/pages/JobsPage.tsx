import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, Button, Card, Input, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  currentUser,
  matchAll,
  savedIds,
  toggleSaved,
} from '../services/part3-store';
import { MatchBadge } from '../components/Part3Widgets';
import { formatDate } from '@/lib/utils';
import '../part3.css';

export function JobsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => savedIds());

  if (!user) return <Navigate to={paths.login} replace />;
  const uid = currentUser();
  const matches = useMemo(() => matchAll(uid), [uid]);

  const list = matches.filter((m) => {
    const o = m.opportunity!;
    if (search && !`${o.title} ${o.company}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (type && o.type !== type) return false;
    if (remoteOnly && !o.remote) return false;
    if (savedOnly && !saved.includes(o.id)) return false;
    return true;
  });

  return (
    <div>
      <div className="page-head">
        <h1 className="h2">Jobs & Internships</h1>
        <p>Ranked by your verified → assessed → claimed skill match</p>
      </div>

      <div className="input-group">
        <Input placeholder="Search title or company…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search jobs" />
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: 'job', label: 'Jobs' },
            { value: 'internship', label: 'Internships' },
          ]}
          placeholder="All types"
        />
      </div>
      <div className="row mt-4 small">
        <label className="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} /> Remote only
        </label>
        <label className="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} /> Saved only
        </label>
      </div>

      <div className="grid grid--2 mt-4">
        {list.map((m) => {
          const o = m.opportunity!;
          const isSaved = saved.includes(o.id);
          return (
            <Card
              key={o.id}
              title={o.title}
              subtitle={`${o.company} · ${o.location}`}
              actions={
                <>
                  <Link className="btn btn--primary btn--sm" to={`/jobs/${o.id}`}>
                    Details
                  </Link>
                  <Button
                    size="sm"
                    variant={isSaved ? 'secondary' : 'ghost'}
                    onClick={() => setSaved(toggleSaved(o.id, uid))}
                  >
                    {isSaved ? '★ Saved' : '☆ Save'}
                  </Button>
                </>
              }
            >
              <div className="job-meta">
                <MatchBadge score={m.matchScore} />
                <Badge>{o.type}</Badge>
                {o.remote && <Badge variant="info">remote</Badge>}
                <span className="tiny muted">{formatDate(o.postedAt)}</span>
              </div>
              <p className="small muted mt-4">{o.description.slice(0, 140)}…</p>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && <div className="state-block mt-4">No roles match these filters.</div>}
    </div>
  );
}
