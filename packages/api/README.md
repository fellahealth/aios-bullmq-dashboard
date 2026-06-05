# @aios-medical/bullmq-dashboard-api

Framework-agnostic API for the AIOS BullMQ Dashboard.

<img alt="AIOS BullMQ Dashboard overview" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/overview.png" />

## Installation

```bash
npm install @aios-medical/bullmq-dashboard-api
# or
yarn add @aios-medical/bullmq-dashboard-api
# or
pnpm add @aios-medical/bullmq-dashboard-api
```

## Overview

This package provides the core API for monitoring and managing Bull and BullMQ queues. It includes:

- **BaseAdapter**: Abstract base class for creating custom queue adapters
- **BullAdapter**: Adapter for Bull v4 queues
- **BullMQAdapter**: Adapter for BullMQ v5 queues
- **createDashboard**: Function to set up the dashboard with your queues

## Usage

### Basic Setup with BullMQ

```typescript
import { createDashboard } from '@aios-medical/bullmq-dashboard-api';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { Queue } from 'bullmq';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';

const queue = new Queue('my-queue', { connection: { host: 'localhost', port: 6379 } });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createDashboard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
  options: {
    uiConfig: {
      title: 'My Queue Dashboard',
      subtitle: 'Production',
    },
  },
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### Basic Setup with Bull (Legacy)

```typescript
import { createDashboard } from '@aios-medical/bullmq-dashboard-api';
import { BullAdapter } from '@aios-medical/bullmq-dashboard-api/bullAdapter';
import Queue from 'bull';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';

const queue = new Queue('my-queue', { redis: { host: 'localhost', port: 6379 } });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createDashboard({
  queues: [new BullAdapter(queue)],
  serverAdapter,
  options: {
    uiConfig: {
      title: 'My Queue Dashboard',
    },
  },
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### Queue Adapter Options

Both `BullAdapter` and `BullMQAdapter` accept an options object:

```typescript
const adapter = new BullMQAdapter(queue, {
  readOnlyMode: false,           // Disable job modifications
  allowRetries: true,            // Allow retrying failed jobs
  description: 'Email queue',    // Queue description
  displayName: 'Emails',         // Display name in UI
  prefix: 'prod:',               // Queue name prefix
  delimiter: '-',                // Delimiter for queue names
  externalJobUrl: (job) => `https://myapp.com/jobs/${job.id}`, // Custom job URL
});
```

### Dashboard Options

Configure the dashboard behavior and appearance:

```typescript
createDashboard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
  options: {
    uiBasePath: '/custom/path',  // Custom path to UI assets
    uiConfig: {
      title: 'My Dashboard',
      subtitle: 'Production',
      favIcon: {
        default: 'custom-icon.svg',
        alternative: 'custom-favicon.png',
      },
      environment: {
        label: 'Production',
        color: '#ef4444',
        textColor: '#ffffff',
      },
      pollingInterval: {
        forceInterval: 5000, // Force 5-second polling (overrides user settings)
      },
      miscLinks: [
        { text: 'Documentation', url: 'https://docs.example.com' },
        { text: 'Support', url: 'https://support.example.com' },
      ],
      hideRedisDetails: false, // Hide Redis connection details
    },
  },
});
```

### Dynamic Queue Management

The `createDashboard` function returns methods for managing queues dynamically:

```typescript
const { setQueues, replaceQueues, addQueue, removeQueue } = createDashboard({
  queues: [new BullMQAdapter(queue1)],
  serverAdapter,
});

// Replace all queues
replaceQueues([new BullMQAdapter(queue2), new BullMQAdapter(queue3)]);

// Add a queue dynamically
addQueue(new BullMQAdapter(queue4));

// Remove a queue dynamically
removeQueue('queue-name');

// Set queues (alias for replaceQueues)
setQueues([new BullMQAdapter(queue5)]);
```

### Custom Formatters

Add custom formatters for job data:

```typescript
const adapter = new BullMQAdapter(queue);

// Format job names
adapter.setFormatter('name', (data) => {
  return `Custom: ${data.name}`;
});

// Format job data
adapter.setFormatter('data', (data) => {
  return { ...data, timestamp: new Date().toISOString() };
});
```

### Visibility Guards

Control queue visibility based on request context:

```typescript
const adapter = new BullMQAdapter(queue);

adapter.setVisibilityGuard((request) => {
  // Only show queue to authenticated admins
  return request.user?.role === 'admin';
});
```

## API Reference

### createDashboard

Creates and configures the dashboard instance.

```typescript
function createDashboard(config: {
  queues: ReadonlyArray<BaseAdapter>;
  serverAdapter: IServerAdapter;
  options?: DashboardOptions;
}): {
  setQueues: (queues: ReadonlyArray<BaseAdapter>) => void;
  replaceQueues: (queues: ReadonlyArray<BaseAdapter>) => void;
  addQueue: (queue: BaseAdapter) => void;
  removeQueue: (queueName: string) => void;
}
```

### BaseAdapter

Abstract base class for queue adapters. Extend this to create custom adapters.

#### Methods

- `clean(queueStatus: JobCleanStatus, graceTimeMs: number): Promise<void>`
- `addJob(name: string, data: any, options: QueueJobOptions): Promise<QueueJob>`
- `getJob(id: string): Promise<QueueJob | undefined | null>`
- `getJobCounts(): Promise<JobCounts>`
- `getJobs(jobStatuses: JobStatus[], start?: number, end?: number): Promise<QueueJob[]>`
- `getJobLogs(id: string): Promise<string[]>`
- `getName(): string`
- `getRedisInfo(): Promise<string>`
- `isPaused(): Promise<boolean>`
- `pause(): Promise<void>`
- `resume(): Promise<void>`
- `empty(): Promise<void>`
- `obliterate(): Promise<void>`
- `promoteAll(): Promise<void>`
- `getStatuses(): Status[]`
- `getJobStatuses(): JobStatus[]`
- `getGlobalConcurrency(): Promise<number | null>`
- `setGlobalConcurrency(concurrency: number): Promise<void>`
- `setFormatter(field: FormatterField, formatter: (data: any) => any): void`
- `setVisibilityGuard(guard: (request: DashboardRequest) => Promise<boolean> | boolean): void`

### BullAdapter

Adapter for Bull v4 queues.

```typescript
constructor(queue: Queue, options?: Partial<QueueAdapterOptions>)
```

### BullMQAdapter

Adapter for BullMQ v5 queues.

```typescript
constructor(queue: Queue, options?: Partial<QueueAdapterOptions>)
```

## Status Constants

Import status constants for type-safe job status handling:

```typescript
import { STATUSES } from '@aios-medical/bullmq-dashboard-api/constants/statuses';

// STATUSES includes: 'latest', 'active', 'waiting', 'delayed', 'failed', 'completed', etc.
```

## Peer Dependencies

This package requires `@aios-medical/bullmq-dashboard-ui` to be installed for the dashboard UI.

## License

MIT

## Related Packages

- [@aios-medical/bullmq-dashboard-ui](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-ui) - React UI component
- [@aios-medical/bullmq-dashboard-express](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-express) - Express.js adapter
- [@aios-medical/bullmq-dashboard-nestjs](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-nestjs) - NestJS module