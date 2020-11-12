import { IEventbus } from '~/eventbus/types';

export type TOperationResult<T = TOperationData> = Promise<T> | T;

export interface IOperationContext {
  loopIndex?: number;
  loopLength?: number;
  startIndex?: number;
  newIndex?: number;
  currentIndex: number;
  skipNextOperation?: boolean;
}

export type TOperation<T = TOperationData> = (operationData: T, eventbus: IEventbus) => TOperationResult<T>;

export type TOperationData = any;
