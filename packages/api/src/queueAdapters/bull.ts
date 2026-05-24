import BullQueue, { Job, Queue } from 'bull';

import {
  JobCleanStatus,
  JobCounts,
  JobStatus,
  QueueAdapterOptions,
  QueueJobOptions,
  Status,
} from '../../typings/app';
import { STATUSES } from '../constants/statuses';
import { BaseAdapter } from './base';

export class BullAdapter extends BaseAdapter {
  constructor(
    public queue: Queue,
    options: Partial<QueueAdapterOptions> = {}
  ) {
    super('bull', { ...options, allowCompletedRetries: false });

    if (!(queue instanceof BullQueue)) {
      throw new Error(`You've used the Bull adapter with a non-Bull queue.`);
    }
  }

  public getRedisInfo(): Promise<string> {
    return this.queue.client.info();
  }

  public getName(): string {
    return `${this.prefix}${this.queue.name}`;
  }

  public clean(jobStatus: JobCleanStatus, graceTimeMs: number): Promise<any> {
    return this.queue.clean(graceTimeMs, jobStatus as any);
  }

  public addJob(name: string, data: any, options: QueueJobOptions) {
    return this.queue.add(name, data, options);
  }

  public async getJob(id: string): Promise<Job | undefined | null> {
    const job = await this.queue.getJob(id);
    return job && this.alignJobData(job);
  }

  public async getJobs(
    jobStatuses: JobStatus<'bull'>[],
    start?: number,
    end?: number
  ): Promise<Job[]> {
    const jobs = await this.queue.getJobs(jobStatuses, start, end);
    return jobs.map(this.alignJobData);
  }

  public getJobCounts(): Promise<JobCounts> {
    return this.queue.getJobCounts() as unknown as Promise<JobCounts>;
  }

  public getJobLogs(id: string): Promise<string[]> {
    return this.queue.getJobLogs(id).then(({ logs }: { logs: string[] }) => logs);
  }

  public isPaused(): Promise<boolean> {
    return this.queue.isPaused();
  }

  public pause(): Promise<void> {
    return this.queue.pause();
  }

  public resume(): Promise<void> {
    return this.queue.resume();
  }

  public empty(): Promise<void> {
    return this.queue.empty();
  }

  public obliterate(): Promise<void> {
    return this.queue.obliterate({ force: false });
  }

  public async promoteAll(): Promise<void> {
    const jobs = await this.getJobs([STATUSES.delayed]);
    await Promise.all(jobs.map((job) => job.promote()));
  }

  public async removeJobScheduler(_id: string): Promise<boolean> {
    return false;
  }

  public getStatuses(): Status<'bull'>[] {
    return [
      STATUSES.latest,
      STATUSES.active,
      STATUSES.waiting,
      STATUSES.completed,
      STATUSES.failed,
      STATUSES.delayed,
      STATUSES.paused,
    ];
  }

  public getJobStatuses(): JobStatus<'bull'>[] {
    return [
      STATUSES.active,
      STATUSES.waiting,
      STATUSES.completed,
      STATUSES.failed,
      STATUSES.delayed,
      STATUSES.paused,
    ];
  }

  public async getGlobalConcurrency(): Promise<number | null> {
    return null;
  }

  public async setGlobalConcurrency(_concurrency: number): Promise<void> {
    // Bull does not support global concurrency
  }

  /**
   * Reads the concurrency from any processors registered on this Queue
   * instance in the current process. Bull v4's `Queue.prototype.process`
   * stores handlers as `queue.handlers[name] = { fn, concurrency }`. We
   * sum the concurrencies across all registered handlers (one queue may
   * have multiple named processors, each with its own concurrency).
   *
   * Returns null if no handlers are registered in this process — for
   * example when the dashboard runs in a process separate from the
   * workers. In that case worker-level concurrency is genuinely
   * unknowable from the queue side.
   */
  public async getWorkerConcurrency(): Promise<number | null> {
    const handlers = (this.queue as unknown as { handlers?: Record<string, { concurrency?: number }> })
      .handlers;
    if (!handlers || typeof handlers !== 'object') return null;

    let total = 0;
    let found = false;
    for (const key of Object.keys(handlers)) {
      const entry = handlers[key];
      if (entry && typeof entry.concurrency === 'number' && entry.concurrency > 0) {
        total += entry.concurrency;
        found = true;
      }
    }
    return found ? total : null;
  }

  private alignJobData(job: Job) {
    if (typeof job?.attemptsMade === 'number') {
      job.attemptsMade++;
    }
    return job;
  }
}
