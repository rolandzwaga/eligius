import { IAction } from './action/types';
import {
  IEngineConfiguration,
  IResolvedEngineConfiguration
} from './configuration/types';
import { IEventbus, IEventbusListener } from './eventbus/types';
import { ITimelineProvider } from './timelineproviders/types';

export type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true
    ? T[P] extends U
      ? U extends T[P]
        ? P
        : never
      : never
    : T[P] extends U
    ? P
    : never;
}[keyof T];

/**
 * Describes an object that is capable of processing the given configuration and constructing an IEligiusEngine
 * based on this configuration.
 */
export interface IEngineFactory {
  /**
   * Returns a fully configured IEligiusEngine instance.
   * 
   * @param engineConfig The given configuration
   * @param resolver An optional resolver to process the given IEngineConfiguration. When not provided the IEngineFactory is expected to create their own instance.
   */
  createEngine(
    engineConfig: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEligiusEngine;
}

export interface IEngineFactoryOptions {
  eventbus?: IEventbus;
  devtools?: boolean;
}

/**
 * Describes an object that is play one or more timelines, defined by a given set of ITimelineProviders.
 */
export interface IEligiusEngine {
  /**
   * Do the preparations needed in order to run the given timelines.
   */
  init(): Promise<ITimelineProvider>;
  /**
   * Do the necessary cleanup before discarding this instance.
   */
  destroy(): Promise<void>;
}

/**
 * Describes an object that acts as a registry for imported resources.
 */
export interface ISimpleResourceImporter {
  import(name: string): Record<string, any>;
}

/**
 * Describes an object that acts as a registry for imported resources and
 * is able to return all of the registered operation, controller and provider names.
 */
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

/**
 * Describes a duration of time expressed in a start and an optional end range with a one second interval.
 */
export interface IDuration {
  start: number;
  end?: number;
}

/**
 * Describes a duration of time expressed in a start and an end range with a one second interval.
 */
export interface IStrictDuration extends Required<IDuration> {}

/**
 * Describes the different kinds of timeline providers.
 */
export type TimelineTypes = 'animation' | 'mediaplayer';

/**
 * 
 */
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
