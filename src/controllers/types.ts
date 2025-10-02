import type {IEventbus} from '../eventbus/types.ts';
import type {TOperationData} from '../operation/types.ts';

export interface IController<T extends TOperationData> {
  name: string;
  init(operationData: T): void;
  attach(eventbus: IEventbus): Promise<any> | void;
  detach(eventbus: IEventbus): void;
}
