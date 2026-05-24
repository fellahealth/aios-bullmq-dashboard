import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pause, Play, Trash2, RotateCcw, ArrowUp, Plus, ChevronsUp } from 'lucide-react';
import { useQueue } from '../hooks/useQueues';
import { useSettings } from '../hooks/useSettings';
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
              <Button onClick={() => resume.mutate()} variant="secondary" size="sm">
                <Play className="h-3.5 w-3.5" /> Resume
              </Button>
            ) : (
              <Button onClick={() => pause.mutate()} variant="secondary" size="sm">
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}
            {status === 'delayed' && (
              <Button onClick={() => promoteAll.mutate()} variant="secondary" size="sm">
                <ChevronsUp className="h-3.5 w-3.5" /> Promote all
              </Button>
            )}
            {canRetry && queue.allowRetries && (
              <Button onClick={() => retryAll.mutate()} variant="secondary" size="sm">
                <RotateCcw className="h-3.5 w-3.5" /> Retry all
              </Button>
            )}
            {isCleanable && (
              <Button
                onClick={() => {
                  if (confirm(`Clean all ${status} jobs from ${queue.name}?`)) cleanAll.mutate();
                }}
                variant="outline"
                size="sm"
              >
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
