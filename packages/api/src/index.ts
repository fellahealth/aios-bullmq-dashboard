import path from 'path';
import { DashboardOptions, IServerAdapter } from '../typings/app';
import { errorHandler } from './handlers/error';
import { BaseAdapter } from './queueAdapters/base';
import { getQueuesApi } from './queuesApi';
import { appRoutes } from './routes';

export function createDashboard({
  queues,
  serverAdapter,
  options = { uiConfig: {} },
}: {
  queues: ReadonlyArray<BaseAdapter>;
  serverAdapter: IServerAdapter;
  options?: DashboardOptions;
}) {
  const { queueRegistry, setQueues, replaceQueues, addQueue, removeQueue } = getQueuesApi(queues);
  const uiBasePath =
    options.uiBasePath ||
    // oxlint-disable-next-line no-eval
    path.dirname(eval(`require.resolve('@aios-medical/bullmq-dashboard-ui/package.json')`));

  serverAdapter
    .setQueues(queueRegistry)
    .setViewsPath(path.join(uiBasePath, 'dist'))
    .setStaticPath('/static', path.join(uiBasePath, 'dist/static'))
    .setUIConfig({
      title: 'AIOS BullMQ Dashboard',
      favIcon: {
        default: 'static/images/logo.svg',
        alternative: 'static/favicon-32x32.png',
      },
      ...options.uiConfig,
    })
    .setEntryRoute(appRoutes.entryPoint)
    .setErrorHandler(errorHandler)
    .setApiRoutes(appRoutes.api);

  return { setQueues, replaceQueues, addQueue, removeQueue };
}
