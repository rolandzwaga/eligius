import type {IResolvedOperation} from '../configuration/types.ts';
import type {TOperationData} from '../operation/types.ts';
import type {IStrictDuration} from '../types.ts';

export interface IAction {
  id: string;
  name: string;
  startOperations: IResolvedOperation[];
  start(initOperationData?: TOperationData): Promise<TOperationData>;
}

export interface IEndableAction extends IAction {
  endOperations: IResolvedOperation[];
  end(initOperationData?: TOperationData): Promise<TOperationData>;
}

export interface ITimelineAction extends IEndableAction {
  get active(): boolean;
  duration: IStrictDuration;
}
