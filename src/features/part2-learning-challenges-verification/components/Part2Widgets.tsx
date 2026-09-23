import { Link } from 'react-router-dom';
import type { SkillLevel } from '@/types';
import { Badge } from '@/components/ui';

export function DifficultyBadge({ level }: { level: SkillLevel }) {
  const v = level === 'beginner' ? 'info' : level === 'intermediate' ? 'primary' : level === 'advanced' ? 'success' : 'warning';
  return <Badge variant={v}>{level}</Badge>;
}

export function PointsBadge({ points }: { points: number }) {
  return <Badge variant="warning">⚡ {points} pts</Badge>;
}

export function EmptyCta2({
  icon = '📚',
  title,
  message,
  to,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  to: string;
  action: string;
}) {
  return (
    <div className="state-block">
      <div className="state-block__icon">{icon}</div>
      <div className="h4">{title}</div>
      <p className="small mt-4">{message}</p>
      <div className="mt-4">
        <Link className="btn btn--primary btn--sm" to={to}>
          {action}
        </Link>
      </div>
    </div>
  );
}
