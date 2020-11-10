import { IEventbus } from '../eventbus/types';
import { IOperationContext, TOperation } from './types';

export const log: TOperation<never> = function (this: IOperationContext, operationData: never, _eventBus: IEventbus) {
  console.group('Operation info');
  console.dir({ context: this });
  console.dir({ operationData });
  console.groupEnd();
  return operationData;
};
