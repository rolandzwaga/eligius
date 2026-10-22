import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';

export class EndableAction extends Action {
  constructor(
    name: string,
    startOperations: IResolvedOperation[],
    public endOperations: IResolvedOperation[],
    eventBus: IEventbus
  ) {
    super(name, startOperations, eventBus);
  }

  /**
   * Runs the end operations.
   *
   * A failure is not logged here: the returned promise rejects with the
   * error (annotated with the failing operation), and the caller reports it.
   * The engine reports it through its `error` event.
   *
   * @param initOperationData - Operation data the first end operation receives
   * @returns The operation data of the last end operation
   */
  end(initOperationData?: TOperationData): Promise<TOperationData> {
    if (!this.endOperations.length) {
      return Promise.resolve(initOperationData ?? {});
    }

    return this._runOperations(this.endOperations, initOperationData);
  }
}
