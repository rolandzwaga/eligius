import {ActionCreatorFactory} from '@configuration/api/action-creator-factory.ts';
import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from '@configuration/api/action-editor.ts';
import {TimelineProvidersSettingsEditor} from '@configuration/api/timeline-provider-settings-editor.ts';
import type {
  IActionConfiguration,
  IContainerProviderConfig,
  IEngineConfiguration,
  IPositionSourceConfig,
  ITimelineActionConfiguration,
  ITimelineConfiguration,
} from '@configuration/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {mergeIfMissing} from '@util/merge-if-missing.ts';
import {v4 as uuidv4} from 'uuid';
import type {KeysOfType, TimelineTypes, TLanguageCode} from '../../types.ts';
import {syncInPlace} from './sync-in-place.ts';

/** */
export type TEngineConfigurationLists = KeysOfType<IEngineConfiguration, any[]>;

/**
 * Action names must be unique across these lists.
 */
const UNIQUE_NAME_LISTS: TEngineConfigurationLists[] = [
  'actions',
  'eventActions',
];

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
 * .editTimelineProviderSettings()                      // Add a timeline provider
 * .addProvider("animation", "RafPositionSource")      // Timelines of type 'animation' get their time from requestAnimationFrame
 * .setContainer(".timeline-container")                 // The element the timeline renders into
 * .end();                                              // This finally returns the ConfigurationFactory instance
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
 *      .addStartOperationByType(createElement, { elementName: 'img', attributes: {src: imageSrc, id: imageId} })
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
 * In plain Node (build tools, code generators) import the factory from `eligius/configuration-api`.
 * That entry does not load jQuery or the other DOM dependencies. It supports every method except the
 * `...ByType` ones, which need the operation implementations; use the name based methods there:
 * ```ts
 * import {ConfigurationFactory} from 'eligius/configuration-api';
 *
 * factory.createAction('MyAction').addStartOperation('selectElement', {selector: '#app'});
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
    C extends (this: T & {[P in K]: C}, ...args: any[]) => any,
  >(factory: T, extensionMethodName: K, extensionMethod: C): T & {[P in K]: C} {
    return Object.defineProperty<T & {[P in K]: C}>(
      factory as any,
      extensionMethodName,
      {
        value: function (this: T & {[P in K]: C}, ...args: Parameters<C>) {
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
    D extends {[name: string]: C},
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
      cssFiles: [],
      timelineProviderSettings: {},
      language: defaultLanguage,
      availableLanguages: [],
      layoutTemplate: '',
      initActions: [],
      actions: [],
      timelines: [],
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
    this.configuration.timelineProviderSettings ??= {};
    return new TimelineProvidersSettingsEditor(
      this.configuration.timelineProviderSettings,
      this
    );
  }

  /**
   *
   * Return a copy of the current state of the configuration
   *
   * @param callBack the callback receives a copy of the configuration and can return a changed version. The changes are applied to the factory's configuration in place, so editors that are still open keep working.
   * @returns
   */
  getConfiguration(
    callBack?: (copy: IEngineConfiguration) => IEngineConfiguration
  ) {
    const copy = deepCopy<IEngineConfiguration>(this.configuration);
    if (callBack) {
      const newConfig = callBack.call(this, copy);
      // Update the existing configuration in place, so editors that hold
      // objects inside it stay attached to the factory.
      syncInPlace(
        this.configuration,
        deepCopy<IEngineConfiguration>(newConfig)
      );
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
    if (UNIQUE_NAME_LISTS.includes(collectionName)) {
      this._assertActionNameFree(action.name, action);
    }
    const actions = this._initializeCollection(
      this.configuration,
      collectionName
    );
    actions?.push(action as any);
  }

  /**
   * Throws when the given action is in `actions` or `eventActions` and another
   * action in those lists already has the given name. Action names must be
   * unique across those two lists, the rule the `ConfigurationResolver`
   * enforces, so the fluent API reports a duplicate where it is made instead of
   * when the engine is created. Init actions and timeline actions are not
   * checked.
   *
   * Called by the action creators and editors before they rename an action.
   *
   * @param name the new action name
   * @param action the action that gets the name
   * @throws Error when the name is already taken
   */
  assertUniqueActionName(name: string, action: IActionConfiguration): void {
    const isChecked = UNIQUE_NAME_LISTS.some(listName =>
      (
        this.configuration[listName] as IActionConfiguration[] | undefined
      )?.includes(action)
    );
    if (isChecked) {
      this._assertActionNameFree(name, action);
    }
  }

  private _assertActionNameFree(name: string, action: IActionConfiguration) {
    // Empty names are not checked, so an action can be created first and named later
    if (!name) {
      return;
    }
    const taken = UNIQUE_NAME_LISTS.some(listName =>
      (
        this.configuration[listName] as IActionConfiguration[] | undefined
      )?.some(other => other !== action && other.name === name)
    );
    if (taken) {
      throw new Error(
        `Action name '${name}' already exists in actions or eventActions. Action names must be unique across actions and eventActions.`
      );
    }
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
   * Gives the timeline its own position source settings, merged over the
   * settings of its type in `timelineProviderSettings` (see
   * `ITimelineConfiguration.positionSource`).
   *
   * @param uri - URI of the timeline
   * @param positionSource - The override. Leave out `systemName` to change
   * single settings of the type's position source, or name another class to
   * replace it for this timeline. `undefined` removes the override.
   * @returns The factory
   * @throws Error when no timeline has the URI
   *
   * @example
   * ```ts
   * factory
   *   .addTimeline('intro', 'animation', 10, false, '#intro')
   *   .addTimeline('chapter-1', 'animation', 60, false, '#chapter-1')
   *   .setTimelinePositionSource('chapter-1', {
   *     systemName: 'ScrollPositionSource',
   *     selector: '#chapter-1',
   *   });
   * ```
   */
  setTimelinePositionSource(
    uri: string,
    positionSource: Partial<IPositionSourceConfig> | undefined
  ) {
    const timeline = this._requireTimeline(uri, 'setTimelinePositionSource');
    if (positionSource === undefined) {
      delete timeline.positionSource;
    } else {
      timeline.positionSource = deepCopy(positionSource);
    }
    return this;
  }

  /**
   * Gives the timeline its own container provider settings, merged over the
   * `container` settings of its type in `timelineProviderSettings` (see
   * `ITimelineConfiguration.containerProvider`).
   *
   * @param uri - URI of the timeline
   * @param containerProvider - The override, for example
   * `{selector: '#chapter-1'}`. `undefined` removes the override.
   * @returns The factory
   * @throws Error when no timeline has the URI
   */
  setTimelineContainerProvider(
    uri: string,
    containerProvider: Partial<IContainerProviderConfig> | undefined
  ) {
    const timeline = this._requireTimeline(uri, 'setTimelineContainerProvider');
    if (containerProvider === undefined) {
      delete timeline.containerProvider;
    } else {
      timeline.containerProvider = deepCopy(containerProvider);
    }
    return this;
  }

  private _requireTimeline(uri: string, methodName: string) {
    const timeline = this.configuration.timelines
      ? this.getTimeline(uri)
      : undefined;
    if (!timeline) {
      throw new Error(
        `ConfigurationFactory.${methodName}: no timeline found for uri '${uri}'`
      );
    }
    return timeline;
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
      throw new Error(`No timeline found for uri '${uri}'`);
    }
    const actionConfig = timeline.timelineActions.find(a => a.id === id);
    if (actionConfig) {
      return new TimelineActionEditor(actionConfig, this);
    }
    throw new Error(
      `Timeline action not found for id '${id}' in timeline '${uri}'`
    );
  }
}
