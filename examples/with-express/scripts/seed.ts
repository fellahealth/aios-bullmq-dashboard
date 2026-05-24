import { Queue, Worker } from 'bullmq';

// Quick seed script: pumps fake jobs into a few demo queues so you can
// click around the dashboard without wiring up a real producer.
const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const connection = { url: REDIS_URL };

const emails = new Queue('emails', { connection });
const exports_ = new Queue('exports', { connection });
const demo = new Queue('demo', { connection });

async function main() {
  // Email-like jobs
  for (let i = 0; i < 25; i++) {
    await emails.add('send-welcome', { to: `user${i}@example.com` }, { delay: i % 5 === 0 ? 10_000 : undefined });
  }
  // Exports
  for (let i = 0; i < 10; i++) {
    await exports_.add('export-csv', { userId: 1000 + i, range: '30d' }, { attempts: 3 });
  }
  // Demo job that fails sometimes
  for (let i = 0; i < 15; i++) {
    await demo.add('process', { i, shouldFail: i % 4 === 0 }, { attempts: 2 });
  }

  // Workers that actually consume so you see active/completed/failed
  new Worker(
    'emails',
    async (job) => {
      await sleep(800);
      return { sent: job.data.to };
    },
    { connection, concurrency: 2 }
  );
  new Worker(
    'exports',
    async () => {
      await sleep(2000);
    },
    { connection, concurrency: 1 }
  );
  new Worker(
    'demo',
    async (job) => {
      await sleep(500);
      if (job.data.shouldFail) throw new Error(`Demo job ${job.id} blew up`);
      return 'ok';
    },
    { connection, concurrency: 3 }
  );

  console.log('Seeding running. Ctrl+C to stop workers.');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
