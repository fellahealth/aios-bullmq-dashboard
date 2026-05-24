import {
  AIOSBullMQDashboardExpressAdapter,
  AIOSBullMQDashboardFastifyAdapter, AIOSBullMQDashboardServerAdapter,
} from "./dashboard.types";

export const isFastifyAdapter = (adapter: AIOSBullMQDashboardServerAdapter): adapter is AIOSBullMQDashboardFastifyAdapter => {
  return 'registerPlugin' in adapter;
}

export const isExpressAdapter = (adapter: AIOSBullMQDashboardServerAdapter): adapter is AIOSBullMQDashboardExpressAdapter => {
  return 'getRouter' in adapter;
}