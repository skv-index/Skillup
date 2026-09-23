import { Link } from 'react-router-dom';
import type { SkillLevel, SkillStatus } from '@/types';
import { Badge, ProgressBar } from '@/components/ui';

const LEVEL_VARIANT: Record<SkillLevel, 'info' | 'primary' | 'success' | 'warning'> = {
  beginner: 'info',
  intermediate: 'primary',
  advanced: 'success',
  expert: 'warning',
};

export function LevelBadge({ level }: { level: SkillLevel }) {
  return <Badge variant={LEVEL_VARIANT[level]}>{level}</Badge>;
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  const v = status === 'verified' || status === 'assessed' ? 'success' : status === 'claimed' ? 'info' : 'warning';
  return <Badge variant={v}>{status}</Badge>;
}

export function ScoreBar({ score, label = 'Score' }: { score: number; label?: string }) {
  return <ProgressBar value={score} max={100} label={`${label} · ${score}/100`} />;
}

export function EmptyCta({
  icon = '🌱',
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
