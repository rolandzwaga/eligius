import Action from './action';
import { IOperationInfo, IResolvedEndableActionConfiguration, TOperationData } from './types';
import { IEventbus } from '../eventbus/types';

class EndableAction extends Action {
  endOperations: IOperationInfo[];

  constructor(actionConfiguration: IResolvedEndableActionConfiguration, eventBus: IEventbus) {
    super(actionConfiguration, eventBus);
    this.endOperations = actionConfiguration.endOperations;
  }

  end(initOperationData?: TOperationData): Promise<TOperationData> {
    if (this.endOperations.length) {
      const context = {};
      const idx = 0;
      const result = new Promise<TOperationData>((resolve, reject) => {
        this.executeOperation(this.endOperations, idx, resolve, reject, initOperationData, context);
      }).catch((e) => {
        console.error(`Error in action end'${this.name}'`);
        throw e;
      });
      return result;
    }
    return new Promise((resolve) => {
      resolve(initOperationData);
    });
  }
}

export default EndableAction;
