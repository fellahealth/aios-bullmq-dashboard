import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pause, Play, Trash2, RotateCcw, ArrowUp, Plus, ChevronsUp } from 'lucide-react';
import { useQueue } from '../hooks/useQueues';
import { useSettings } from '../hooks/useSettings';
import { useConfirm } from '../hooks/useConfirm';
import { api } from '../lib/api';
import { StatusTabs } from '../components/StatusTabs';
import { JobTable } from '../components/JobTable';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import type { JobCleanStatus, Status } from '../lib/types';
import { formatNumber } from '../lib/utils';

export default function QueuePage() {
  const { queueName } = useParams<{ queueName: string }>();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as Status) ?? 'active';
  const page = Number(params.get('page') ?? '1');
  const { jobsPerPage } = useSettings();

  const qc = useQueryClient();
  const confirm = useConfirm();
  const { queue, isLoading } = useQueue(queueName, {
    status,
    page,
    jobsPerPage,
  });

  const setStatus = (s: Status) => {
    params.set('status', s);
    params.set('page', '1');
    setParams(params);
  };
  const setPage = (p: number) => {
    params.set('page', String(p));
    setParams(params);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['queues'] });

  const pause = useMutation({
    mutationFn: () => api.pauseQueue(queueName!),
    onSuccess: invalidate,
  });
  const resume = useMutation({
    mutationFn: () => api.resumeQueue(queueName!),
    onSuccess: invalidate,
  });
  const retryAll = useMutation({
    mutationFn: () => api.retryAll(queueName!, status === 'completed' ? 'completed' : 'failed'),
    onSuccess: invalidate,
  });
  const cleanAll = useMutation({
    mutationFn: () => api.cleanAll(queueName!, status as JobCleanStatus),
    onSuccess: invalidate,
  });
  const promoteAll = useMutation({
    mutationFn: () => api.promoteAll(queueName!),
    onSuccess: invalidate,
  });

  const handlePause = async () => {
    if (
      await confirm({
        title: `Pause "${queue?.displayName ?? queueName}"?`,
        description:
          'New jobs will queue up but won\'t be processed until you resume. In-flight jobs are not affected.',
        confirmText: 'Pause',
        icon: <Pause />,
      })
    ) {
      pause.mutate();
    }
  };

  const handleResume = async () => {
    if (
      await confirm({
        title: `Resume "${queue?.displayName ?? queueName}"?`,
        description: 'Queued jobs will start processing again.',
        confirmText: 'Resume',
        icon: <Play />,
      })
    ) {
      resume.mutate();
    }
  };

  const handlePromoteAll = async () => {
    if (
      await confirm({
        title: `Promote all delayed jobs?`,
        description:
          'Every delayed job in this queue moves to waiting and runs as soon as a worker is free.',
        confirmText: 'Promote all',
        icon: <ChevronsUp />,
      })
    ) {
      promoteAll.mutate();
    }
  };

  const handleRetryAll = async () => {
    if (
      await confirm({
        title: `Retry all ${status} jobs?`,
        description: 'Each job re-enters the waiting state and will be picked up by a worker.',
        confirmText: 'Retry all',
        icon: <RotateCcw />,
      })
    ) {
      retryAll.mutate();
    }
  };

  const handleCleanAll = async () => {
    if (
      await confirm({
        title: `Clean all ${status} jobs?`,
        description: `This permanently removes every ${status} job from "${queue?.displayName ?? queueName}". Cannot be undone.`,
        confirmText: 'Clean all',
        variant: 'danger',
        icon: <Trash2 />,
      })
    ) {
      cleanAll.mutate();
    }
  };

  if (isLoading || !queue) {
    return <QueuePageSkeleton />;
  }

  const canRetry = status === 'failed' || status === 'completed';
  const canClean: JobCleanStatus[] = ['completed', 'wait', 'active', 'delayed', 'failed'];
  const isCleanable = canClean.includes(status as JobCleanStatus);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
              {queue.displayName ?? queue.name}
            </h1>
            {queue.isPaused && <Badge tone="neutral">Paused</Badge>}
            <Badge tone="info">{queue.type}</Badge>
          </div>
          {queue.description && (
            <p className="mt-1 text-sm text-[var(--color-fg-subtle)]">{queue.description}</p>
          )}
        </div>

        {!queue.readOnlyMode && (
          <div className="flex flex-wrap items-center gap-2">
            {queue.isPaused ? (
              <Button onClick={handleResume} variant="secondary" size="sm">
                <Play className="h-3.5 w-3.5" /> Resume
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="sm">
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}
            {status === 'delayed' && (
              <Button onClick={handlePromoteAll} variant="secondary" size="sm">
                <ChevronsUp className="h-3.5 w-3.5" /> Promote all
              </Button>
            )}
            {canRetry && queue.allowRetries && (
              <Button onClick={handleRetryAll} variant="secondary" size="sm">
                <RotateCcw className="h-3.5 w-3.5" /> Retry all
              </Button>
            )}
            {isCleanable && (
              <Button onClick={handleCleanAll} variant="outline" size="sm">
                <Trash2 className="h-3.5 w-3.5" /> Clean all
              </Button>
            )}
            <Button variant="primary" size="sm" disabled title="Add job coming soon">
              <Plus className="h-3.5 w-3.5" /> Add job
            </Button>
          </div>
        )}
      </header>

      <Card>
        <CardBody className="flex items-center justify-between gap-3">
          <StatusTabs
            counts={queue.counts}
            statuses={queue.statuses}
            active={status}
            onChange={setStatus}
          />
          <div className="text-xs text-[var(--color-fg-subtle)]">
            {queue.pagination.range.start + 1}–
            {Math.min(queue.pagination.range.end + 1, queue.counts[status] ?? 0)} of{' '}
            <span className="text-[var(--color-fg-muted)] tabular-nums">
              {formatNumber(queue.counts[status] ?? 0)}
            </span>
          </div>
        </CardBody>
      </Card>

      <JobTable queueName={queue.name} jobs={queue.jobs} status={status} />

      <div className="flex items-center justify-between">
        {queue.globalConcurrency != null && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
            <ArrowUp className="h-3 w-3" />
            Concurrency:{' '}
            <span className="tabular-nums text-[var(--color-fg-muted)]">{queue.globalConcurrency}</span>
          </div>
        )}
        <Pagination
          page={page}
          pageCount={queue.pagination.pageCount}
          onChange={setPage}
        />
      </div>
    </div>
  );
}

function QueuePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-14" />
      <Skeleton className="h-80" />
    </div>
  );
}
