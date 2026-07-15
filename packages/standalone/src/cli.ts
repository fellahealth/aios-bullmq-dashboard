#!/usr/bin/env node
import { loadConfig } from './config';
import { startServer } from './server';

async function main() {
  const config = loadConfig();
  const { close } = await startServer(config);

  const url = `http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}${config.basePath}`;
  console.log(`BullMQ dashboard listening on ${url}`);
  if (config.readOnly) {
    console.log('Running in READ-ONLY mode. Mutating actions are disabled.');
  }

  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down…`);
    close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start BullMQ dashboard:', err);
  process.exit(1);
});
