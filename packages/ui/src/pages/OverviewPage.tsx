import { useMemo, useState } from 'react';
import { Inbox, Search, X } from 'lucide-react';
import { useQueues } from '../hooks/useQueues';
import { QueueCard } from '../components/QueueCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PRIMARY_STATUSES, STATUS_META } from '../lib/status';
import { formatNumber } from '../lib/utils';

export default function OverviewPage() {
  const { data, isLoading, isError } = useQueues();
  const queues = data?.queues ?? [];
  const [filter, setFilter] = useState('');

  const totals = useMemo(() => {
    const out: Record<string, number> = {
      active: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    };
    for (const q of queues) {
      for (const s of PRIMARY_STATUSES) {
        out[s] = (out[s] ?? 0) + (q.counts[s] ?? 0);
      }
    }
    return out;
  }, [queues]);

  const filteredQueues = useMemo(() => {
    if (!filter) return queues;
    const q = filter.toLowerCase();
    return queues.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.displayName ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q)
    );
  }, [queues, filter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
          Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">
          Live view of all queues, their throughput and health.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PRIMARY_STATUSES.map((s) => (
          <StatTile key={s} status={s} value={totals[s] ?? 0} />
        ))}
      </section>

      <section>
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            Queues
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search queues…"
                className="h-8 w-56 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] pl-8 pr-7 text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-blue-500/50 focus:outline-none"
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {data && (
              <span className="text-xs text-[var(--color-fg-subtle)]">
                {filter
                  ? `${filteredQueues.length} of ${queues.length}`
                  : `${queues.length} queue${queues.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>
        </header>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            title="Couldn't reach the dashboard API"
            description="Check that the server adapter is mounted and the Redis connection is healthy."
          />
        )}

        {!isLoading && !isError && queues.length === 0 && (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No queues registered"
            description="Register your BullMQ queues with the dashboard adapter to see them here."
          />
        )}

        {!isLoading && queues.length > 0 && filteredQueues.length === 0 && (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title={`No queues match "${filter}"`}
            description="Try a different search term, or clear the filter to see all queues."
          />
        )}

        {!isLoading && filteredQueues.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQueues.map((queue) => (
              <QueueCard key={queue.name} queue={queue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  status,
  value,
}: {
  status: keyof typeof STATUS_META;
  value: number;
}) {
  const meta = STATUS_META[status];
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: meta.color, opacity: 0.6 }}
      />
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
        <span>{meta.label}</span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-fg)]">
        {formatNumber(value)}
      </p>
    </div>
  );
}
