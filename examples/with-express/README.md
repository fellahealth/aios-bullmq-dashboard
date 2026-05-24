# Example: with-express

Local playground for the dashboard. Two ways to use it:

## 1. Quick demo with seeded jobs

```bash
# Start your Redis (any way you like):
docker run -p 6379:6379 redis:7

# In one terminal: start the dashboard server
yarn workspace @aios/bullmq-dashboard-example-express dev

# In another terminal: pump some jobs in
yarn workspace @aios/bullmq-dashboard-example-express seed
```

Open <http://localhost:3000/dashboard>.

## 2. Point at clinicos-monorepo's queues

Find the queue names used by `clinicos-monorepo/apps/backend` (search for `new Queue(`),
then start the server with them:

```bash
REDIS_URL=redis://127.0.0.1:6379 \
QUEUES=patient-onboarding,notification-emails,reports \
yarn workspace @aios/bullmq-dashboard-example-express dev
```

The dashboard is read/write — it can pause, retry, clean jobs in the real queues —
so be careful which Redis you point it at.
