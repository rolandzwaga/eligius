import { IAction } from './action/types';
import {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from './configuration/types';
import { IEventbusListener } from './eventbus/types';
import { ITimelineProvider } from './timelineproviders/types';

export interface IEngineFactory {
  createEngine(
    engineConfig: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEligiusEngine;
}

export interface IEligiusEngine {
  init(): Promise<ITimelineProvider>;
  destroy(): Promise<void>;
}

export interface ISimpleResourceImporter {
  import(name: string): Record<string, any>;
}

export interface IResourceImporter extends ISimpleResourceImporter {
  getOperationNames(): string[];
  getControllerNames(): string[];
  getProviderNames(): string[];
}

export interface IConfigurationResolver {
  process(
    configuration: IEngineConfiguration,
    actionRegistryListener?: IEventbusListener
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
  id: string;
  vendor: string;
  provider: ITimelineProvider;
}

export interface ILanguageLabel {
  id: string;
  labels: ILabel[];
}

export interface ILabel {
  id: string;
  languageCode: string;
  label: string;
}

export interface IDimensions {
  width: number;
  height: number;
}
