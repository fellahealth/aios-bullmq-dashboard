import express from 'express';
import { Queue } from 'bullmq';
import { createDashboard } from '@aios/bullmq-dashboard-api';
import { BullMQAdapter } from '@aios/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios/bullmq-dashboard-express';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const BASE_PATH = process.env.BASE_PATH ?? '/dashboard';
const PORT = Number(process.env.PORT ?? 3000);

// To test against clinicos-monorepo, list the queue names it uses below
// (or pass them via the QUEUES env var, comma-separated).
const QUEUE_NAMES = (process.env.QUEUES ?? 'demo,emails,exports').split(',').map((s) => s.trim());

const connection = { url: REDIS_URL };
const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));

const serverAdapter = new ExpressAdapter().setBasePath(BASE_PATH);

createDashboard({
  queues: queues.map((q) => new BullMQAdapter(q)),
  serverAdapter,
  options: {
    uiConfig: {
      title: 'AIOS BullMQ',
      environment: { label: 'Local', color: '#3b82f6' },
    },
  },
});

const app = express();
app.use(BASE_PATH, serverAdapter.getRouter());
app.get('/', (_req, res) => res.redirect(BASE_PATH));

app.listen(PORT, () => {
  console.log(`Dashboard:  http://localhost:${PORT}${BASE_PATH}`);
  console.log(`Redis:      ${REDIS_URL}`);
  console.log(`Queues:     ${QUEUE_NAMES.join(', ')}`);
});
