import { DashboardRequest, ControllerHandlerReturnType } from '../../typings/app';
import { BaseAdapter } from '../queueAdapters/base';

export function queueProvider(
  next: (req: DashboardRequest, queue: BaseAdapter) => Promise<ControllerHandlerReturnType>,
  {
    skipReadOnlyModeCheck = false,
  }: {
    skipReadOnlyModeCheck?: boolean;
  } = {}
) {
  return async (req: DashboardRequest): Promise<ControllerHandlerReturnType> => {
    const { queueName } = req.params;

    const queue = req.queues.get(queueName);
    if (!queue || !(await queue.isVisible(req))) {
      return { status: 404, body: { error: 'Queue not found' } };
    } else if (queue.readOnlyMode && !skipReadOnlyModeCheck) {
      return {
        status: 405,
        body: { error: 'Method not allowed on read only queue' },
      };
    }

    return next(req, queue);
  };
}
