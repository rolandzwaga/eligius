import { IEventbus } from '../eventbus';

export type TOperationData = Record<string, any>;

export type TOperationResult<T = TOperationData> = Promise<T> | T;

export interface IOperationContext {
  /**
   * When inside a loop, this is the current iteration of said loop
   */
  loopIndex?: number;
  /**
   * The number of iterations for the current loop
   */
  loopLength?: number;
  /**
   * The start index of the llop within the total number of operations
   */
  loopStartIndex?: number;
  /**
   * Set this index to change the current item in the main operations loop
   */
  newIndex?: number;
  /**
   * The current index with in the main operations loop
   */
  currentIndex: number;
  /**
   * While this is true, each subsequent operation in the loop will be skipped
   */
  skipNextOperation?: boolean;
  eventbus: IEventbus;
}

export type TOperation<T = TOperationData> = (
  this: IOperationContext,
  operationData: T
) => TOperationResult<T>;
