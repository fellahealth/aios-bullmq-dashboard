import { Inject, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bull-shared";
import type { BaseAdapter } from "@aios/bullmq-dashboard-api/baseAdapter";
import { AIOSBullMQDashboardInstance, AIOSBullMQDashboardQueueOptions } from "./dashboard.types";
import { Queue } from "bullmq";
import { AIOS_BULLMQ_DASHBOARD_INSTANCE, AIOS_BULLMQ_DASHBOARD_QUEUES } from "./dashboard.constants";

// `@nestjs/bull` decorator metadata keys. We read them via Reflect rather
// than importing the constants so we don't pull `@nestjs/bull` in as a
// hard dependency — users on `@nestjs/bullmq` don't need it.
const BULL_MODULE_QUEUE = 'bull:module_queue';
const BULL_MODULE_QUEUE_PROCESS = 'bull:module_queue_process';

@Module({})
export class AIOSBullMQDashboardFeatureModule
  implements OnModuleInit, OnApplicationBootstrap {
  private readonly adapters = new Map<string, BaseAdapter>();

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(AIOS_BULLMQ_DASHBOARD_QUEUES) private readonly queues: AIOSBullMQDashboardQueueOptions[],
    @Inject(AIOS_BULLMQ_DASHBOARD_INSTANCE) private readonly board: AIOSBullMQDashboardInstance
  ) {}

  onModuleInit(): void {
    for (const queueOption of this.queues) {
      const queue = this.moduleRef.get<Queue>(getQueueToken(queueOption.name), { strict: false });
      const queueAdapter = new queueOption.adapter(queue, queueOption.options);
      this.adapters.set(queueOption.name, queueAdapter);
      this.board.addQueue(queueAdapter);
    }
  }

  /**
   * Runs after every module's onModuleInit (including `@nestjs/bull`'s
   * BullExplorer that registers processors). Walks every provider in the
   * app looking for `@Processor(name)` classes, reads the `@Process()`
   * decorator metadata on each method, sums their concurrency per queue
   * name, and pushes the total into the matching dashboard adapter.
   *
   * The concurrency value reported is per-process: if the app is scaled
   * horizontally across N nodes, the system-wide cap is N × this value.
   * That caveat is surfaced in the UI tooltip.
   */
  onApplicationBootstrap(): void {
    const totals = new Map<string, number>();

    for (const wrapper of this.discoveryService.getProviders()) {
      const instance = wrapper.instance;
      if (!instance || typeof instance !== 'object') continue;

      const meta =
        Reflect.getMetadata(BULL_MODULE_QUEUE, wrapper.metatype ?? instance.constructor) ??
        Reflect.getMetadata(BULL_MODULE_QUEUE, instance.constructor);
      if (!meta) continue;

      const queueName: string | undefined = typeof meta === 'string' ? meta : meta.name;
      if (!queueName) continue;

      const proto = Object.getPrototypeOf(instance);
      const methods = this.metadataScanner.getAllMethodNames
        ? this.metadataScanner.getAllMethodNames(proto)
        : (this.metadataScanner as unknown as { getAllFilteredMethodNames: (p: object) => string[] })
            .getAllFilteredMethodNames(proto);

      for (const methodName of methods) {
        const handler = (instance as Record<string, unknown>)[methodName];
        if (typeof handler !== 'function') continue;
        const processMeta = Reflect.getMetadata(BULL_MODULE_QUEUE_PROCESS, handler);
        if (!processMeta) continue;
        const concurrency =
          typeof processMeta.concurrency === 'number' && processMeta.concurrency > 0
            ? processMeta.concurrency
            : 1;
        totals.set(queueName, (totals.get(queueName) ?? 0) + concurrency);
      }
    }

    for (const [queueName, total] of totals) {
      const adapter = this.adapters.get(queueName);
      if (adapter) adapter.setWorkerConcurrency(total);
    }
  }
}
