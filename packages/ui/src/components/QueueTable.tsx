import { Link } from 'react-router-dom';
import { ChevronRight, Pause } from 'lucide-react';
import type { AppQueue } from '../lib/types';
import { PRIMARY_STATUSES, STATUS_META } from '../lib/status';
import { formatNumber } from '../lib/utils';

export function QueueTable({ queues }: { queues: AppQueue[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
            <Th className="text-left">Queue</Th>
            {PRIMARY_STATUSES.map((s) => (
              <Th key={s} className="text-right tabular-nums">
                {STATUS_META[s].label}
              </Th>
            ))}
            <Th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {queues.map((queue) => (
            <QueueRow key={queue.name} queue={queue} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueRow({ queue }: { queue: AppQueue }) {
  const href = `/queue/${encodeURIComponent(queue.name)}`;
  return (
    <tr className="group border-b border-[var(--color-border-subtle)]/60 last:border-b-0 hover:bg-[var(--color-surface-2)]/40">
      <Td className="max-w-0">
        <Link to={href} className="block min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--color-fg)] group-hover:text-blue-300">
              {queue.displayName ?? queue.name}
            </span>
            {queue.isPaused && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-slate-500/30">
                <Pause className="h-2.5 w-2.5" /> paused
              </span>
            )}
          </div>
          {queue.description && (
            <p className="mt-0.5 truncate text-xs text-[var(--color-fg-subtle)]">
              {queue.description}
            </p>
          )}
        </Link>
      </Td>
      {PRIMARY_STATUSES.map((s) => {
        const n = queue.counts[s] ?? 0;
        const meta = STATUS_META[s];
        const dim = n === 0;
        return (
          <Td key={s} className="text-right tabular-nums">
            <span
              className={dim ? 'text-[var(--color-fg-subtle)]' : 'text-[var(--color-fg)]'}
              style={dim ? undefined : { color: meta.color }}
            >
              {formatNumber(n)}
            </span>
          </Td>
        );
      })}
      <Td className="text-right">
        <Link
          to={href}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)] group-hover:opacity-100"
          aria-label={`Open ${queue.displayName ?? queue.name}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Td>
    </tr>
  );
}

function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={`px-3 py-2 font-medium ${className ?? ''}`}>{children}</th>;
}

function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={`px-3 py-2.5 align-middle ${className ?? ''}`}>{children}</td>;
}
