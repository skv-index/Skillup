import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';

export function MatchBadge({ score }: { score: number }) {
  const v = score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger';
  return <Badge variant={v}>{score}% match</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  const v = score >= 70 ? 'success' : score >= 40 ? 'primary' : 'warning';
  return <Badge variant={v}>{score}/100</Badge>;
}

export function EmptyCta3({
  icon = '💼',
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

export function AdminNote() {
  return (
    <p className="tiny muted">
      Admin view · local demo data (this device). Connects to real backend user tables when the API
      lands — no page changes needed.
    </p>
  );
}
