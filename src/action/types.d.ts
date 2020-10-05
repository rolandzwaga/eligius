import { IEventbus } from '../eventbus/types';
import { IDuration } from '../types';

export interface IActionConfiguration {
  id: string;
  name: string;
  startOperations: IOperationConfiguration[];
}

export interface IEndableActionConfiguration extends IActionConfiguration {
  endOperations: IOperationConfiguration[];
}

export interface ITimelineActionConfiguration extends IEndableActionConfiguration {
  duration: IDuration;
}

export interface IResolvedActionConfiguration {
  id: string;
  name: string;
  startOperations: IOperationInfo[];
}

export interface IResolvedEndableActionConfiguration extends IResolvedActionConfiguration {
  endOperations: IOperationInfo[];
}

export interface IResolvedTimelineActionConfiguration extends IResolvedEndableActionConfiguration {
  duration: IDuration;
}

export interface IOperationConfiguration {
  id: string;
  systemName: string;
  operationData: TOperationData;
}

export interface IAction {
  start(initOperationData?: TOperationData): Promise<TOperationData>;
}

export interface IEndableAction extends IAction {
  end(initOperationData?: TOperationData): Promise<TOperationData>;
}

export interface ITimelineAction extends IEndableAction {
  active: boolean;
  duration: IDuration;
}

export type TOperationResult<T = TOperationData> = Promise<T> | T;

export interface IOperationInfo {
  operationData: TOperationData;
  instance: TOperation;
}

export interface IOperationContext {
  loopIndex?: number;
  loopLength?: number;
  startIndex?: number;
  newIndex?: number;
  currentIndex: number;
  skip?: boolean;
}

export type TOperation<T = IOperationData> = (operationData: T, eventbus: IEventbus) => TOperationResult<T>;

export type TOperationData = Record<string, any>;

export type TActionContext = Record<string, any>;
