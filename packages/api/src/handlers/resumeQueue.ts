import { DashboardRequest, ControllerHandlerReturnType } from '../../typings/app';
import { queueProvider } from '../providers/queue';
import { BaseAdapter } from '../queueAdapters/base';

async function resumeQueue(
  _req: DashboardRequest,
  queue: BaseAdapter
): Promise<ControllerHandlerReturnType> {
  await queue.resume();

  return { status: 200, body: {} };
}

export const resumeQueueHandler = queueProvider(resumeQueue);
