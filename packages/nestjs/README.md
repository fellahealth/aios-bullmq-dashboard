# @aios-medical/bullmq-dashboard-nestjs

NestJS module for the AIOS BullMQ Dashboard. Works with `@nestjs/bull` and `@nestjs/bullmq`.

## Installation

```bash
npm install @aios-medical/bullmq-dashboard-nestjs
# or
yarn add @aios-medical/bullmq-dashboard-nestjs
# or
pnpm add @aios-medical/bullmq-dashboard-nestjs
```

You'll also need the API, UI, and Express adapter packages:

```bash
npm install \
  @aios-medical/bullmq-dashboard-api \
  @aios-medical/bullmq-dashboard-ui \
  @aios-medical/bullmq-dashboard-express \
  @aios-medical/bullmq-dashboard-nestjs
```

## Overview

This package provides a NestJS module that integrates the AIOS BullMQ Dashboard with your NestJS application. It automatically discovers queues registered with `@nestjs/bull` or `@nestjs/bullmq` and provides a seamless integration with NestJS's dependency injection system.

## Usage

### Basic Setup with @nestjs/bullmq

```typescript
import { Module } from '@nestjs/common';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({
      name: 'emails',
    }),
    BullModule.registerQueue({
      name: 'reports',
    }),
    AIOSBullMQDashboardModule.forRoot({
      route: '/admin/queues',
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
      { name: 'emails', adapter: BullMQAdapter, options: { displayName: 'Emails' } },
      { name: 'reports', adapter: BullMQAdapter, options: { displayName: 'Reports' } },
    ),
  ],
})
export class AppModule {}
```

### Basic Setup with @nestjs/bull (Legacy)

```typescript
import { Module } from '@nestjs/common';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullAdapter } from '@aios-medical/bullmq-dashboard-api/bullAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({
      name: 'emails',
    }),
    AIOSBullMQDashboardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      dashboardOptions: {
        uiConfig: {
          title: 'My Queues',
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

### With Authentication Middleware

```typescript
import { Module } from '@nestjs/common';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';
import basicAuth from 'express-basic-auth';

@Module({
  imports: [
    AIOSBullMQDashboardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: { admin: process.env.DASHBOARD_PASSWORD || 'secret' },
      }),
      dashboardOptions: {
        uiConfig: {
          title: 'Protected Dashboard',
        },
      },
    }),
    AIOSBullMQDashboardModule.forFeature(
      { name: 'emails', adapter: BullMQAdapter },
    ),
  ],
})
export class AppModule {}
```

### Async Configuration

Use `forRootAsync` for asynchronous configuration:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AIOSBullMQDashboardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: configService.get('DASHBOARD_ROUTE') || '/admin/queues',
        adapter: ExpressAdapter,
        dashboardOptions: {
          uiConfig: {
            title: configService.get('DASHBOARD_TITLE') || 'My Queues',
            environment: {
              label: configService.get('ENVIRONMENT') || 'Development',
              color: configService.get('ENVIRONMENT_COLOR') || '#3b82f6',
            },
          },
        },
      }),
    }),
    AIOSBullMQDashboardModule.forFeature(
      { name: 'emails', adapter: BullMQAdapter },
    ),
  ],
})
export class AppModule {}
```

### Queue Options

Configure individual queues with options:

```typescript
AIOSBullMQDashboardModule.forFeature(
  { 
    name: 'emails', 
    adapter: BullMQAdapter, 
    options: {
      displayName: 'Email Queue',
      description: 'Handles email sending jobs',
      readOnlyMode: false,
      allowRetries: true,
    } 
  },
  { 
    name: 'reports', 
    adapter: BullMQAdapter, 
    options: {
      displayName: 'Report Generation',
      description: 'Generates PDF reports',
      readOnlyMode: true,  // Read-only for viewing only
    } 
  },
)
```

### Custom Queue Adapter Options

```typescript
AIOSBullMQDashboardModule.forFeature(
  { 
    name: 'emails', 
    adapter: BullMQAdapter, 
    options: {
      displayName: 'Emails',
      prefix: 'prod:',
      delimiter: '-',
      externalJobUrl: (job) => `https://myapp.com/jobs/${job.id}`,
    } 
  },
)
```

## API Reference

### AIOSBullMQDashboardModule

The main module class for configuring the dashboard.

#### Static Methods

##### forRoot(options: AIOSBullMQDashboardModuleOptions)

Configures the dashboard root module synchronously.

```typescript
AIOSBullMQDashboardModule.forRoot({
  route: '/admin/queues',
  adapter: ExpressAdapter,
  middleware: optionalMiddleware,
  dashboardOptions: {
    uiConfig: {
      title: 'My Dashboard',
    },
  },
})
```

##### forRootAsync(options: AIOSBullMQDashboardModuleAsyncOptions)

Configures the dashboard root module asynchronously.

```typescript
AIOSBullMQDashboardModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    route: configService.get('DASHBOARD_ROUTE'),
    adapter: ExpressAdapter,
    dashboardOptions: {
      uiConfig: {
        title: configService.get('DASHBOARD_TITLE'),
      },
    },
  }),
})
```

##### forFeature(...queues: AIOSBullMQDashboardQueueOptions[])

Registers queues to be monitored by the dashboard.

```typescript
AIOSBullMQDashboardModule.forFeature(
  { name: 'emails', adapter: BullMQAdapter, options: { displayName: 'Emails' } },
  { name: 'reports', adapter: BullMQAdapter },
)
```

## Types

### AIOSBullMQDashboardModuleOptions

```typescript
{
  route: string;                                    // Route path for the dashboard
  adapter: { new (): AIOSBullMQDashboardServerAdapter };  // Server adapter (ExpressAdapter)
  dashboardOptions?: DashboardOptions;              // Dashboard configuration options
  middleware?: any;                                 // Express middleware (e.g., auth)
}
```

### AIOSBullMQDashboardModuleAsyncOptions

```typescript
{
  useFactory: (...args: any[]) => AIOSBullMQDashboardModuleOptions | Promise<AIOSBullMQDashboardModuleOptions>;
  imports?: ModuleMetadata['imports'];
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
```

### AIOSBullMQDashboardQueueOptions

```typescript
{
  name: string;                                                                      // Queue name (must match Bull/BullMQ queue name)
  adapter: { new (queue: any, options?: Partial<QueueAdapterOptions>): BaseAdapter }; // Adapter class (BullAdapter or BullMQAdapter)
  options?: Partial<QueueAdapterOptions>;                                            // Queue adapter options
}
```

## Features

### Automatic Queue Discovery

The module automatically discovers queues registered with `@nestjs/bull` or `@nestjs/bullmq` and integrates them with the dashboard.

### Worker Concurrency Detection

The module automatically detects worker concurrency from `@Process()` decorators and displays it in the dashboard. This helps you understand the processing capacity of each queue.

```typescript
@Processor('emails')
export class EmailProcessor {
  @Process('send', { concurrency: 5 })  // Concurrency of 5 will be detected
  async handleSend(job: Job) {
    // Process email
  }
}
```

### Global Prefix Support

The module respects NestJS global prefix configuration. You can exclude the dashboard route from the global prefix:

```typescript
app.setGlobalPrefix('api/v1', {
  exclude: [{ path: '/admin/queues', method: RequestMethod.ALL }],
});
```

### Dependency Injection

The dashboard instance and options are available for injection:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { AIOS_BULLMQ_DASHBOARD_INSTANCE, AIOS_BULLMQ_DASHBOARD_OPTIONS } from '@aios-medical/bullmq-dashboard-nestjs';

@Injectable()
export class MyService {
  constructor(
    @Inject(AIOS_BULLMQ_DASHBOARD_INSTANCE) private dashboard: any,
    @Inject(AIOS_BULLMQ_DASHBOARD_OPTIONS) private options: any,
  ) {}
}
```

## Configuration Options

The `dashboardOptions` parameter accepts the same options as the API package's `createDashboard` function:

```typescript
dashboardOptions: {
  uiBasePath?: string;
  uiConfig: {
    title?: string;
    subtitle?: string;
    favIcon?: { default: string; alternative: string };
    environment?: { label: string; color: string; textColor?: string };
    pollingInterval?: { showSetting?: boolean; forceInterval?: number };
    miscLinks?: Array<{ text: string; url: string }>;
    hideRedisDetails?: boolean;
  };
}
```

## Complete Example

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AIOSBullMQDashboardModule } from '@aios-medical/bullmq-dashboard-nestjs';
import { BullMQAdapter } from '@aios-medical/bullmq-dashboard-api/bullMQAdapter';
import { ExpressAdapter } from '@aios-medical/bullmq-dashboard-express';
import basicAuth from 'express-basic-auth';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'emails',
    }),
    BullModule.registerQueue({
      name: 'reports',
    }),
    AIOSBullMQDashboardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: basicAuth({
          challenge: true,
          users: {
            admin: configService.get('DASHBOARD_PASSWORD'),
          },
        }),
        dashboardOptions: {
          uiConfig: {
            title: 'Production Dashboard',
            subtitle: 'Queue Monitoring',
            environment: {
              label: 'Production',
              color: '#ef4444',
              textColor: '#ffffff',
            },
            pollingInterval: {
              forceInterval: 5000,
            },
            miscLinks: [
              { text: 'Documentation', url: 'https://docs.example.com' },
              { text: 'Support', url: 'https://support.example.com' },
            ],
          },
        },
      }),
    }),
    AIOSBullMQDashboardModule.forFeature(
      { 
        name: 'emails', 
        adapter: BullMQAdapter, 
        options: { 
          displayName: 'Email Queue',
          description: 'Handles transactional emails',
        } 
      },
      { 
        name: 'reports', 
        adapter: BullMQAdapter, 
        options: { 
          displayName: 'Report Generation',
          description: 'Generates analytical reports',
        } 
      },
    ),
  ],
})
export class AppModule {}
```

## Compatibility

- **NestJS**: v9, v10, v11
- **@nestjs/bull**: For Bull v4 queues
- **@nestjs/bullmq**: For BullMQ v5 queues
- **@nestjs/common**: ^9.0.0 || ^10.0.0 || ^11.0.0
- **@nestjs/core**: ^9.0.0 || ^10.0.0 || ^11.0.0

## Peer Dependencies

```json
{
  "@aios-medical/bullmq-dashboard-api": "^1.0.0",
  "@nestjs/bull-shared": "^10.0.0 || ^11.0.0",
  "@nestjs/common": "^9.0.0 || ^10.0.0 || ^11.0.0",
  "@nestjs/core": "^9.0.0 || ^10.0.0 || ^11.0.0",
  "reflect-metadata": "^0.1.13 || ^0.2.0",
  "rxjs": "^7.8.1"
}
```

## License

MIT

## Related Packages

- [@aios-medical/bullmq-dashboard-api](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-api) - Core API package
- [@aios-medical/bullmq-dashboard-ui](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-ui) - React UI component
- [@aios-medical/bullmq-dashboard-express](https://www.npmjs.com/package/@aios-medical/bullmq-dashboard-express) - Express.js adapter