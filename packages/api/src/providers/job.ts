import { DashboardRequest, ControllerHandlerReturnType, QueueJob } from '../../typings/app';
import { BaseAdapter } from '../queueAdapters/base';

export function jobProvider(
  next: (
    req: DashboardRequest,
    job: QueueJob,
    queue: BaseAdapter
  ) => Promise<ControllerHandlerReturnType>
) {
  return async (
    req: DashboardRequest,
    queue: BaseAdapter
  ): Promise<ControllerHandlerReturnType> => {
    const { jobId } = req.params;

    const job = await queue.getJob(jobId);

    if (!job) {
      return {
        status: 404,
        body: {
          error: 'Job not found',
        },
      };
    }

    return next(req, job, queue);
  };
}
