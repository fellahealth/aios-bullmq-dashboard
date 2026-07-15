import type { Server } from 'http';
import express from 'express';
import basicAuth from 'express-basic-auth';
import IORedis, { type Redis } from 'ioredis';
import { createDashboard } from '@aios-medical/bullmq-dashboard-api';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';

import type { StandaloneConfig } from './config';
import { QueueDiscovery } from './discovery';

export interface StandaloneServer {
  server: Server;
  redis: Redis;
  discovery: QueueDiscovery;
  close: () => Promise<void>;
}

function createRedis(config: StandaloneConfig): Redis {
  if ('url' in config.redis) {
    return new IORedis(config.redis.url, { maxRetriesPerRequest: null });
  }
  return new IORedis({ ...config.redis, maxRetriesPerRequest: null });
}

export async function startServer(config: StandaloneConfig): Promise<StandaloneServer> {
  const redis = createRedis(config);

  const serverAdapter = new ExpressAdapter();
  if (config.basePath) {
    serverAdapter.setBasePath(config.basePath);
  }
  const { addQueue, removeQueue } = createDashboard({
    queues: [],
    serverAdapter,
    options: {
      uiConfig: {
        title: config.title,
        ...(config.subtitle ? { subtitle: config.subtitle } : {}),
      },
    },
  });

  const discovery = new QueueDiscovery(redis, config, { addQueue, removeQueue });

  const initialNames = await discovery.reconcile();
  console.log(
    initialNames.length > 0
      ? `Discovered ${initialNames.length} queue(s): ${initialNames.join(', ')}`
      : 'No queues found yet. They will appear here as soon as your app produces jobs.'
  );

  let refreshTimer: NodeJS.Timeout | undefined;
  if (!config.queueNames && config.discoveryIntervalMs > 0) {
    refreshTimer = setInterval(() => {
      discovery.reconcile().catch((err) => {
        console.error('Queue discovery refresh failed:', err?.message ?? err);
      });
    }, config.discoveryIntervalMs);
    refreshTimer.unref();
  }

  const app = express();

  app.get('/healthz', (_req, res) => {
    res.status(redis.status === 'ready' ? 200 : 503).json({
      status: redis.status === 'ready' ? 'ok' : 'degraded',
      redis: redis.status,
    });
  });

  if (config.basicAuth) {
    app.use(
      basicAuth({
        challenge: true,
        users: { [config.basicAuth.username]: config.basicAuth.password },
      })
    );
  }

  const router = serverAdapter.getRouter();
  if (config.basePath) {
    app.use(config.basePath, router);
  } else {
    app.use(router);
  }

  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(config.port, config.host, () => resolve(s));
  });

  const close = async () => {
    if (refreshTimer) clearInterval(refreshTimer);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await discovery.close();
    await redis.quit().catch(() => redis.disconnect());
  };

  return { server, redis, discovery, close };
}
