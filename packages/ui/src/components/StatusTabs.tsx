import type { Status, JobCounts } from '../lib/types';
import { STATUS_META, PRIMARY_STATUSES } from '../lib/status';
import { cn, formatNumber } from '../lib/utils';

interface Props {
  counts: Partial<JobCounts>;
  active: Status;
  onChange: (s: Status) => void;
  statuses?: Status[];
}

export function StatusTabs({ counts, active, onChange, statuses }: Props) {
  const list = statuses ?? PRIMARY_STATUSES;

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/60 p-1">
      {list.map((s) => {
        const meta = STATUS_META[s];
        const isActive = active === s;
        const count = counts[s] ?? 0;

        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              'group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
            )}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: meta.color }}
            />
            {meta.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                isActive
                  ? 'bg-[var(--color-surface-4)] text-[var(--color-fg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-fg-subtle)]'
              )}
            >
              {formatNumber(count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
