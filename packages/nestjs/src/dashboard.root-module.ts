import { DynamicModule, Inject, MiddlewareConsumer, Module, NestModule, Provider } from "@nestjs/common";
import { createDashboard } from "@aios-medical/bullmq-dashboard-api";
import { AIOS_BULLMQ_DASHBOARD_ADAPTER, AIOS_BULLMQ_DASHBOARD_INSTANCE, AIOS_BULLMQ_DASHBOARD_OPTIONS } from "./dashboard.constants";
import { AIOSBullMQDashboardModuleAsyncOptions, AIOSBullMQDashboardModuleOptions, AIOSBullMQDashboardServerAdapter } from "./dashboard.types";
import { ApplicationConfig, HttpAdapterHost } from "@nestjs/core";
import { isExpressAdapter, isFastifyAdapter } from "./dashboard.util";

@Module({})
export class AIOSBullMQDashboardRootModule implements NestModule {

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly applicationConfig: ApplicationConfig,
    @Inject(AIOS_BULLMQ_DASHBOARD_ADAPTER) private readonly adapter: AIOSBullMQDashboardServerAdapter,
    @Inject(AIOS_BULLMQ_DASHBOARD_OPTIONS) private readonly options: AIOSBullMQDashboardModuleOptions
  ) {
  }

  configure(consumer: MiddlewareConsumer): any {
    const addForwardSlash = (path: string) => {
      return path.startsWith('/') || path === '' ? path : `/${path}`;
    };

    const shouldBypassGlobalPrefix = () => {
      const prefixOptions = this.applicationConfig.getGlobalPrefixOptions();
      if (!prefixOptions?.exclude) return false;

      return prefixOptions.exclude.some(exclusion => {
        const routePath = addForwardSlash(this.options.route);
        return exclusion.pathRegex.test(routePath);
      });
    };

    const prefix =
      shouldBypassGlobalPrefix()
        ? addForwardSlash(this.options.route)
        : addForwardSlash(this.applicationConfig.getGlobalPrefix() + this.options.route);

    this.adapter.setBasePath(prefix);

    if (isExpressAdapter(this.adapter)) {
      return consumer
        .apply(this.options.middleware, this.adapter.getRouter())
        .forRoutes(this.options.route);
    }

    if (isFastifyAdapter(this.adapter)) {
      this.adapterHost.httpAdapter
        .getInstance()
        .register(this.adapter.registerPlugin(), { prefix });

      return consumer
        .apply(this.options.middleware)
        .forRoutes(this.options.route);
    }
  }

  static forRoot(options: AIOSBullMQDashboardModuleOptions): DynamicModule {
    const serverAdapter = new options.adapter();

    const dashboardProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_INSTANCE,
      useFactory: () => createDashboard({
        queues: [],
        serverAdapter: serverAdapter,
        options: options.dashboardOptions,
      })
    };

    const serverAdapterProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_ADAPTER,
      useFactory: () => serverAdapter
    };

    const optionsProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_OPTIONS,
      useValue: options
    };

    return {
      module: AIOSBullMQDashboardRootModule,
      global: true,
      imports: [],
      providers: [
        serverAdapterProvider,
        optionsProvider,
        dashboardProvider
      ],
      exports: [
        serverAdapterProvider,
        dashboardProvider,
        optionsProvider
      ],
    };
  }

  static forRootAsync(options: AIOSBullMQDashboardModuleAsyncOptions): DynamicModule {
    const dashboardProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_INSTANCE,
      useFactory: (options: AIOSBullMQDashboardModuleOptions, adapter: AIOSBullMQDashboardServerAdapter) => createDashboard({
        queues: [],
        serverAdapter: adapter,
        options: options.dashboardOptions,
      }),
      inject: [AIOS_BULLMQ_DASHBOARD_OPTIONS, AIOS_BULLMQ_DASHBOARD_ADAPTER]
    };

    const serverAdapterProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_ADAPTER,
      useFactory: (options: AIOSBullMQDashboardModuleOptions) => new options.adapter(),
      inject: [AIOS_BULLMQ_DASHBOARD_OPTIONS]
    };

    const optionsProvider: Provider = {
      provide: AIOS_BULLMQ_DASHBOARD_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject
    }

    return {
      module: AIOSBullMQDashboardRootModule,
      global: true,
      imports: options.imports,
      providers: [
        serverAdapterProvider,
        optionsProvider,
        dashboardProvider
      ],
      exports: [
        serverAdapterProvider,
        dashboardProvider,
        optionsProvider
      ],
    };
  }
}