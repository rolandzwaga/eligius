import { TOperationData } from '../action/types';
import { IEventbus } from '../eventbus/types';

export interface IController {
  init(operationData: TOperationData);
  attach(eventbus: IEventbus);
  detach(eventbus: IEventbus);
}
