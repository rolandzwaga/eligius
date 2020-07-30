import { TOperationData, TOperation } from './action/types';
import { TTimelineType, ITimelineProvider } from './timelineproviders/types';

export interface IEngineFactory {
  createEngine(engineConfig: IEngineConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine;
}

export interface IEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings: Record<TimelineTypes, ITimelineProviderSettings>;
  containerSelector: string;
  language: string;
  layoutTemplate: string;
  availableLanguages: ILanguageInfo[];
  initActions: IEndableActionConfiguration[];
  actions: IEndableActionConfiguration[];
  eventActions: IActionConfiguration[];
  timelines: ITimelineConfiguration[];
  timelineFlow: ITimelineFlow;
  labels: ILabelInfo[];
}

export interface IResolvedEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings: Record<TimelineTypes, ITimelineProviderSettings>;
  containerSelector: string;
  language: string;
  layoutTemplate: string;
  availableLanguages: ILanguageInfo[];
  initActions: IEndableAction[];
  actions: IEndableAction[];
  timelines: IResolvedTimelineConfiguration[];
  timelineFlow: ITimelineFlow;
  labels: ILabelInfo[];
}

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
  instance?: TOperation;
}

export interface IChronoTriggerEngine {
  init(): Promise<ITimelineProvider>;
  destroy(): void;
}

export interface IResourceImporter {
  import(name: string): Record<string, any>;
  getOperationNames(): string[];
  getControllerNames(): string[];
  getProviderNames(): string[];
}

export interface IConfigurationResolver {
  process(
    actionRegistryListener: IEventbusListener,
    configuration: IConfiguration
  ): [Record<string, IAction>, IResolvedEngineConfiguration];
  importSystemEntry(systemName: string): any;
  initializeEventActions(actionRegistryListener: IEventbusListener, config: IConfiguration): void;
  initializeActions(config: IConfiguration, actionsLookup: any): void;
  initializeInitActions(config: IConfiguration, actionsLookup: any): void;
  initializeTimelineActions(config: IConfiguration): void;
  initializeTimelineAction(timelineConfig: any): void;
  resolveOperations(config: IConfiguration): void;
  processConfiguration(config: IConfiguration, parentConfig: IConfiguration): void;
  processConfigProperty(key: string, config: IConfiguration, parentConfig: IConfiguration): void;
}

export type TResultCallback = (result: any) => void;

export interface IDuration {
  start: number;
  end: number;
}

export type TimelineTypes = 'animation' | 'mediaplayer';

export interface ITimelineProviderInfo {
  vendor: string;
  provider: ITimelineProvider;
}

export interface ILanguageLabel {
  id: string;
  labels: ILabel[];
}

export interface ILabel {
  language: string;
  text: string;
}

export interface IDimensions {
  width: number;
  height: number;
}
