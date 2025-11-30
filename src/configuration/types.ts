import type {IEndableAction, ITimelineAction} from '@action/types.ts';
import type * as controllers from '@controllers/index.ts';
import type * as operations from '@operation/index.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';
import type {
  IDuration,
  ILabel,
  ILanguageLabel,
  TimelineTypes,
  TLanguageCode,
} from '../types.ts';

export type Controllers = typeof controllers;
export type TControllerName = keyof Controllers;
export type TControllerType = Controllers[TControllerName];
export type GetControllerByName<T extends TControllerName> = Controllers[T];

export type Operations = typeof operations;
export type TOperationName = keyof Operations;
export type TOperationType = Operations[TOperationName];
export type GetOperationByName<T extends TOperationName> = Operations[T];

export type ExtractOperationDataType<P> =
  P extends TOperation<infer T, any> ? T : never;
export interface IEngineInfo {
  systemName: string;
}

export type TTimelineProviderSettings = Partial<
  Record<TimelineTypes, ITimelineProviderSettings>
>;
export interface IEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings?: TTimelineProviderSettings;
  containerSelector: string;
  cssFiles: string[];
  language: TLanguageCode;
  layoutTemplate: string;
  availableLanguages: ILabel[];
  initActions: IEndableActionConfiguration[];
  actions: IEndableActionConfiguration[];
  eventActions?: IEventActionConfiguration[];
  timelines: ITimelineConfiguration[];
  timelineFlow?: ITimelineFlow;
  labels: ILanguageLabel[];
}

export interface IResolvedEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings: TTimelineProviderSettings;
  containerSelector: string;
  cssFiles: string[];
  language: TLanguageCode;
  layoutTemplate: string;
  availableLanguages: ILabel[];
  initActions: IEndableAction[];
  actions: IEndableAction[];
  timelines: IResolvedTimelineConfiguration[];
  timelineFlow?: ITimelineFlow;
  labels: ILanguageLabel[];
}

export interface IResolvedActionConfiguration {
  id: string;
  name: string;
  startOperations: IResolvedOperation[];
}

export interface IResolvedEndableActionConfiguration
  extends IResolvedActionConfiguration {
  endOperations: IResolvedOperation[];
}

export type ITimelineFlow = Record<string, never>;

export interface ITimelineProviderSettings {
  id: string;
  vendor: string;
  systemName: string;
  selector?: string;
  poster?: string;
}

export interface IResolvedTimelineConfiguration {
  id: string;
  uri: string;
  type: TimelineTypes;
  duration: number;
  loop: boolean;
  selector: string;
  timelineActions: ITimelineAction[];
}

export interface ITimelineConfiguration {
  id: string;
  uri: string;
  type: TimelineTypes;
  duration: number;
  loop: boolean;
  selector: string;
  timelineActions: ITimelineActionConfiguration[];
}

export interface IOperationConfiguration<T extends TOperationData> {
  id: string;
  systemName: string;
  operationData?: T;
}

export interface IEventActionConfiguration extends IActionConfiguration {
  eventName: string;
  eventTopic?: string;
}

export interface IActionConfiguration {
  id: string;
  name: string;
  startOperations: IOperationConfiguration<TOperationData>[];
}

export interface IEndableActionConfiguration extends IActionConfiguration {
  endOperations: IOperationConfiguration<TOperationData>[];
}

export interface ITimelineActionConfiguration
  extends IEndableActionConfiguration {
  duration: IDuration;
}

export interface IEventActionConfiguration extends IActionConfiguration {
  eventName: string;
  eventTopic?: string;
}

export interface IResolvedOperation {
  id: string;
  systemName: string;
  operationData: TOperationData;
  instance: TOperation<any>;
}
