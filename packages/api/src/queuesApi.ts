import { BaseAdapter } from './queueAdapters/base';
import { QueueRegistry } from '../typings/app';

export function getQueuesApi(queues: ReadonlyArray<BaseAdapter>) {
  const queueRegistry: QueueRegistry = new Map<string, BaseAdapter>();

  function addQueue(queue: BaseAdapter): void {
    const name = queue.getName();
    queueRegistry.set(name, queue);
  }

  function removeQueue(queueOrName: string | BaseAdapter) {
    const name = typeof queueOrName === 'string' ? queueOrName : queueOrName.getName();

    queueRegistry.delete(name);
  }

  function setQueues(newBullQueues: ReadonlyArray<BaseAdapter>): void {
    newBullQueues.forEach((queue) => {
      const name = queue.getName();

      queueRegistry.set(name, queue);
    });
  }

  function replaceQueues(newBullQueues: ReadonlyArray<BaseAdapter>): void {
    const queuesToPersist: string[] = newBullQueues.map((queue) => queue.getName());

    queueRegistry.forEach((_queue, name) => {
      if (queuesToPersist.indexOf(name) === -1) {
        queueRegistry.delete(name);
      }
    });

    return setQueues(newBullQueues);
  }

  setQueues(queues);

  return { queueRegistry, setQueues, replaceQueues, addQueue, removeQueue };
}
