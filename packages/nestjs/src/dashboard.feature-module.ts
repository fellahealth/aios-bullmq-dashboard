import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bull-shared";
import { AIOSBullMQDashboardInstance, AIOSBullMQDashboardQueueOptions } from "./dashboard.types";
import { Queue } from "bullmq";
import { AIOS_BULLMQ_DASHBOARD_INSTANCE, AIOS_BULLMQ_DASHBOARD_QUEUES } from "./dashboard.constants";

@Module({})
export class AIOSBullMQDashboardFeatureModule implements OnModuleInit {

  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(AIOS_BULLMQ_DASHBOARD_QUEUES) private readonly queues: AIOSBullMQDashboardQueueOptions[],
    @Inject(AIOS_BULLMQ_DASHBOARD_INSTANCE) private readonly board: AIOSBullMQDashboardInstance
  ) {
  }

  onModuleInit(): any {
    for (const queueOption of this.queues) {
      const queue = this.moduleRef.get<Queue>(getQueueToken(queueOption.name), {strict: false});
      const queueAdapter = new queueOption.adapter(queue, queueOption.options);
      this.board.addQueue(queueAdapter);
    }
  }
}