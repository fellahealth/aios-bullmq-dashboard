import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pause,
  Play,
  Trash2,
  RotateCcw,
  ArrowUp,
  Plus,
  ChevronsUp,
  Search,
  X,
} from 'lucide-react';
import { useQueue, useJobSearch } from '../hooks/useQueues';
import { useSettings } from '../hooks/useSettings';
import { useConfirm } from '../hooks/useConfirm';
import { api } from '../lib/api';
import { StatusTabs } from '../components/StatusTabs';
import { JobTable } from '../components/JobTable';
import { Pagination } from '../components/Pagination';
import { AddJobModal } from '../components/AddJobModal';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [addJobOpen, setAddJobOpen] = useState(false);

  // Debounce the search input by 300ms so we don't fire a server scan on
  // every keystroke. The server endpoint walks up to 1000 jobs per call.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the active search term changes.
  useEffect(() => {
    setSearchPage(1);
  }, [debouncedSearch, status]);

  const { queue, isLoading } = useQueue(queueName, {
    status,
    page,
    jobsPerPage,
  });

  const isSearching = debouncedSearch.trim().length > 0;
  const searchQuery = useJobSearch(queueName, {
    q: debouncedSearch,
    status,
    limit: 1000,
  });
  const searchData = searchQuery.data;

  // When searching, paginate the matched set client-side using the user's
  // jobsPerPage preference. When not searching, fall through to whatever
  // the server returned for the current page.
  const displayJobs = useMemo(() => {
    if (!isSearching) return queue?.jobs ?? [];
    const all = searchData?.jobs ?? [];
    const start = (searchPage - 1) * jobsPerPage;
    return all.slice(start, start + jobsPerPage);
  }, [isSearching, queue?.jobs, searchData?.jobs, searchPage, jobsPerPage]);

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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddJobOpen(true)}
              title="Enqueue a new job"
            >
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
            {isSearching ? (
              <>
                {searchQuery.isFetching ? (
                  'Searching…'
                ) : (
                  <>
                    {searchData?.total ?? 0} match{(searchData?.total ?? 0) === 1 ? '' : 'es'} in{' '}
                    <span className="text-[var(--color-fg-muted)] tabular-nums">
                      {formatNumber(searchData?.scanned ?? 0)}
                    </span>{' '}
                    scanned
                    {searchData?.capped && ' (capped)'}
                  </>
                )}
              </>
            ) : (
              <>
                {queue.pagination.range.start + 1}–
                {Math.min(queue.pagination.range.end + 1, queue.counts[status] ?? 0)} of{' '}
                <span className="text-[var(--color-fg-muted)] tabular-nums">
                  {formatNumber(queue.counts[status] ?? 0)}
                </span>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${status} jobs by ID…`}
          className="h-8 w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] pl-8 pr-8 text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-blue-500/50 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isSearching && searchData?.capped && (
        <p className="text-[11px] text-amber-400">
          Scanned the first {formatNumber(searchData.scanned)} {status} jobs. There may be more
          matches past this point — narrow the status or refine your query.
        </p>
      )}

      {isSearching && !searchQuery.isFetching && (searchData?.total ?? 0) === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={`No ${status} jobs match "${debouncedSearch}"`}
          description={`Scanned ${formatNumber(searchData?.scanned ?? 0)} jobs.${searchData?.capped ? ' Results past the scan cap aren\'t included.' : ''}`}
        />
      ) : (
        <JobTable queueName={queue.name} jobs={displayJobs} status={status} />
      )}

      <div className="flex items-center justify-between">
        {queue.globalConcurrency != null && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
            <ArrowUp className="h-3 w-3" />
            Concurrency:{' '}
            <span className="tabular-nums text-[var(--color-fg-muted)]">{queue.globalConcurrency}</span>
          </div>
        )}
        <Pagination
          page={isSearching ? searchPage : page}
          pageCount={
            isSearching
              ? Math.max(1, Math.ceil((searchData?.total ?? 0) / jobsPerPage))
              : queue.pagination.pageCount
          }
          onChange={isSearching ? setSearchPage : setPage}
        />
      </div>

      <AddJobModal
        open={addJobOpen}
        onOpenChange={setAddJobOpen}
        queueName={queue.name}
        queueDisplayName={queue.displayName}
      />
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
