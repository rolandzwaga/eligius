import { IEventbus } from '../eventbus/types';
import { IDuration } from '../types';

export interface IAction {
  start(initOperationData: TOperationData): Promise<TOperationData>;
}

export interface IEndableAction extends IAction {
  end(initOperationData: TOperationData): Promise<TOperationData>;
}

export interface ITimelineAction extends IEndableAction {
  active: boolean;
  duration: IDuration;
}

export type ToperationResult = Promise<IOperationData> | IOperationData;

export type TOperation = (operationData: IOperationData, eventbus: IEventbus) => TOperationResult;

export type TOperationData = Record<string, any>;
