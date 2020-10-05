import { TOperationData } from '../action/types';
import { IEventbus } from '../eventbus/types';

export interface IController<T extends TOperationData> {
  init(operationData: T);
  attach(eventbus: IEventbus);
  detach(eventbus: IEventbus);
}
