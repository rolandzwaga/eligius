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

  end(initOperationData?: TOperationData): Promise<TOperationData> {
    if (!this.endOperations.length) {
      return Promise.resolve(initOperationData ?? {});
    }

    this._initializeScopeStack();

    return new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.endOperations,
        0,
        resolve,
        reject,
        initOperationData
      );
    }).catch(e => {
      console.error(`Error in action end '${this.name}'`);
      throw e;
    });
  }
}
