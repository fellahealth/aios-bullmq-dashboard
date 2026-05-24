import { Link, NavLink, useParams } from 'react-router-dom';
import { Layers, Pause, ChevronRight, Settings, Home } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import { useQueues } from '../../hooks/useQueues';
import { uiConfig } from '../../lib/uiConfig';

export function Sidebar() {
  const { data, isLoading } = useQueues();
  const params = useParams<{ queueName?: string }>();
  const queues = data?.queues ?? [];

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/60 backdrop-blur-sm">
      <Brand />

      <div className="px-3 pt-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
            )
          }
        >
          <Home className="h-3.5 w-3.5" />
          Home
          <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </NavLink>
      </div>

      <div className="flex items-center justify-between px-4 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">
        <span>Queues</span>
        {data?.queues && <span>{data.queues.length}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && (
          <div className="space-y-1 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-9 rounded-md" />
            ))}
          </div>
        )}

        {!isLoading && queues.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[var(--color-fg-subtle)]">
            No queues registered.
          </p>
        )}

        <ul className="space-y-0.5">
          {queues.map((q) => {
            const active = (q.counts.active ?? 0) + (q.counts.waiting ?? 0);
            const isCurrent = params.queueName === q.name;
            return (
              <li key={q.name}>
                <NavLink
                  to={`/queue/${encodeURIComponent(q.name)}`}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      isActive || isCurrent
                        ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                        : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
                    )
                  }
                >
                  <span
                    className={cn(
                      'inline-flex h-1.5 w-1.5 rounded-full',
                      q.isPaused
                        ? 'bg-slate-500'
                        : active > 0
                          ? 'bg-blue-400'
                          : 'bg-[var(--color-fg-dim)] group-hover:bg-[var(--color-fg-subtle)]'
                    )}
                  />
                  <span className="flex-1 truncate">{q.displayName ?? q.name}</span>
                  {q.isPaused ? (
                    <Pause className="h-3 w-3 text-slate-400" />
                  ) : (
                    active > 0 && (
                      <span className="rounded-full bg-blue-500/15 px-1.5 text-[10px] font-medium text-blue-300">
                        {formatNumber(active)}
                      </span>
                    )
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <Footer />
    </aside>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 border-b border-[var(--color-border-subtle)] px-4 py-4 hover:bg-[var(--color-surface-2)]/60"
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 shadow-sm">
        <Layers className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-[var(--color-fg)]">
          {uiConfig.title ?? 'BullMQ Dashboard'}
        </p>
        {uiConfig.subtitle && (
          <p className="truncate text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
            {uiConfig.subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <div className="border-t border-[var(--color-border-subtle)] px-3 py-3">
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
            isActive
              ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )
        }
      >
        <Settings className="h-3.5 w-3.5" />
        Settings
        <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
      </NavLink>
    </div>
  );
}
