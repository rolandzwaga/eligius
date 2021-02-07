import { IEventbus } from '../eventbus/types';
import { IOperationContext, TOperation } from './types';

export const log: TOperation = function (this: IOperationContext, operationData: any, _eventBus: IEventbus) {
  console.group('Operation info');
  console.dir({ context: this });
  console.dir({ operationData });
  console.groupEnd();
  return operationData;
};
