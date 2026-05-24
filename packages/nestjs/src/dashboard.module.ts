import { DynamicModule, Module} from "@nestjs/common";
import { AIOSBullMQDashboardFeatureModule } from "./dashboard.feature-module";
import { AIOSBullMQDashboardRootModule } from "./dashboard.root-module";
import { AIOS_BULLMQ_DASHBOARD_QUEUES } from "./dashboard.constants";
import { AIOSBullMQDashboardModuleAsyncOptions, AIOSBullMQDashboardModuleOptions, AIOSBullMQDashboardQueueOptions } from "./dashboard.types";

@Module({})
export class AIOSBullMQDashboardModule {

  static forFeature(...queues: AIOSBullMQDashboardQueueOptions[]): DynamicModule {
    return {
      module: AIOSBullMQDashboardFeatureModule,
      providers: [
        {
          provide: AIOS_BULLMQ_DASHBOARD_QUEUES,
          useValue: queues
        }
      ]
    };
  }

  static forRoot(options: AIOSBullMQDashboardModuleOptions): DynamicModule {
    return {
      module: AIOSBullMQDashboardModule,
      imports: [ AIOSBullMQDashboardRootModule.forRoot(options) ],
      exports: [ AIOSBullMQDashboardRootModule ],
    };
  }

  static forRootAsync(options: AIOSBullMQDashboardModuleAsyncOptions): DynamicModule {
    return {
      module: AIOSBullMQDashboardModule,
      imports: [ AIOSBullMQDashboardRootModule.forRootAsync(options) ],
      exports: [ AIOSBullMQDashboardRootModule ]
    }
  }
}