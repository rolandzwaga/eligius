import { v4 as uuidv4 } from 'uuid';
import { deepCopy } from '../../operation/helper/deep-copy';
import { ILabel, ILanguageLabel, TimelineTypes } from '../../types';
import {
  IActionConfiguration,
  IEngineConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration
} from '../types';
import { ActionCreatorFactory } from './action-creator-factory';
import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor
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

/**
 * This class offers a fluent and strongly typed DSL for creating Eligius configurations.
 *
 * @example Building a configuration using the factory
 * To initialize a basic configuration to start off of:
 * ```ts
 * const factory = new ConfigurationFactory()
 * .init("en-US")                                               // Define the default language
 * .addLanguage("en-US", "English")                             // Add English as a supported language
 * .addLanguage("nl-NL", "Nederlands")                          // Add Dutch as a supported language
 * .setLayoutTemplate("<div class=\"main.container\"></div>")   // Add the main container for the presentation
 * .setContainerSelector("#ct-container")                       // Selector for the element in the body that will contain the presentation
 * .addTimeline(                                                // Add a first timeline
 *   'timeline-1',          // Give it a name
 *   "animation",           // This is RAF based timeline
 *   200,                   // The duration of the timeline in seconds
 *   false,                 // The presentation does NOT play in a loop
 *   ".timeline-container"  // The element within the main layout (defined by the layoutTemplate) in which the timeline will be rendered
 * )
 * .editTimelineProviderSettings()                          // Add a timeline provider
 * .addProvider("animation")                                // One that provides timelines for type 'animation'
 * .setSystemName("RequestAnimationFrameTimelineProvider")  // The system name of the provider
 * .setVendor("eligius")                                    // Eligius is the vendor in this case
 * .end();                                                  // This finally returns the ConfigurationFactory instance
 * ```
 *
 * Then to add an init action:
 * ```ts
 * factory
 *  .createInitAction("GetUserName")
 *  .addStartOperationByType(getQueryParams, {
 *   defaultValues: { username: "guest" },
 *  })
 *  .addStartOperationByType(setGlobalData, { properties: ["queryParams"] });
 * ```
 *
 * After that, add a timeline action:
 * ```ts
 * factory.createTimelineAction("timeline-1", "AddIntroContainer")
 *  .addDuration(0, 10)
 *  .addStartOperationByType(selectElement, { selector: ".timeline-container" })
 *  .addStartOperationByType(setElementContent, {
 *    template: '<div class="intro-text"></div>',
 *  })
 *  .addEndOperationByType(selectElement, { selector: ".intro-text" })
 *  .addEndOperationByType(removeElement, {});
 * ```
 *
 * It also possible to extend the factory with specialized creation methods for the particular
 * configuration you are building:
 * ```ts
 * function addImage(this: ConfigurationFactory, actionName: string, imageSrc: string, imageId: string) {
 *  this.createInitAction(actionName)
 *      .addStartOperationByType(selectElement, { selector: ".timeline-container" })
 *      .addStartOperationByType(createElement, { element: 'img', attributes: {src: imageSrc, imageId} })
 *      .addStartOperationByType(setElementContent, { insertionType: "append" })
 *      .addEndOperationByType(selectElement, { selector: `#${imageId}` })
 *      .addEndOperationByType(removeElement, {});
 * }
 *
 * const customFactory = ConfigurationFactory.extend(factory, "addImage", addImage);
 *
 * customFactory.addImage("MyImageActionName", "my-image.png", "my-image-id");
 * ```
 *
 * Finally, retrieve the configuration and save it:
 * ```ts
 * import fs from "fs";
 *
 * const configuration = customFactory.getConfiguration();
 *
 * fs.writeFileSync("/my/path/configuration.json", JSON.stringify(configuration), {encoding:'utf-8'})
 * ```
 *
 * The `ConfigurationFactory` can also be used to edit an existing configuration. In this case, simply
 * pass the JSON configuration to the `ConfigurationFactory`'s constructor:
 * ```ts
 * import myConfiguration from './my-configuration.json';
 *
 * const factory = new ConfigurationFactory(myConfiguration);
 *
 * factory.editInitAction("existingActionName")
 *        .removeEndOperation("475fd0ab-5755-4e60-8f7c-e1988a109678");
 * ```
 *
 */
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
    callBack?: (copy: IEngineConfiguration) => IEngineConfiguration | undefined
  ) {
    const copy = deepCopy<IEngineConfiguration>(this.configuration);
    if (callBack) {
      const newConfig = callBack.call(this, copy);
      if (newConfig) {
        this.configuration = newConfig;
      }
    }
    return copy;
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

  removeLabel(id: string) {
    const idx = this.configuration.labels.findIndex((x) => x.id === id);
    if (idx > -1) {
      this.configuration.labels.splice(idx, 1);
    } else {
      throw new Error(`Label with id '${id}' not found!`);
    }
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