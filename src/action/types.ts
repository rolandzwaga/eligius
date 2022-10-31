import { IResolvedOperation } from '../configuration/types';
import { TOperationData } from '../operation/types';
import { IStrictDuration } from '../types';

export interface IAction {
  id: string;
  name: string;
  startOperations: IResolvedOperation[];
  start(
    initOperationData?: TOperationData
  ): Promise<TOperationData | undefined>;
}

export interface IEndableAction extends IAction {
  endOperations: IResolvedOperation[];
  end(initOperationData?: TOperationData): Promise<TOperationData | undefined>;
}

export interface ITimelineAction extends IEndableAction {
  active: boolean;
  duration: IStrictDuration;
}
