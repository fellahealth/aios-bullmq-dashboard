import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';

import type { StandaloneConfig } from './config';

const QUEUE_KEY_SUFFIXES = ['meta', 'id'] as const;

export async function discoverQueueNames(client: Redis, prefix: string): Promise<string[]> {
  const names = new Set<string>();

  for (const suffix of QUEUE_KEY_SUFFIXES) {
    const pattern = `${prefix}:*:${suffix}`;
    let cursor = '0';
    do {
      const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
      cursor = next;
      for (const key of keys) {
        const name = key.slice(prefix.length + 1, key.length - suffix.length - 1);
        if (name) names.add(name);
      }
    } while (cursor !== '0');
  }

  return [...names].sort();
}

export interface QueueRegistryApi {
  addQueue: (queue: BullMQAdapter) => void;
  removeQueue: (queueOrName: string | BullMQAdapter) => void;
}

export class QueueDiscovery {
  private readonly known = new Map<string, Queue>();

  constructor(
    private readonly client: Redis,
    private readonly config: StandaloneConfig,
    private readonly registry: QueueRegistryApi,
    private readonly queueConnection: ConnectionOptions
  ) {}

  private async resolveNames(): Promise<string[]> {
    if (this.config.queueNames) return this.config.queueNames;
    return discoverQueueNames(this.client, this.config.bullPrefix);
  }

  async reconcile(): Promise<string[]> {
    const names = await this.resolveNames();
    const current = new Set(names);

    for (const name of names) {
      if (this.known.has(name)) continue;
      const queue = new Queue(name, {
        connection: this.queueConnection,
        prefix: this.config.bullPrefix,
      });
      this.known.set(name, queue);
      this.registry.addQueue(new BullMQAdapter(queue, { readOnlyMode: this.config.readOnly }));
    }

    if (!this.config.queueNames) {
      for (const [name, queue] of this.known) {
        if (current.has(name)) continue;
        this.registry.removeQueue(name);
        this.known.delete(name);
        void queue.close().catch(() => undefined);
      }
    }

    return names;
  }

  async close(): Promise<void> {
    await Promise.all([...this.known.values()].map((q) => q.close().catch(() => undefined)));
    this.known.clear();
  }
}
