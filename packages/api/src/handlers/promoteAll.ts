import { DashboardRequest, ControllerHandlerReturnType } from '../../typings/app';
import { queueProvider } from '../providers/queue';
import { BaseAdapter } from '../queueAdapters/base';

async function promoteAll(
  _req: DashboardRequest,
  queue: BaseAdapter
): Promise<ControllerHandlerReturnType> {
  await queue.promoteAll();

  return { status: 200, body: {} };
}

export const promoteAllHandler = queueProvider(promoteAll);
