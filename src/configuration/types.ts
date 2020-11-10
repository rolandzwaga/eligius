import { IEndableAction, ITimelineAction } from '../action/types';
import { TOperation, TOperationData } from '../operation/types';
import { IDuration, ILabel, ILanguageLabel, TimelineTypes } from '../types';

export interface IEngineInfo {
  systemName: string;
}

export interface IEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings: Record<TimelineTypes, ITimelineProviderSettings>;
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
  timelineProviderSettings: Record<TimelineTypes, ITimelineProviderSettings>;
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

export interface ITimelineFlow {}

export interface ITimelineProviderSettings {
  vendor: string;
  selector: string;
  systemName: string;
  poster: string;
}

export interface IResolvedTimelineConfiguration {
  uri: string;
  type: TimelineTypes;
  duration: number;
  loop: boolean;
  selector: string;
  timelineActions: ITimelineAction[];
}

export interface ITimelineConfiguration {
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
  operationData: TOperationData;
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

export interface ITimelineActionConfiguration extends IEndableActionConfiguration {
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
  instance: TOperation;
}
