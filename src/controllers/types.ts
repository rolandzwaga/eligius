import { TOperationData } from '../action/types';
import { IEventbus } from '../eventbus/types';

export interface IController<T extends TOperationData> {
  init(operationData: T): void;
  attach(eventbus: IEventbus): void;
  detach(eventbus: IEventbus): void;
}
