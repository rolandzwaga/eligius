import { v4 as uuidv4 } from 'uuid';
import { deepCopy } from '../../operation/helper/deep-copy.ts';
import type {
  ILabel,
  ILanguageLabel,
  KeysOfType,
  TimelineTypes,
  TLanguageCode,
} from '../../types.ts';
import { mergeIfMissing } from '../../util/merge-if-missing.ts';
import type {
  IActionConfiguration,
  IEngineConfiguration,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '../types.ts';
import { ActionCreatorFactory } from './action-creator-factory.ts';
import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from './action-editor.ts';
import { LabelEditor } from './label-editor.ts';
import { TimelineProvidersSettingsEditor } from './timeline-provider-settings-editor.ts';

/** */
export type TEngineConfigurationLists = KeysOfType<IEngineConfiguration, any[]>;

type ConfigurationFactoryExtension<NewFactory extends ConfigurationFactory> = (
  this: NewFactory,
  ...rest: any[]
) => void;

/**
 * This class offers a fluent, extensible and strongly typed DSL for creating Eligius configurations.
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
 * import fs from "node:fs";
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
 */
export class ConfigurationFactory {
  actionCreatorFactory: ActionCreatorFactory;

  /**
   * Constructs a new `ConfigurationFactory`
   * @param config an optional existing configuration that will be used as a starting point
   */
  constructor(public configuration: IEngineConfiguration = {} as any) {
    this.actionCreatorFactory = new ActionCreatorFactory(this);
  }

  /**
   * Add specialized method to a factory
   *
   * @param factory
   * @param extensionMethodName
   * @param extensionMethod
   * @returns
   */
  static extend<
    T extends ConfigurationFactory,
    K extends PropertyKey,
    C extends (this: T & { [P in K]: C }, ...args: any[]) => any,
  >(factory: T, extensionMethodName: K, extensionMethod: C): T & { [P in K]: C } {
    return Object.defineProperty<T & { [P in K]: C }>(
      factory as any,
      extensionMethodName,
      {
        value: function (this: T & { [P in K]: C }, ...args: Parameters<C>) {
          return extensionMethod.apply(this, args);
        },
        writable: true,
        configurable: true,
      }
    );
  }

  /**
   * Add specialized methods to a factory
   *
   * @param factory
   * @param extensions
   * @returns
   */
  static extendMultiple<
    T extends ConfigurationFactory,
    C extends ConfigurationFactoryExtension<T>,
    D extends { [name: string]: C; },
  >(factory: T, extensions: D) {
    return Object.entries(extensions).reduce<T & typeof extensions>(
      (acc, [name, method]) =>
        ConfigurationFactory.extend(acc, name, method) as T & typeof extensions,
      factory as T & typeof extensions
    );
  }

  /**
   * Initialize the configuration with a minimal shape.
   *
   * It assigns an ID, sets the engine to `EligiusEngine`, default the containerSelector `[data-ct-container=true]`
   * and initializes all of the list properties with empty arrays.
   * @param defaultLanguage
   * @returns
   */
  init(defaultLanguage: TLanguageCode) {
    const newConfiguration: IEngineConfiguration = {
      id: uuidv4(),
      engine: {
        systemName: 'EligiusEngine',
      },
      containerSelector: '[data-ct-container=true]',
      timelineProviderSettings: {},
      language: defaultLanguage,
      availableLanguages: [],
      layoutTemplate: '',
      initActions: [],
      actions: [],
      timelines: [],
      labels: [],
    };

    this.configuration = mergeIfMissing(this.configuration, newConfiguration);

    return this;
  }

  /**
   * Assigns the engine system name
   * @param systemName
   * @returns
   */
  setEngine(systemName: string) {
    this.configuration.engine.systemName = systemName;
    return this;
  }

  /**
   * Assigns a string representation of the HTML layout template for the engine.
   *
   * @param layoutTemplate
   * @returns
   */
  setLayoutTemplate(layoutTemplate: string) {
    this.configuration.layoutTemplate = layoutTemplate;
    return this;
  }

  /**
   *
   * Assigns the default language
   *
   * @param defaultLanguage
   * @returns
   */
  setDefaultLanguage(defaultLanguage: TLanguageCode) {
    this.configuration.language = defaultLanguage;
    return this;
  }

  /**
   *
   * Assign the css selector that specifies the DOM location where the engine renders its output
   *
   * @param selector
   * @returns
   */
  setContainerSelector(selector: string) {
    this.configuration.containerSelector = selector;
    return this;
  }

  /**
   *
   * Starts an editing process for the timeline provider settings.
   *
   * @returns
   */
  editTimelineProviderSettings() {
    return new TimelineProvidersSettingsEditor(
      this.configuration.timelineProviderSettings || {},
      this
    );
  }

  /**
   *
   * Return a copy of the current state of the configuration
   *
   * @param callBack the callback receives the configuration as well and can return a mutated version wich will be assigned to the factory's internal state
   * @returns
   */
  getConfiguration(
    callBack?: (copy: IEngineConfiguration) => IEngineConfiguration
  ) {
    const copy = deepCopy<IEngineConfiguration>(this.configuration);
    if (callBack) {
      const newConfig = callBack.call(this, copy);
      this.configuration = deepCopy<IEngineConfiguration>(newConfig);
    }
    return copy;
  }

  /**
   *
   * Adds a language to the `availableLanguages` list.
   * The label represents the name of the language.
   *
   * An error is thrown if a language with the given language code already exists
   *
   * @example
   * factory.addLanguage('en-GB', 'English');
   *
   * @param languageCode The given alnguage code
   * @param languageLabel The human readable name of the language
   * @returns
   */
  addLanguage(languageCode: TLanguageCode, languageLabel: string) {
    const languages = this._initializeCollection(
      this.configuration,
      'availableLanguages'
    );
    const existing = languages.find(lang => lang.languageCode === languageCode);

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

  private _internalAddAction(
    collectionName: TEngineConfigurationLists,
    action: IActionConfiguration
  ) {
    const actions = this._initializeCollection(
      this.configuration,
      collectionName
    );
    actions?.push(action as any);
  }

  private _initializeCollection<T, K extends keyof T>(
    parent: T,
    name: K
  ): T[K] {
    if (!parent[name]) {
      (parent[name] as any) = [];
    }
    return parent[name] as T[K];
  }

  /**
   *
   * Adds the specified action to the `actions` list.
   *
   * @param action
   */
  addAction(action: IActionConfiguration) {
    this._internalAddAction('actions', action);
  }

  /**
   *
   * Adds the specified action to the `initActions` list
   *
   * @param action
   */
  addInitAction(action: IActionConfiguration) {
    this._internalAddAction('initActions', action);
  }

  /**
   *
   * Adds the specified action to the `eventActions` list
   *
   * @param action
   */
  addEventAction(action: IActionConfiguration) {
    this._internalAddAction('eventActions', action);
  }

  /**
   *
   * Adds the given actions to `timelineActions` list that is associated with the specified uri
   *
   * @param uri
   * @param action
   */
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

  /**
   *
   * Starts the creation of a new action with the specified name that gets added to the `actions` list
   *
   * @param name
   * @returns
   */
  createAction(name: string) {
    return this.actionCreatorFactory.createAction(name);
  }

  /**
   *
   * Starts the creation of a new action with the specified name that gets added to the `initActions` list
   *
   * @param name
   * @returns
   */
  createInitAction(name: string) {
    return this.actionCreatorFactory.createInitAction(name);
  }

  /**
   *
   * Starts the creation of a new action with the specified name that gets added to the `eventActions` list
   *
   * @param name
   * @returns
   */
  createEventAction(name: string) {
    return this.actionCreatorFactory.createEventAction(name);
  }

  /**
   *
   * Starts the creation of a new action with the specified name that gets added to the `timelineActions` list that is associated with the specified uri
   *
   * @param uri
   * @param name
   * @returns
   */
  createTimelineAction(uri: string, name: string) {
    return this.actionCreatorFactory.createTimelineAction(uri, name);
  }

  /**
   * Add a timeline with the given data
   *
   * @param uri identifier for the timeline
   * @param type animation or mediaplayer
   * @param duration the duration of the timeline in seconds
   * @param isLooped True if the timeline should automatically restart at the end
   * @param selector css selector for the container where the timeline will be rendered
   * @returns
   */
  addTimeline(
    uri: string,
    type: TimelineTypes,
    duration: number,
    isLooped: boolean,
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
      loop: isLooped,
      selector: selector,
      timelineActions: [],
    };
    timelines.push(timelineConfig);
    return this;
  }

  /**
   *
   * Gets the timeline associated with the specified uri
   *
   * @param uri
   * @returns
   */
  getTimeline(uri: string) {
    return this.configuration.timelines.find(t => t.uri === uri);
  }

  /**
   *
   * Removes the timeline associated with the specified uri
   *
   * @param uri
   * @returns
   */
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

  private _initializeLabel(id: string, labels: ILanguageLabel[]) {
    let label = labels.find(l => l.id === id);
    if (!label) {
      labels.push({
        id: id,
        labels: [],
      });
      label = labels[labels.length - 1];
    }
    return label;
  }

  private _getLabelTranslation(
    labelTranslations: ILabel[],
    languageCode: TLanguageCode
  ) {
    let translation = labelTranslations.find(
      l => l.languageCode === languageCode
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

  /**
   *
   * Starts an editor for the label that is associated with the specified id
   *
   * @param id
   * @returns
   */
  editLabel(id: string) {
    const label = this.configuration.labels?.find(x => x.id === id);
    if (label) {
      return new LabelEditor(this, label);
    } else {
      throw new Error(`Language label with id '${id}' not found`);
    }
  }

  /**
   *
   * Adds a label translation with the specified data
   *
   * @param id The id for the label
   * @param languageCode The language code associated with the label
   * @param translation The label text in the language specified by the language code
   * @returns
   */
  addLabel(id: string, languageCode: TLanguageCode, translation: string) {
    const labels = this._initializeCollection(this.configuration, 'labels');
    const labelConfig = this._initializeLabel(id, labels);
    const labelTranslation = this._getLabelTranslation(
      labelConfig.labels,
      languageCode
    );
    labelTranslation.label = translation;
    return this;
  }

  /**
   *
   * Adds multiple translations with the specified data
   *
   * @param id The id for the label
   * @param translations A record that holds language code to translations lookups
   * @returns
   */
  addLabels(id: string, translations: Record<TLanguageCode, string>) {
    Object.entries(translations).forEach(([code, translation]) =>
      this.addLabel(id, code as TLanguageCode, translation)
    );
    return this;
  }

  /**
   *
   * Removes all translations with the given id
   *
   * @param id the id for the label
   * @returns
   */
  removeLabel(id: string) {
    const idx = this.configuration.labels.findIndex(x => x.id === id);
    if (idx > -1) {
      this.configuration.labels.splice(idx, 1);
    } else {
      throw new Error(`Label with id '${id}' not found!`);
    }
    return this;
  }

  /**
   *
   * Starts an editor for the action from the `actions` list associated with the given id
   *
   * @param id
   * @returns
   */
  editAction(id: string) {
    const actionConfig = this.configuration.actions.find(a => a.id === id);
    if (actionConfig) {
      return new EndableActionEditor(actionConfig, this);
    }
    throw new Error(`Action not found for id ${id}`);
  }

  /**
   *
   * Starts an editor for the action from the `eventActions` list associated with the given id
   *
   * @param id
   * @returns
   */
  editEventAction(id: string) {
    const actionConfig = this.configuration.eventActions?.find(
      a => a.id === id
    );
    if (actionConfig) {
      return new ActionEditor(actionConfig, this);
    }
    throw new Error(`Event action not found for id ${id}`);
  }

  /**
   *
   * Starts an editor for the action from the `initActions` list associated with the given id
   *
   * @param id
   * @returns
   */
  editInitAction(id: string) {
    const actionConfig = this.configuration.initActions.find(a => a.id === id);
    if (actionConfig) {
      return new EndableActionEditor(actionConfig, this);
    }
    throw new Error(`Init action not found for id ${id}`);
  }

  /**
   *
   * Starts an editor for the action from the `timelineActions` list associated with the given uri and id
   *
   * @param uri
   * @param id
   * @returns
   */
  editTimelineAction(uri: string, id: string) {
    const timeline = this.getTimeline(uri);
    if (!timeline) {
      throw new Error(`Timeline not found for id ${id}`);
    }
    const actionConfig = timeline.timelineActions.find(a => a.id === id);
    if (actionConfig) {
      return new TimelineActionEditor(actionConfig, this);
    }
    throw new Error(`Timeline action not found for id ${id}`);
  }
}
