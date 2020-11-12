import { IEventbus } from '~/eventbus/types';
import { TOperationData } from '~/operation/types';

export interface IController<T extends TOperationData> {
  name: string;
  init(operationData: T): void;
  attach(eventbus: IEventbus): Promise<any> | void;
  detach(eventbus: IEventbus): void;
}
