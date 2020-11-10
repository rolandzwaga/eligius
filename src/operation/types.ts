import { IEventbus } from '../eventbus/types';

export type TOperationResult<T = TOperationData> = Promise<T> | T;

export interface IOperationContext {
  loopIndex?: number;
  loopLength?: number;
  startIndex?: number;
  newIndex?: number;
  currentIndex: number;
  skip?: boolean;
}

export type TOperation<T = TOperationData> = (operationData: T, eventbus: IEventbus) => TOperationResult<T>;

export type TOperationData = Record<string, any>;

export type TActionContext = Record<string, any>;
