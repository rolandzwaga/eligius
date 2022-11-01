import { v4 as uuidv4 } from 'uuid';
import { deepCopy } from '../../operation/helper/deep-copy';
import { ILabel, ILanguageLabel, TimelineTypes } from '../../types';
import {
  IActionConfiguration,
  IEngineConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '../types';
import { ActionCreatorFactory } from './action-creator-factory';
import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from './action-editor';
import { TimelineProvidersSettingsEditor } from './timeline-provider-settings-editor';

export type TEngineConfigurationLists = Pick<
  IEngineConfiguration,
  | 'availableLanguages'
  | 'initActions'
  | 'actions'
  | 'eventActions'
  | 'timelines'
  | 'labels'
>;

type ConfigurationFactoryExtension = (
  this: ConfigurationFactory,
  ...rest: any[]
) => void;

export class ConfigurationFactory {
  actionCreatorFactory: ActionCreatorFactory;
  configuration: IEngineConfiguration;

  constructor(config?: IEngineConfiguration) {
    this.configuration = config || ({} as any);
    this.actionCreatorFactory = new ActionCreatorFactory(this);
  }

  static extend<
    T extends ConfigurationFactory,
    K extends string | number | symbol,
    C extends ConfigurationFactoryExtension
  >(factory: T, extensionMethodName: K, extensionMethod: C) {
    (factory as any)[extensionMethodName] = extensionMethod.bind(factory);
    return factory as T & { [k in K]: typeof extensionMethod };
  }

  static extendMultiple<
    T extends ConfigurationFactory,
    C extends ConfigurationFactoryExtension,
    D extends { [name: string]: C }
  >(factory: T, extensions: D) {
    Object.entries(extensions).forEach(([name, method]) =>
      ConfigurationFactory.extend(factory, name, method)
    );
    return factory as T & typeof extensions;
  }

  init(defaultLanguage: string) {
    this.configuration = {
      id: uuidv4(),
      engine: {
        systemName: 'EligiusEngine',
      },
      containerSelector: '[data-ct-container=true]',
      timelineProviderSettings: {} as any,
      language: defaultLanguage,
      availableLanguages: [],
      layoutTemplate: '',
      initActions: [],
      actions: [],
      timelines: [],
      labels: [],
    };

    return this;
  }

  setLayoutTemplate(layoutTemplate: string) {
    this.configuration.layoutTemplate = layoutTemplate;
    return this;
  }

  setDefaultLanguage(defaultLanguage: string) {
    this.configuration.language = defaultLanguage;
    return this;
  }

  setContainerSelector(selector: string) {
    this.configuration.containerSelector = selector;
    return this;
  }

  editTimelineProviderSettings() {
    return new TimelineProvidersSettingsEditor(
      this.configuration.timelineProviderSettings || {},
      this
    );
  }

  getConfiguration(
    callBack: (copy: IEngineConfiguration) => IEngineConfiguration | undefined
  ) {
    const copy = deepCopy<IEngineConfiguration>(this.configuration);
    const newConfig = callBack.call(this, copy);
    if (newConfig) {
      this.configuration = newConfig;
    }
    return this;
  }

  addLanguage(languageCode: string, languageLabel: string) {
    const languages = this._initializeCollection(
      this.configuration,
      'availableLanguages'
    );
    const existing = languages.find(
      (lang) => lang.languageCode === languageCode
    );

    if (existing) {
      throw new Error(`Language code '${languageCode}' already exists`);
    }

    languages.push({
      id: uuidv4(),
      languageCode: languageCode,
      label: languageLabel,
    });
    return this;
  }

  _internalAddAction(
    collectionName: keyof TEngineConfigurationLists,
    action: IActionConfiguration
  ) {
    const actions = this._initializeCollection(
      this.configuration,
      collectionName
    );
    actions?.push(action as any);
  }

  _initializeCollection<T, K extends keyof T>(parent: T, name: K): T[K] {
    if (!parent[name]) {
      (parent[name] as any) = [];
    }
    return parent[name] as T[K];
  }

  addAction(action: IActionConfiguration) {
    this._internalAddAction('actions', action);
  }

  addInitAction(action: IActionConfiguration) {
    this._internalAddAction('initActions', action);
  }

  addEventAction(action: IActionConfiguration) {
    this._internalAddAction('eventActions', action);
  }

  addTimelineAction(uri: string, action: ITimelineActionConfiguration) {
    const timeline = this.getTimeline(uri);
    if (timeline) {
      const timelineActions = this._initializeCollection(
        timeline,
        'timelineActions'
      );
      timelineActions.push(action);
    } else {
      throw Error(`No timeline found for uri '${uri}'`);
    }
  }

  createAction(name: string) {
    return this.actionCreatorFactory.createAction(name);
  }

  createInitAction(name: string) {
    return this.actionCreatorFactory.createInitAction(name);
  }

  createEventAction(name: string) {
    return this.actionCreatorFactory.createEventAction(name);
  }

  createTimelineAction(uri: string, name: string) {
    return this.actionCreatorFactory.createTimelineAction(uri, name);
  }

  addTimeline(
    uri: string,
    type: TimelineTypes,
    duration: number,
    loop: boolean,
    selector: string
  ) {
    const timelines = this._initializeCollection(
      this.configuration,
      'timelines'
    );
    const timeline = this.getTimeline(uri);
    if (timeline) {
      throw Error(`timeline for uri ${uri} already exists`);
    }
    const timelineConfig: ITimelineConfiguration = {
      id: uuidv4(),
      type: type,
      uri: uri,
      duration: duration,
      loop: loop,
      selector: selector,
      timelineActions: [],
    };
    timelines.push(timelineConfig);
    return this;
  }

  getTimeline(uri: string) {
    return this.configuration.timelines.find((t) => t.uri === uri);
  }

  removeTimeline(uri: string) {
    const timelineConfig = this.getTimeline(uri);
    if (timelineConfig) {
      const idx = this.configuration.timelines.indexOf(timelineConfig);
      if (idx > -1) {
        this.configuration.timelines.splice(idx, 1);
      }
    }
    return this;
  }

  _initializeLabel(id: string, labels: ILanguageLabel[]) {
    let label = labels.find((l) => l.id === id);
    if (!label) {
      labels.push({
        id: id,
        labels: [],
      });
      label = labels[labels.length - 1];
    }
    return label;
  }

  _getLabelTranslation(labelTranslations: ILabel[], languageCode: string) {
    let translation = labelTranslations.find(
      (l) => l.languageCode === languageCode
    );
    if (!translation) {
      translation = {
        id: uuidv4(),
        languageCode: languageCode,
        label: '',
      };
      labelTranslations.push(translation);
    }
    return translation;
  }

  addLabel(id: string, code: string, translation: string) {
    const labels = this._initializeCollection(this.configuration, 'labels');
    const labelConfig = this._initializeLabel(id, labels);
    const labelTranslation = this._getLabelTranslation(
      labelConfig.labels,
      code
    );
    labelTranslation.label = translation;
    return this;
  }

  editAction(id: string) {
    const actionConfig = this.configuration.actions.find((a) => a.id === id);
    if (actionConfig) {
      return new EndableActionEditor(actionConfig, this);
    }
    throw new Error(`Action not found for id ${id}`);
  }

  editEventAction(id: string) {
    const actionConfig = this.configuration.eventActions?.find(
      (a) => a.id === id
    );
    if (actionConfig) {
      return new ActionEditor(actionConfig, this);
    }
    throw new Error(`Event action not found for id ${id}`);
  }

  editInitAction(id: string) {
    const actionConfig = this.configuration.initActions.find(
      (a) => a.id === id
    );
    if (actionConfig) {
      return new EndableActionEditor(actionConfig, this);
    }
    throw new Error(`Init action not found for id ${id}`);
  }

  editTimelineAction(uri: string, id: string) {
    const timeline = this.getTimeline(uri);
    if (!timeline) {
      throw new Error(`Timeline not found for id ${id}`);
    }
    const actionConfig = timeline.timelineActions.find((a) => a.id === id);
    if (actionConfig) {
      return new TimelineActionEditor(actionConfig, this);
    }
    throw new Error(`Timeline action not found for id ${id}`);
  }
}