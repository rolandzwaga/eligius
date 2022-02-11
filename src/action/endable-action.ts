import { IResolvedOperation } from '../configuration/types';
import { IEventbus } from '../eventbus/types';
import { IOperationContext, TOperationData } from '../operation/types';
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

  end(initOperationData?: TOperationData): Promise<TOperationData | undefined> {
    if (this.endOperations.length) {
      const context: IOperationContext = {
        currentIndex: -1,
        eventbus: this.eventbus,
      };

      const result = new Promise<TOperationData>((resolve, reject) => {
        this.executeOperation(
          this.endOperations,
          0,
          resolve,
          reject,
          initOperationData,
          context
        );
      }).catch((e) => {
        console.error(`Error in action end '${this.name}'`);
        throw e;
      });
      return result;
    }

    return new Promise((resolve) => {
      resolve(initOperationData);
    });
  }
}
