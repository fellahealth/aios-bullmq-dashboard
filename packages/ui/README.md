# @aios-medical/bullmq-dashboard-ui

Modern React UI for the AIOS BullMQ Dashboard. Built with React 19, Tailwind CSS v4, TanStack Query, and React Router 7.

A refreshed, drop-in alternative to [`bull-board`](https://github.com/felixmosh/bull-board)'s UI.

<img alt="Overview: live view of all queues, their throughput and health" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/overview.png" />

## Installation

```bash
npm install @aios-medical/bullmq-dashboard-ui
# or
yarn add @aios-medical/bullmq-dashboard-ui
# or
pnpm add @aios-medical/bullmq-dashboard-ui
```

## Overview

This package provides a modern, professional user interface for monitoring Bull and BullMQ queues. It's distributed as a pre-built static bundle that gets served by the server adapters (Express or NestJS).

**Note:** This package is not intended to be used as a React component library. It's a pre-built UI that's automatically integrated when you use the server adapters.

## Features

- **Modern Design**: Dark-first palette with light/dark/system theme support
- **Real-time Monitoring**: Live queue statistics and job status updates
- **Interactive Charts**: Visual representation of queue performance
- **Job Management**: View, retry, promote, and clean jobs
- **Queue Controls**: Pause, resume, and manage queue settings
- **Responsive Layout**: Works on desktop and mobile devices
- **Settings Panel**: Customize polling interval, theme, and preferences
- **Status Filtering**: Filter jobs by status (active, waiting, completed, failed, etc.)
- **Search**: Search jobs by ID or data

## Screenshots

### Queue detail

<img alt="Queue detail view" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/queue-detail.png" />

### Job detail

<img alt="Job detail view" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/job-detail.png" />

### Job actions

<img alt="Promote job action" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/promote-job.png" />

### Settings

<img alt="Settings page" src="https://raw.githubusercontent.com/fellahealth/aios-bullmq-dashboard/main/screenshots/settings.png" />

## Integration

The UI is automatically integrated when you use the server adapters. You don't need to directly import or configure this package.

### With Express

```typescript
import { createDashboard } from '@aios-medical/bullmq-dashboard-api';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';
import { Queue } from 'bullmq';

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

### With NestJS

```typescript
import { Module } from '@nestjs/common';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullAdapter } from '@aios-medical/bullmq-dashboard-api/bullAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';

@Module({
  imports: [
    AIOSBullMQDashboardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      dashboardOptions: {
        uiConfig: {
          title: 'My Queues',
          subtitle: 'production',
          environment: { label: 'Production', color: '#ef4444' },
        },
      },
    }),
    AIOSBullMQDashboardModule.forFeature(
      { name: 'emails', adapter: BullAdapter, options: { displayName: 'Emails' } },
    ),
  ],
})
export class AppModule {}
```

## Configuration

The UI can be configured through the `uiConfig` option when creating the dashboard:

```typescript
createDashboard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
  options: {
    uiConfig: {
      title: 'My Dashboard',              // Dashboard title
      subtitle: 'Production',             // Optional subtitle
      favIcon: {                          // Custom favicon
        default: 'custom-icon.svg',
        alternative: 'custom-favicon.png',
      },
      environment: {                      // Environment badge
        label: 'Production',
        color: '#ef4444',
        textColor: '#ffffff',
      },
      pollingInterval: {
        forceInterval: 5000,              // Force specific polling interval (ms)
        showSetting: true,                // Allow users to change polling interval
      },
      miscLinks: [                        // Additional links in header
        { text: 'Documentation', url: 'https://docs.example.com' },
        { text: 'Support', url: 'https://support.example.com' },
      ],
      hideRedisDetails: false,            // Hide Redis connection information
    },
  },
});
```

## UI Structure

The dashboard consists of several main views:

- **Overview Page**: Shows all queues with their status, job counts, and health metrics
- **Queue Detail Page**: Detailed view of a specific queue with jobs list
- **Job Detail Page**: Individual job inspection with logs, data, and actions
- **Settings Page**: User preferences for theme, polling interval, and other settings

## Tech Stack

- **React 19**: Latest React with concurrent features
- **Vite 6**: Fast build tool and dev server
- **Tailwind CSS v4**: Utility-first CSS framework
- **TanStack Query v5**: Data fetching and caching
- **React Router 7**: Client-side routing
- **Radix UI**: Accessible UI primitives
- **Recharts**: Charting library
- **Lucide React**: Icon library

## Development

If you want to contribute to the UI or run it locally for development:

```bash
cd packages/ui
yarn install
yarn dev
```

The dev server runs on `http://localhost:9000` and proxies `/api` requests to a backend running on port 3000.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Related Packages

- [@aios-medical/bullmq-dashboard-api](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-api) - Core API package
- [@aios-medical/bullmq-dashboard-express](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-express) - Express.js adapter
- [@aios-medical/bullmq-dashboard-nestjs](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-nestjs) - NestJS module