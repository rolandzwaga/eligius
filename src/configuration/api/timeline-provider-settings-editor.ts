import type {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import type {
  IContainerProviderConfig,
  IPlaylistConfig,
  IPositionSourceConfig,
  ITimelineProviderSettings,
  TTimelineProviderSettings,
} from '@configuration/types.ts';
import type {TimelineTypes} from '../../types.ts';

/**
 * Default position source system names for convenience methods.
 */
const DEFAULT_POSITION_SOURCES: Record<string, string> = {
  raf: 'RafPositionSource',
  scroll: 'ScrollPositionSource',
  video: 'VideoPositionSource',
};

/**
 * Default container provider system name.
 */
const DEFAULT_CONTAINER_PROVIDER = 'DomContainerProvider';

/**
 * Default playlist system name.
 */
const DEFAULT_PLAYLIST = 'SimplePlaylist';

export class TimelineProvidersSettingsEditor {
  constructor(
    private providersSettings: TTimelineProviderSettings,
    private configurationFactory: ConfigurationFactory
  ) {}

  /**
   * Adds a new provider for the specified timeline type.
   *
   * @param timelineType - The timeline type (e.g., 'animation', 'mediaplayer')
   * @param positionSourceSystemName - System name of the position source class (default: 'RafPositionSource')
   * @returns A TimelineProviderSettingsEditor for further configuration
   */
  addProvider(
    timelineType: TimelineTypes,
    positionSourceSystemName = 'RafPositionSource'
  ) {
    if (this.providersSettings[timelineType]) {
      throw new Error(
        `Settings for a '${timelineType}' provider already exist`
      );
    }

    const settings: ITimelineProviderSettings = {
      positionSource: {systemName: positionSourceSystemName},
    };
    this.providersSettings[timelineType] = settings;
    return new TimelineProviderSettingsEditor(
      settings,
      this,
      this.configurationFactory
    );
  }

  editProvider(timelineType: TimelineTypes) {
    if (!this.providersSettings[timelineType]) {
      throw new Error(`No settings for a '${timelineType}' provider exist yet`);
    }

    return new TimelineProviderSettingsEditor(
      this.providersSettings[timelineType] as ITimelineProviderSettings,
      this,
      this.configurationFactory
    );
  }

  next() {
    return this.configurationFactory;
  }
}

export class TimelineProviderSettingsEditor {
  constructor(
    private providerSettings: ITimelineProviderSettings,
    private providersSettingsEditor: TimelineProvidersSettingsEditor,
    private configurationFactory: ConfigurationFactory
  ) {}

  /**
   * Sets the position source configuration with full config object.
   * @param config - Position source configuration with systemName and options
   */
  setPositionSource(config: IPositionSourceConfig) {
    this.providerSettings.positionSource = config;
    return this;
  }

  /**
   * Sets the position source by system name with optional configuration.
   * @param systemName - The position source class name (e.g., 'RafPositionSource')
   * @param options - Additional options passed to the position source constructor
   */
  setPositionSourceByName(
    systemName: string,
    options?: Record<string, unknown>
  ) {
    this.providerSettings.positionSource = {
      systemName,
      ...options,
    };
    return this;
  }

  /**
   * Convenience method to set position source using shorthand type names.
   * @param type - Shorthand type ('raf', 'scroll', 'video')
   * @param options - Type-specific options
   * @deprecated Use setPositionSourceByName for explicit control
   */
  setPositionSourceType(
    type: 'raf' | 'scroll' | 'video',
    options?: {selector?: string; tickInterval?: number; poster?: string}
  ) {
    const systemName = DEFAULT_POSITION_SOURCES[type];
    if (!systemName) {
      throw new Error(`Unknown position source type: ${type}`);
    }

    this.providerSettings.positionSource = {
      systemName,
      ...options,
    };
    return this;
  }

  /**
   * Sets the container provider configuration by selector.
   * Uses DomContainerProvider by default.
   * @param selector - CSS selector for the container element
   */
  setContainer(selector: string) {
    this.providerSettings.container = {
      systemName: DEFAULT_CONTAINER_PROVIDER,
      selector,
    };
    return this;
  }

  /**
   * Sets the container provider configuration with full config object.
   * @param config - Container provider configuration with systemName
   */
  setContainerConfig(config: IContainerProviderConfig) {
    this.providerSettings.container = config;
    return this;
  }

  /**
   * Sets the container provider by system name with options.
   * @param systemName - The container provider class name
   * @param options - Additional options passed to the container provider constructor
   */
  setContainerByName(systemName: string, options: Record<string, unknown>) {
    this.providerSettings.container = {
      systemName,
      ...options,
    } as IContainerProviderConfig;
    return this;
  }

  /**
   * Sets the playlist configuration.
   * Uses SimplePlaylist by default.
   * @param items - Array of playlist items
   * @param identifierKey - Key used to identify items (default: 'uri')
   */
  setPlaylist<T>(items: readonly T[], identifierKey = 'uri') {
    this.providerSettings.playlist = {
      systemName: DEFAULT_PLAYLIST,
      items,
      identifierKey,
    } as IPlaylistConfig;
    return this;
  }

  /**
   * Sets the playlist configuration with full config object.
   * @param config - Playlist configuration with systemName
   */
  setPlaylistConfig(config: IPlaylistConfig) {
    this.providerSettings.playlist = config;
    return this;
  }

  /**
   * Sets the playlist by system name with options.
   * @param systemName - The playlist class name
   * @param options - Additional options including items and identifierKey
   */
  setPlaylistByName(
    systemName: string,
    options: {items: unknown[]; identifierKey: string; [key: string]: unknown}
  ) {
    this.providerSettings.playlist = {
      systemName,
      ...options,
    } as IPlaylistConfig;
    return this;
  }

  next() {
    return this.providersSettingsEditor;
  }

  end() {
    return this.configurationFactory;
  }
}
