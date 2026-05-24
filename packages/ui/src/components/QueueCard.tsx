import { Link } from 'react-router-dom';
import { ArrowUpRight, Pause } from 'lucide-react';
import type { AppQueue } from '../lib/types';
import { Card, CardBody, CardHeader } from './ui/Card';
import { STATUS_META, PRIMARY_STATUSES } from '../lib/status';
import { formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';

export function QueueCard({ queue }: { queue: AppQueue }) {
  const total = PRIMARY_STATUSES.reduce((sum, s) => sum + (queue.counts[s] ?? 0), 0);
  const failed = queue.counts.failed ?? 0;
  const failRatio = total > 0 ? failed / total : 0;
  const accent = queue.isPaused
    ? 'from-slate-500/30 to-slate-500/0'
    : failRatio > 0.2
      ? 'from-red-500/30 to-red-500/0'
      : (queue.counts.active ?? 0) > 0
        ? 'from-blue-500/30 to-blue-500/0'
        : 'from-emerald-500/20 to-emerald-500/0';

  return (
    <Card className="group relative overflow-hidden transition-colors hover:border-[var(--color-border-strong)]">
      <div
        className={cn(
          'pointer-events-none absolute -top-px left-0 right-0 h-px bg-gradient-to-r',
          accent
        )}
      />
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/queue/${encodeURIComponent(queue.name)}`}
              className="truncate text-sm font-semibold text-[var(--color-fg)] hover:text-blue-300"
            >
              {queue.displayName ?? queue.name}
            </Link>
            {queue.isPaused && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-slate-500/30">
                <Pause className="h-2.5 w-2.5" /> paused
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-fg-subtle)]">
            <span>
              Concurrency ·{' '}
              <span className="font-medium tabular-nums text-[var(--color-fg-muted)]">
                {queue.globalConcurrency ?? '∞'}
              </span>
            </span>
            {queue.description && (
              <>
                <span className="text-[var(--color-fg-dim)]">·</span>
                <span className="truncate">{queue.description}</span>
              </>
            )}
          </div>
        </div>
        <Link
          to={`/queue/${encodeURIComponent(queue.name)}`}
          className="rounded-md p-1 text-[var(--color-fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)] group-hover:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardBody className="space-y-3">
        <Mini bars={queue} />
        <div className="grid grid-cols-3 gap-2">
          {PRIMARY_STATUSES.slice(0, 6).map((s) => {
            const n = queue.counts[s] ?? 0;
            const meta = STATUS_META[s];
            return (
              <div
                key={s}
                className="flex flex-col gap-0.5 rounded-md border border-[var(--color-border-subtle)]/50 bg-[var(--color-surface-2)]/60 px-2 py-1.5"
              >
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: meta.color }}
                  />
                  {meta.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-fg)]">
                  {formatNumber(n)}
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function Mini({ bars }: { bars: AppQueue }) {
  const data = PRIMARY_STATUSES.map((s) => ({
    s,
    n: bars.counts[s] ?? 0,
  }));
  const total = data.reduce((acc, d) => acc + d.n, 0);
  if (total === 0) {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]" />
    );
  }
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
      {data.map(({ s, n }) => {
        if (n === 0) return null;
        return (
          <div
            key={s}
            title={`${STATUS_META[s].label}: ${n}`}
            style={{
              width: `${(n / total) * 100}%`,
              background: STATUS_META[s].color,
            }}
          />
        );
      })}
    </div>
  );
}
