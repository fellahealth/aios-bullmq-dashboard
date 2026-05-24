import {
  AppJob,
  ControllerHandlerReturnType,
  DashboardRequest,
  JobStatus,
  QueueJob,
  Status,
} from '../../typings/app';
import { queueProvider } from '../providers/queue';
import { BaseAdapter } from '../queueAdapters/base';
import { formatJob } from './queues';

// Hard cap on how many jobs we'll scan for a single search request. Search
// is a linear scan over the status set (see comment on `searchJobsHandler`
// below) so this bounds the worst-case latency and Redis pressure. Callers
// can request a smaller limit via `?limit=` but never a larger one.
const MAX_SCAN = 1000;
const DEFAULT_SCAN = 1000;

export interface SearchJobsResponse {
  jobs: AppJob[];
  scanned: number;
  capped: boolean;
  total: number;
}

/**
 * Server-side job search — **by job ID only**.
 *
 * Why ID-only and not also name/data/failedReason:
 *
 * Bull and BullMQ store jobs in Redis. Each job *status* (waiting, active,
 * delayed, …) is a list or sorted set of *just the job IDs*. The job's
 * actual payload (name, data, failedReason, opts) lives in a separate
 * hash keyed by ID. There is no full-text index over those hash values.
 *
 * That means:
 *
 *  - Searching by ID is cheap. We can read the IDs straight from the
 *    status set and do a string compare in memory. No per-job round-trip
 *    to Redis until we know we want to return that job.
 *
 *  - Searching by name/data would require fetching every job's hash and
 *    parsing JSON. For a queue with 100k delayed jobs that's tens of
 *    thousands of Redis reads per keystroke — a great way to take Redis
 *    down. We deliberately don't support it here.
 *
 * Algorithm:
 *
 *   1. **Exact ID match (fast path).** If the query is non-empty, ask the
 *      queue for that exact ID first. If it exists, return it immediately
 *      — O(1) hash GET. This covers the "I have the job ID from a log
 *      line, find it" case in a single Redis round-trip.
 *
 *   2. **Capped substring scan (fallback).** Pull up to `limit` jobs from
 *      the requested status (`getJobs` is the same primitive the table
 *      uses), filter their IDs by case-insensitive substring, return what
 *      matches. We tell the client whether we hit the scan cap so the UI
 *      can warn that results past that point may exist.
 *
 * For exhaustive search across millions of jobs the right answer is an
 * external index (Meilisearch, Postgres GIN, RediSearch) fed by job
 * lifecycle events — out of scope for the dashboard, but the architecture
 * leaves room for it: callers query this endpoint by ID; an indexer
 * service would expose its own and the UI would target whichever exists.
 */
async function searchJobs(
  req: DashboardRequest,
  queue: BaseAdapter
): Promise<ControllerHandlerReturnType> {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
  // `Status` includes the synthetic 'latest' value which means "every
  // status combined" — `JobStatus` excludes it, so we need the broader
  // type here and resolve to a JobStatus[] before calling getJobs.
  const status: Status = (req.query.status as Status) || 'latest';

  const requestedLimit = Number(req.query.limit);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_SCAN)
      : DEFAULT_SCAN;

  const q = rawQuery.trim();
  if (!q) {
    const body: SearchJobsResponse = { jobs: [], scanned: 0, capped: false, total: 0 };
    return { body };
  }

  // 1. Fast path: exact ID match. O(1) hash GET. If the user pasted a
  // full job ID we're done before any scanning happens.
  try {
    const exact = await queue.getJob(q);
    if (exact) {
      return {
        body: {
          jobs: [formatJob(exact, queue)],
          scanned: 1,
          capped: false,
          total: 1,
        } satisfies SearchJobsResponse,
      };
    }
  } catch {
    // `getJob` on Bull legacy can throw for malformed IDs — treat as "not
    // an exact match" and fall through to the scan.
  }

  // 2. Substring scan, ID only. Pull up to `limit` jobs from the requested
  // status set and check their IDs in memory.
  const statuses: JobStatus[] =
    status === 'latest' ? queue.getJobStatuses() : ([status] as JobStatus[]);

  const rawJobs: QueueJob[] = await queue.getJobs(statuses, 0, limit - 1);
  const scanned = rawJobs.length;
  const capped = scanned >= limit;

  const needle = q.toLowerCase();
  const matches: AppJob[] = [];
  for (const job of rawJobs) {
    if (!job) continue;
    const id = String(job.toJSON().id ?? '').toLowerCase();
    if (id.includes(needle)) {
      matches.push(formatJob(job, queue));
    }
  }

  const body: SearchJobsResponse = {
    jobs: matches,
    scanned,
    capped,
    total: matches.length,
  };
  return { body };
}

export const searchJobsHandler = queueProvider(searchJobs, { skipReadOnlyModeCheck: true });
