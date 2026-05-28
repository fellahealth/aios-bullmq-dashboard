import { useMemo, useState } from 'react';
import { Filter, Inbox, LayoutGrid, Rows3, Search, X } from 'lucide-react';
import { useQueues } from '../hooks/useQueues';
import { useSettings } from '../hooks/useSettings';
import { QueueCard } from '../components/QueueCard';
import { QueueTable } from '../components/QueueTable';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PRIMARY_STATUSES, STATUS_META } from '../lib/status';
import type { Status } from '../lib/types';
import { cn, formatNumber } from '../lib/utils';
import type { OverviewView } from '../lib/settings';

type StatusFilter = Status | 'all';

export default function OverviewPage() {
  const { data, isLoading, isError } = useQueues();
  const { overviewView, set } = useSettings();
  const queues = data?.queues ?? [];
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const queuesByStatus = useMemo(() => {
    if (statusFilter === 'all') return queues;
    return queues.filter((q) => (q.counts[statusFilter] ?? 0) > 0);
  }, [queues, statusFilter]);

  const filteredQueues = useMemo(() => {
    if (!filter) return queuesByStatus;
    const q = filter.toLowerCase();
    return queuesByStatus.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.displayName ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q)
    );
  }, [queuesByStatus, filter]);

  const isFiltered = !!filter || statusFilter !== 'all';

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
            <StatusSelect
              value={statusFilter}
              onChange={setStatusFilter}
              counts={queues}
            />
            <ViewToggle
              value={overviewView}
              onChange={(v) => set('overviewView', v)}
            />
            {data && (
              <span className="text-xs text-[var(--color-fg-subtle)]">
                {isFiltered
                  ? `${filteredQueues.length} of ${queues.length}`
                  : `${queues.length} queue${queues.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>
        </header>

        {isLoading && overviewView === 'cards' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}

        {isLoading && overviewView === 'table' && (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
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
            title={
              filter
                ? `No queues match "${filter}"`
                : `No queues with ${STATUS_META[statusFilter as Status]?.label.toLowerCase()} jobs`
            }
            description="Try a different filter, or clear it to see all queues."
          />
        )}

        {!isLoading && filteredQueues.length > 0 && overviewView === 'cards' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQueues.map((queue) => (
              <QueueCard key={queue.name} queue={queue} />
            ))}
          </div>
        )}

        {!isLoading && filteredQueues.length > 0 && overviewView === 'table' && (
          <QueueTable queues={filteredQueues} />
        )}
      </section>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: ReadonlyArray<{ counts: Partial<Record<Status, number>> }>;
}) {
  const dotColor = value === 'all' ? undefined : STATUS_META[value as Status]?.color;
  const queuesWithStatus = (s: Status) =>
    counts.reduce((n, q) => n + ((q.counts[s] ?? 0) > 0 ? 1 : 0), 0);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center text-[var(--color-fg-subtle)]">
        {dotColor ? (
          <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
        ) : (
          <Filter className="h-3.5 w-3.5" />
        )}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StatusFilter)}
        aria-label="Filter queues by status"
        className="h-8 appearance-none rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] pl-7 pr-6 text-xs text-[var(--color-fg)] focus:border-blue-500/50 focus:outline-none"
      >
        <option value="all">All statuses ({counts.length})</option>
        {PRIMARY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label} ({queuesWithStatus(s)})
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 h-2 w-2.5 -translate-y-1/2 text-[var(--color-fg-subtle)]"
      >
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: OverviewView;
  onChange: (v: OverviewView) => void;
}) {
  const options: Array<{ id: OverviewView; label: string; Icon: typeof LayoutGrid }> = [
    { id: 'cards', label: 'Card view', Icon: LayoutGrid },
    { id: 'table', label: 'Table view', Icon: Rows3 },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Queue layout"
      className="inline-flex h-8 items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-0.5"
    >
      {options.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-full items-center justify-center rounded-[5px] px-2 text-[var(--color-fg-subtle)] transition-colors',
              active
                ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] shadow-sm'
                : 'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
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
