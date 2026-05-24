import { Link } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import type { AppJob, Status } from '../lib/types';
import { cn, formatRelative, formatDurationMs } from '../lib/utils';

interface Props {
  queueName: string;
  jobs: AppJob[];
  status: Status;
}

export function JobTable({ queueName, jobs, status }: Props) {
  if (!jobs.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/40 px-6 py-14 text-center text-sm text-[var(--color-fg-subtle)]">
        No jobs in this status.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/60">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
            <Th className="w-[26ch]">Job ID</Th>
            <Th>Name</Th>
            <Th className="w-[14ch]">Created</Th>
            <Th className="w-[14ch]">Duration</Th>
            <Th className="w-[10ch] text-center">Attempts</Th>
            <Th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow key={String(job.id)} job={job} queueName={queueName} status={status} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobRow({
  job,
  queueName,
  status,
}: {
  job: AppJob;
  queueName: string;
  status: Status;
}) {
  const duration =
    job.finishedOn && job.processedOn
      ? job.finishedOn - job.processedOn
      : job.processedOn
        ? Date.now() - job.processedOn
        : null;

  const progress = typeof job.progress === 'number' ? job.progress : null;
  const isFailed = status === 'failed' || job.isFailed;

  return (
    <tr className="group border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-2)]/60">
      <Td>
        <Link
          to={`/queue/${encodeURIComponent(queueName)}/${encodeURIComponent(String(job.id ?? ''))}`}
          title={`#${String(job.id)}`}
          className="block truncate font-mono text-xs text-[var(--color-fg-muted)] hover:text-blue-300"
        >
          #{String(job.id)}
        </Link>
      </Td>
      <Td>
        <div className="flex items-center gap-2">
          {isFailed && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />}
          <span className="truncate text-[var(--color-fg)]">{job.name}</span>
          {progress != null && progress > 0 && progress < 100 && (
            <ProgressBar value={progress} />
          )}
        </div>
        {isFailed && job.failedReason && (
          <p className="mt-0.5 truncate text-[11px] text-red-300/80">{job.failedReason}</p>
        )}
      </Td>
      <Td className="whitespace-nowrap text-xs text-[var(--color-fg-muted)]">
        {formatRelative(job.timestamp)}
      </Td>
      <Td className="whitespace-nowrap text-xs text-[var(--color-fg-muted)]">
        {formatDurationMs(duration)}
      </Td>
      <Td className="text-center">
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] tabular-nums',
            job.attempts > 1
              ? 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30'
              : 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]'
          )}
        >
          {job.attempts ?? 0}
        </span>
      </Td>
      <Td>
        <Link
          to={`/queue/${encodeURIComponent(queueName)}/${encodeURIComponent(String(job.id ?? ''))}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)] group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Td>
    </tr>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className="ml-auto inline-flex items-center gap-1.5">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <span
          className="block h-full bg-blue-400 transition-[width]"
          style={{ width: `${v}%` }}
        />
      </span>
      <span className="text-[10px] tabular-nums text-[var(--color-fg-muted)]">{v.toFixed(0)}%</span>
    </span>
  );
}

function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th className={cn('px-3 py-1.5 text-left font-semibold', className)}>{children}</th>
  );
}

function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn('px-3 py-1.5 align-middle', className)}>{children}</td>;
}
