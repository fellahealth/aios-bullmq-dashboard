import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { uiConfig } from '../lib/uiConfig';
import { useSettings } from './useSettings';
import type { Status } from '../lib/types';

// The server-side UI config can force a polling interval. If set, it wins;
// otherwise the user's local setting controls. 0 disables polling.
function usePollMs() {
  const { pollingInterval } = useSettings();
  const forced = uiConfig.pollingInterval?.forceInterval;
  const ms = typeof forced === 'number' ? forced : pollingInterval;
  return ms > 0 ? ms : false;
}

export function useQueues(params: {
  activeQueue?: string;
  status?: Status;
  page?: number;
  jobsPerPage?: number;
} = {}) {
  const refetchInterval = usePollMs();
  return useQuery({
    queryKey: ['queues', params],
    queryFn: () => api.getQueues(params),
    refetchInterval,
  });
}

export function useQueue(queueName: string | undefined, opts: {
  status?: Status;
  page?: number;
  jobsPerPage?: number;
}) {
  const query = useQueues({
    activeQueue: queueName,
    status: opts.status,
    page: opts.page,
    jobsPerPage: opts.jobsPerPage,
  });
  const queue = query.data?.queues?.find((q) => q.name === queueName);
  return { ...query, queue };
}

export function useJob(queueName: string | undefined, jobId: string | undefined) {
  const refetchInterval = usePollMs();
  return useQuery({
    queryKey: ['job', queueName, jobId],
    queryFn: () => api.getJob(queueName!, jobId!),
    enabled: Boolean(queueName && jobId),
    refetchInterval,
  });
}

export function useJobLogs(queueName: string | undefined, jobId: string | undefined) {
  const refetchInterval = usePollMs();
  return useQuery({
    queryKey: ['logs', queueName, jobId],
    queryFn: () => api.getJobLogs(queueName!, jobId!),
    enabled: Boolean(queueName && jobId),
    refetchInterval,
  });
}

export function useJobSearch(
  queueName: string | undefined,
  params: { q: string; status?: Status; limit?: number }
) {
  return useQuery({
    queryKey: ['search', queueName, params.q, params.status, params.limit],
    queryFn: () => api.searchJobs(queueName!, params),
    // Server scans up to 1000 jobs; no point hammering it. Only run when
    // there's a query AND a queue name. Polling stays off — search results
    // are a snapshot the user can refresh via the topbar.
    enabled: Boolean(queueName && params.q.trim()),
    placeholderData: (prev) => prev,
    refetchInterval: false,
  });
}
