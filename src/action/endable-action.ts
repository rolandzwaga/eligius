import { IResolvedOperation } from '../configuration/types';
import { Diagnostics } from '../diagnostics';
import { IEventbus } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { Action } from './action';

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

    this._initializeContextStack();

    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.endOperations,
        0,
        resolve,
        reject,
        initOperationData
      );
    }).catch((e) => {
      console.error(`Error in action end '${this.name}'`);
      throw e;
    });

    return !Diagnostics.active
      ? result
      : result.then((operationsResult) => {
          Diagnostics.send(
            'eligius-diagnostics-action',
            `${this.name ?? 'Action'} finished executing start operations`
          );
          return operationsResult;
        });
  }
}
