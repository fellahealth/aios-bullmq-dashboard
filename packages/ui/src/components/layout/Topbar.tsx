import { Link, useLocation, useParams } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { uiConfig } from '../../lib/uiConfig';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { useMutation } from '@tanstack/react-query';
import { useConfirm } from '../../hooks/useConfirm';

export function Topbar() {
  const qc = useQueryClient();
  const fetching = useIsFetching();
  const location = useLocation();
  const params = useParams<{ queueName?: string; jobId?: string }>();
  const confirm = useConfirm();

  const pauseAll = useMutation({
    mutationFn: () => api.pauseAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queues'] }),
  });
  const resumeAll = useMutation({
    mutationFn: () => api.resumeAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queues'] }),
  });

  const handlePauseAll = async () => {
    if (
      await confirm({
        title: 'Pause all queues?',
        description:
          'No queues will process new jobs until you resume them. In-flight jobs are not affected.',
        confirmText: 'Pause all',
        icon: <Pause />,
      })
    ) {
      pauseAll.mutate();
    }
  };

  const handleResumeAll = async () => {
    if (
      await confirm({
        title: 'Resume all queues?',
        description: 'All queues will start processing jobs again.',
        confirmText: 'Resume all',
        icon: <Play />,
      })
    ) {
      resumeAll.mutate();
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]/80 px-6 backdrop-blur">
      <Breadcrumbs path={location.pathname} params={params} />

      {uiConfig.environment && (
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            background: uiConfig.environment.color,
            color: uiConfig.environment.textColor ?? '#fff',
          }}
        >
          {uiConfig.environment.label}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {uiConfig.miscLinks?.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
          >
            {link.text}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}

        <Button variant="ghost" size="sm" onClick={handlePauseAll} title="Pause all queues">
          <Pause className="h-3.5 w-3.5" /> Pause all
        </Button>
        <Button variant="ghost" size="sm" onClick={handleResumeAll} title="Resume all queues">
          <Play className="h-3.5 w-3.5" /> Resume all
        </Button>

        <button
          onClick={() => qc.invalidateQueries()}
          className={cn(
            'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
            fetching && 'text-blue-300'
          )}
          title="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', fetching && 'animate-spin')} />
        </button>
      </div>
    </header>
  );
}

function Breadcrumbs({
  path,
  params,
}: {
  path: string;
  params: { queueName?: string; jobId?: string };
}) {
  const crumbs: Array<{ label: string; to?: string }> = [{ label: 'Overview', to: '/' }];
  if (params.queueName) {
    crumbs.push({
      label: decodeURIComponent(params.queueName),
      to: `/queue/${params.queueName}`,
    });
  }
  if (params.jobId) {
    crumbs.push({ label: `Job ${params.jobId}` });
  }
  if (path === '/' && crumbs.length === 1) {
    crumbs[0] = { label: 'Overview' };
  }

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--color-fg-subtle)]" />}
            {c.to && !last ? (
              <Link
                to={c.to}
                className="truncate text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              >
                {c.label}
              </Link>
            ) : (
              <span className={cn('truncate', last ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]')}>
                {c.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
