import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Diagnostics} from '@diagnostics/index.ts';
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
    Diagnostics.active &&
      Diagnostics.send(
        'eligius-diagnostics-action',
        `${this.name ?? 'Action'} begins executing end operations`
      );

    if (!this.endOperations.length) {
      return Promise.resolve(initOperationData ?? {});
    }

    this._initializeScopeStack();

    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.endOperations,
        0,
        resolve,
        reject,
        initOperationData
      );
    }).catch(e => {
      Diagnostics.active &&
        Diagnostics.send('eligius-diagnostics-action-error', {
          name: this.name,
          error: e,
        });
      console.error(`Error in action end '${this.name}'`);
      throw e;
    });

    return !Diagnostics.active
      ? result
      : result.then(operationsResult => {
          Diagnostics.send(
            'eligius-diagnostics-action',
            `${this.name ?? 'Action'} finished executing start operations`
          );
          return operationsResult;
        });
  }
}
