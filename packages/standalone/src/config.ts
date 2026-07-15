import type { RedisOptions } from 'ioredis';

export interface StandaloneConfig {
  port: number;
  host: string;
  basePath: string;

  redis: { url: string } | RedisOptions;
  bullPrefix: string;

  queueNames: string[] | null;
  discoveryIntervalMs: number;

  readOnly: boolean;

  basicAuth: { username: string; password: string } | null;

  title: string;
  subtitle: string | undefined;
}

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): StandaloneConfig {
  let redis: StandaloneConfig['redis'];
  if (env.REDIS_URL && env.REDIS_URL.trim() !== '') {
    redis = { url: env.REDIS_URL.trim() };
  } else {
    const options: RedisOptions = {
      host: env.REDIS_HOST || '127.0.0.1',
      port: int(env.REDIS_PORT, 6379),
      db: int(env.REDIS_DB, 0),
    };
    if (env.REDIS_USERNAME) options.username = env.REDIS_USERNAME;
    if (env.REDIS_PASSWORD) options.password = env.REDIS_PASSWORD;
    if (bool(env.REDIS_TLS)) options.tls = {};
    redis = options;
  }

  const basicAuth =
    env.BASIC_AUTH_USERNAME && env.BASIC_AUTH_PASSWORD
      ? { username: env.BASIC_AUTH_USERNAME, password: env.BASIC_AUTH_PASSWORD }
      : null;

  const queueNames =
    env.QUEUE_NAMES && env.QUEUE_NAMES.trim() !== ''
      ? env.QUEUE_NAMES.split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      : null;

  return {
    port: int(env.PORT, 3000),
    host: env.HOST || '0.0.0.0',
    basePath: env.BASE_PATH || '',

    redis,
    bullPrefix: env.BULL_PREFIX || 'bull',

    queueNames,
    discoveryIntervalMs: int(env.DISCOVERY_INTERVAL_MS, 15000),

    readOnly: bool(env.READ_ONLY),

    basicAuth,

    title: env.DASHBOARD_TITLE || 'BullMQ Dashboard',
    subtitle: env.DASHBOARD_SUBTITLE || undefined,
  };
}
