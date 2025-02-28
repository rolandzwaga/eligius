import type { IResolvedOperation } from '../configuration/types.ts';
import type { IEventbus } from '../eventbus/index.ts';

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
   * The start index of the loop within the total number of operations
   */
  loopStartIndex?: number;
  /**
   * The end index of the loop within the total number of operations
   */
  loopEndIndex?: number;
  /**
   * Set this index to change the current item in the main operations loop
   */
  newIndex?: number;
  /**
   * The current index with in the main operations loop
   */
  currentIndex: number;
  /**
   * The eventbus instance shared amongst actions and operations
   */
  eventbus: IEventbus;
  /**
   * The list of operations that is currently being executed
   */
  operations: IResolvedOperation[];
  /**
   * The result of the last when evaluation, if any
   */
  whenEvaluation?: boolean;
  /**
   *
   */
  owner?: any;
  /**
   *
   */
  currentItem?: any;
  /**
   *
   */
  parent?: IOperationContext;
}

export type TOperation<T extends TOperationData = TOperationData, R = T> = (
  this: IOperationContext,
  operationData: T
) => TOperationResult<R>;

export type ExtractOperationData<T extends TOperation<TOperationData>> = T extends TOperation<infer K> ? K : never