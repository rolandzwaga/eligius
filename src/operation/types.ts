import { IEventbus } from '../eventbus';

export type TOperationData = Record<string, any>;

export type TOperationResult<T = TOperationData> = Promise<T> | T;

export interface IOperationContext {
  loopIndex?: number;
  loopLength?: number;
  startIndex?: number;
  newIndex?: number;
  currentIndex: number;
  skipNextOperation?: boolean;
  eventbus: IEventbus;
}

export type TOperation<T = TOperationData> = (
  this: IOperationContext,
  operationData: T
) => TOperationResult<T>;
