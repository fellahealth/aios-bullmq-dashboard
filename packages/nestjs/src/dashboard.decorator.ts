import { Inject } from '@nestjs/common';
import { AIOS_BULLMQ_DASHBOARD_INSTANCE } from "./dashboard.constants";

export const InjectAIOSBullMQDashboard = (): ParameterDecorator => Inject(AIOS_BULLMQ_DASHBOARD_INSTANCE);