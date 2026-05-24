import { createDashboard } from '@aios/bullmq-dashboard-api';
import type {
  DashboardOptions,
  IServerAdapter,
  QueueAdapterOptions,
} from '@aios/bullmq-dashboard-api/typings/app';
import type { BaseAdapter } from '@aios/bullmq-dashboard-api/baseAdapter';
import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

export type AIOSBullMQDashboardInstance = ReturnType<typeof createDashboard>;

export type AIOSBullMQDashboardModuleOptions = {
  route: string;
  adapter: { new (): AIOSBullMQDashboardServerAdapter };
  dashboardOptions?: DashboardOptions;
  middleware?: any;
};

export type AIOSBullMQDashboardModuleAsyncOptions = {
  useFactory: (...args: any[]) => AIOSBullMQDashboardModuleOptions | Promise<AIOSBullMQDashboardModuleOptions>;
  imports?: ModuleMetadata['imports'];
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
};

export type AIOSBullMQDashboardQueueOptions = {
  name: string;
  adapter: { new (queue: any, options?: Partial<QueueAdapterOptions>): BaseAdapter };
  options?: Partial<QueueAdapterOptions>;
};

//create our own types with the needed functions, so we don't need to include express/fastify libraries here.
export type AIOSBullMQDashboardServerAdapter = IServerAdapter & { setBasePath(path: string): any };
export type AIOSBullMQDashboardFastifyAdapter = AIOSBullMQDashboardServerAdapter & { registerPlugin(): any };
export type AIOSBullMQDashboardExpressAdapter = AIOSBullMQDashboardServerAdapter & { getRouter(): any };
