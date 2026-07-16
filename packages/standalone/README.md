# @aios-medical/bullmq-dashboard-standalone

Run the BullMQ dashboard as its own service. Point it at a Redis instance and it
**auto-discovers your queues**: no code changes, no adapters to wire up, no
redeploy of your app.

Unlike the embedded packages (Express / NestJS), where you construct `Queue`
objects and register them in your app, the standalone server connects directly
to Redis, scans for BullMQ queues, and serves the same dashboard UI. It works
with any app in any language that writes BullMQ-compatible queues to Redis.

## Quick start (Docker)

```bash
docker run -p 3000:3000 -e REDIS_URL=redis://your-redis:6379 \
  ghcr.io/fellahealth/bullmq-dashboard
```

Open http://localhost:3000. Queues appear as soon as your app has produced jobs.

### Try it with the demo stack

From the repo root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

This starts Redis, the dashboard, and a seeder that drips fake jobs into a few
queues so the dashboard has something to show immediately.

## Quick start (Node)

```bash
yarn add @aios-medical/bullmq-dashboard-standalone
REDIS_URL=redis://localhost:6379 npx bullmq-dashboard
```

Or programmatically:

```ts
import { loadConfig, startServer } from '@aios-medical/bullmq-dashboard-standalone';

const { close } = await startServer(loadConfig());
```

## Configuration (environment variables)

| Variable                | Default       | Description                                                             |
| ----------------------- | ------------- | ----------------------------------------------------------------------- |
| `REDIS_URL`             | -             | `redis://` / `rediss://` connection string. Takes precedence.           |
| `REDIS_HOST`            | `127.0.0.1`   | Used when `REDIS_URL` is not set.                                       |
| `REDIS_PORT`            | `6379`        |                                                                         |
| `REDIS_USERNAME`        | -             |                                                                         |
| `REDIS_PASSWORD`        | -             |                                                                         |
| `REDIS_DB`              | `0`           |                                                                         |
| `REDIS_TLS`             | `false`       | Set to `true` to connect over TLS.                                     |
| `BULL_PREFIX`           | `bull`        | BullMQ key prefix to scan under.                                        |
| `QUEUE_NAMES`           | -             | Comma-separated explicit list. Disables auto-discovery when set.        |
| `DISCOVERY_INTERVAL_MS` | `15000`       | How often to re-scan Redis for new/removed queues. `0` disables.        |
| `PORT`                  | `3000`        | HTTP port.                                                              |
| `HOST`                  | `0.0.0.0`     | Bind address.                                                           |
| `BASE_PATH`             | -             | Serve under a sub-path, e.g. `/admin/queues`.                           |
| `READ_ONLY`             | `false`       | Disable all mutating actions (retry, pause, clean, add, …).             |
| `BASIC_AUTH_USERNAME`   | -             | Enable HTTP basic auth (both username and password required).           |
| `BASIC_AUTH_PASSWORD`   | -             |                                                                         |
| `DASHBOARD_TITLE`       | `BullMQ Dashboard` | Title shown in the UI.                                              |
| `DASHBOARD_SUBTITLE`    | -             | Optional subtitle.                                                      |

## How discovery works

BullMQ stores every queue under keys like `bull:<name>:meta` and `bull:<name>:id`.
The server uses non-blocking `SCAN` (never `KEYS`) to find those structural keys,
extracts the queue names, and builds an adapter per queue. It re-scans on an
interval, so queues created after startup show up automatically.

If `SCAN` is restricted on your Redis, set `QUEUE_NAMES` to list queues explicitly.

## Health check

`GET /healthz` returns `200` when Redis is connected, `503` otherwise. The Docker
image has a built-in `HEALTHCHECK` using this endpoint.

## Scope / limitations

- Targets **BullMQ v5** and a **single-node Redis** (not Redis Cluster).
- Legacy Bull v4 auto-discovery is not supported; use the embedded adapters for that.
