import { IAction } from './action/types';
import { IEngineConfiguration, IResolvedEngineConfiguration } from './configuration/types';
import { IEventbusListener } from './eventbus/types';
import { ITimelineProvider } from './timelineproviders/types';

export interface IEngineFactory {
  createEngine(engineConfig: IEngineConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine;
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
    configuration: IEngineConfiguration
  ): [Record<string, IAction>, IResolvedEngineConfiguration];
}

export type TResultCallback = (result: any) => void;

export interface IDuration {
  start: number;
  end?: number;
}

export interface IStrictDuration {
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
  code: string;
  label: string;
}

export interface IDimensions {
  width: number;
  height: number;
}
