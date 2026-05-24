import axios, { AxiosInstance } from 'axios';
import type {
  AppJob,
  GetJobResponse,
  GetQueuesResponse,
  JobCleanStatus,
  JobRetryStatus,
  RedisStats,
  Status,
} from './types';

function getBasePath() {
  const base = document.querySelector('base')?.getAttribute('href') ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

const http: AxiosInstance = axios.create({
  baseURL: `${getBasePath()}api`,
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);

export const api = {
  getQueues(params: {
    activeQueue?: string;
    status?: Status;
    page?: number | string;
    jobsPerPage?: number;
  }): Promise<GetQueuesResponse> {
    return http.get('/queues', { params }) as unknown as Promise<GetQueuesResponse>;
  },

  getJob(queueName: string, jobId: AppJob['id']): Promise<GetJobResponse> {
    return http.get(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}`
    ) as unknown as Promise<GetJobResponse>;
  },

  getJobLogs(queueName: string, jobId: AppJob['id']): Promise<string[]> {
    return http.get(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}/logs`
    ) as unknown as Promise<string[]>;
  },

  retryJob(queueName: string, jobId: AppJob['id']) {
    return http.put(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}/retry`
    );
  },
  cleanJob(queueName: string, jobId: AppJob['id']) {
    return http.put(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}/clean`
    );
  },
  promoteJob(queueName: string, jobId: AppJob['id']) {
    return http.put(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}/promote`
    );
  },
  updateJobData(queueName: string, jobId: AppJob['id'], data: Record<string, any>) {
    return http.patch(
      `/queues/${encodeURIComponent(queueName)}/${encodeURIComponent(String(jobId))}/update-data`,
      data
    );
  },

  retryAll(queueName: string, status: JobRetryStatus) {
    return http.put(
      `/queues/${encodeURIComponent(queueName)}/retry/${encodeURIComponent(status)}`
    );
  },
  cleanAll(queueName: string, status: JobCleanStatus) {
    return http.put(
      `/queues/${encodeURIComponent(queueName)}/clean/${encodeURIComponent(status)}`
    );
  },
  promoteAll(queueName: string) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/promote`);
  },
  pauseQueue(queueName: string) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/pause`);
  },
  resumeQueue(queueName: string) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/resume`);
  },
  emptyQueue(queueName: string) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/empty`);
  },
  obliterateQueue(queueName: string) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/obliterate`);
  },
  setConcurrency(queueName: string, concurrency: number) {
    return http.put(`/queues/${encodeURIComponent(queueName)}/concurrency`, { concurrency });
  },
  addJob(queueName: string, body: { name: string; data: any; opts?: any }) {
    return http.post(`/queues/${encodeURIComponent(queueName)}/add`, body);
  },

  pauseAll() {
    return http.put('/queues/pause');
  },
  resumeAll() {
    return http.put('/queues/resume');
  },
  redisStats(): Promise<RedisStats> {
    return http.get('/redis/stats') as unknown as Promise<RedisStats>;
  },
};
