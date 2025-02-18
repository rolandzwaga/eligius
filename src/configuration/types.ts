import type { IEndableAction, ITimelineAction } from '../action/types.ts';
import type { TOperation, TOperationData } from '../operation/types.ts';
import type { IDuration, ILabel, ILanguageLabel, TimelineTypes } from '../types.ts';

export type ExtractDataType<P> = P extends TOperation<infer T, any> ? T : never;
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
  language: string;
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
  language: string;
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

export interface ITimelineFlow {}

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

export interface IOperationConfiguration {
  id: string;
  systemName: string;
  operationData?: TOperationData;
}

export interface IEventActionConfiguration extends IActionConfiguration {
  eventName: string;
  eventTopic?: string;
}

export interface IActionConfiguration {
  id: string;
  name: string;
  startOperations: IOperationConfiguration[];
}

export interface IEndableActionConfiguration extends IActionConfiguration {
  endOperations: IOperationConfiguration[];
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
