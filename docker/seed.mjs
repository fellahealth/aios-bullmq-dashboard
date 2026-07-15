import { Queue, Worker } from 'bullmq';

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = { url };

const QUEUES = ['emails', 'reports', 'image-processing', 'webhooks'];
const queues = Object.fromEntries(QUEUES.map((name) => [name, new Queue(name, { connection })]));

const workers = QUEUES.map(
  (name) =>
    new Worker(
      name,
      async (job) => {
        await new Promise((r) => setTimeout(r, 500 + Math.floor(job.timestamp % 2000)));
        if (job.data.shouldFail) throw new Error('Simulated processing failure');
        return { ok: true };
      },
      { connection, concurrency: 2 }
    )
);

let n = 0;
async function tick() {
  n += 1;
  const name = QUEUES[n % QUEUES.length];
  const shouldFail = n % 5 === 0;
  const delay = n % 7 === 0 ? 15000 : 0;
  await queues[name].add(
    `job-${n}`,
    { seq: n, shouldFail, at: `t+${n}` },
    { delay, attempts: 2, removeOnComplete: 50, removeOnFail: 50 }
  );
}

console.log(`Seeding demo jobs into ${url} across: ${QUEUES.join(', ')}`);
setInterval(() => {
  tick().catch((e) => console.error('seed tick failed:', e.message));
}, 1200);

const shutdown = async () => {
  await Promise.all(workers.map((w) => w.close().catch(() => {})));
  await Promise.all(Object.values(queues).map((q) => q.close().catch(() => {})));
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
