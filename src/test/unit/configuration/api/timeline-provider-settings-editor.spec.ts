import type {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import {
  TimelineProviderSettingsEditor,
  TimelineProvidersSettingsEditor,
} from '@configuration/api/timeline-provider-settings-editor.ts';
import type {
  ITimelineProviderSettings,
  TTimelineProviderSettings,
} from '@configuration/types.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

type TimelineProvidersSettingsEditorSuiteContext = {
  providersSettings: TTimelineProviderSettings;
  mockFactory: ConfigurationFactory;
  providersEditor: TimelineProvidersSettingsEditor;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<TimelineProvidersSettingsEditorSuiteContext>('TimelineProvidersSettingsEditor', () => {
  beforeEach(context => {
    withContext<TimelineProvidersSettingsEditorSuiteContext>(context);

    context.providersSettings = {};
    context.mockFactory = {} as ConfigurationFactory;
    context.providersEditor = new TimelineProvidersSettingsEditor(
      context.providersSettings,
      context.mockFactory
    );
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should add a new animation provider with RafPositionSource by default', context => {
    // given
    const {providersEditor, providersSettings} = context;

    // test
    providersEditor.addProvider('animation');

    // expect
    expect(providersSettings.animation).toBeDefined();
    expect(providersSettings.animation?.positionSource.systemName).toBe(
      'RafPositionSource'
    );
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should add a new provider with custom position source systemName', context => {
    // given
    const {providersEditor, providersSettings} = context;

    // test
    providersEditor.addProvider('animation', 'ScrollPositionSource');

    // expect
    expect(providersSettings.animation).toBeDefined();
    expect(providersSettings.animation?.positionSource.systemName).toBe(
      'ScrollPositionSource'
    );
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should throw an error when adding a duplicate provider', context => {
    // given
    const {providersEditor} = context;
    providersEditor.addProvider('animation');

    // expect
    expect(() => providersEditor.addProvider('animation')).toThrow(
      "Settings for a 'animation' provider already exist"
    );
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should edit an existing provider', context => {
    // given
    const {providersEditor} = context;
    providersEditor.addProvider('animation');

    // test
    const editor = providersEditor.editProvider('animation');

    // expect
    expect(editor).toBeInstanceOf(TimelineProviderSettingsEditor);
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should throw an error when editing a non-existent provider', context => {
    // given
    const {providersEditor} = context;

    // expect
    expect(() => providersEditor.editProvider('animation')).toThrow(
      "No settings for a 'animation' provider exist yet"
    );
  });

  test<TimelineProvidersSettingsEditorSuiteContext>('should return the configuration factory from next()', context => {
    // given
    const {providersEditor, mockFactory} = context;

    // test
    const result = providersEditor.next();

    // expect
    expect(result).toBe(mockFactory);
  });
});

type TimelineProviderSettingsEditorSuiteContext = {
  providerSettings: ITimelineProviderSettings;
  providersEditor: TimelineProvidersSettingsEditor;
  mockFactory: ConfigurationFactory;
  editor: TimelineProviderSettingsEditor;
} & TestContext;

describe<TimelineProviderSettingsEditorSuiteContext>('TimelineProviderSettingsEditor', () => {
  beforeEach(context => {
    withContext<TimelineProviderSettingsEditorSuiteContext>(context);

    context.providerSettings = {
      positionSource: {systemName: 'RafPositionSource'},
    };
    context.mockFactory = {} as ConfigurationFactory;
    context.providersEditor = {
      next: () => context.mockFactory,
    } as unknown as TimelineProvidersSettingsEditor;
    context.editor = new TimelineProviderSettingsEditor(
      context.providerSettings,
      context.providersEditor,
      context.mockFactory
    );
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set the position source config with systemName', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor.setPositionSource({
      systemName: 'ScrollPositionSource',
      selector: '.scroll-target',
    });

    // expect
    expect(providerSettings.positionSource.systemName).toBe(
      'ScrollPositionSource'
    );
    expect((providerSettings.positionSource as any).selector).toBe(
      '.scroll-target'
    );
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set position source by name with options', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor.setPositionSourceByName('ScrollPositionSource', {
      selector: '.scroll-container',
    });

    // expect
    expect(providerSettings.positionSource.systemName).toBe(
      'ScrollPositionSource'
    );
    expect((providerSettings.positionSource as any).selector).toBe(
      '.scroll-container'
    );
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set position source type using shorthand (deprecated)', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor.setPositionSourceType('scroll', {selector: '.scroll-container'});

    // expect
    expect(providerSettings.positionSource.systemName).toBe(
      'ScrollPositionSource'
    );
    expect((providerSettings.positionSource as any).selector).toBe(
      '.scroll-container'
    );
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set tickInterval for raf position source', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor.setPositionSourceType('raf', {tickInterval: 100});

    // expect
    expect(providerSettings.positionSource.systemName).toBe(
      'RafPositionSource'
    );
    expect((providerSettings.positionSource as any).tickInterval).toBe(100);
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set the container selector with default systemName', context => {
    // given
    const {editor, providerSettings} = context;
    const selector = '.my-container';

    // test
    editor.setContainer(selector);

    // expect
    expect(providerSettings.container).toBeDefined();
    expect(providerSettings.container?.systemName).toBe('DomContainerProvider');
    expect(providerSettings.container?.selector).toBe(selector);
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set the container config with systemName', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor.setContainerConfig({
      systemName: 'DomContainerProvider',
      selector: '.another-container',
    });

    // expect
    expect(providerSettings.container?.systemName).toBe('DomContainerProvider');
    expect(providerSettings.container?.selector).toBe('.another-container');
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set the playlist with default systemName', context => {
    // given
    const {editor, providerSettings} = context;
    const items = [{uri: '/video1.mp4'}, {uri: '/video2.mp4'}];

    // test
    editor.setPlaylist(items, 'uri');

    // expect
    expect(providerSettings.playlist).toBeDefined();
    expect(providerSettings.playlist?.systemName).toBe('SimplePlaylist');
    expect(providerSettings.playlist?.items).toEqual(items);
    expect(providerSettings.playlist?.identifierKey).toBe('uri');
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should set the playlist config with systemName', context => {
    // given
    const {editor, providerSettings} = context;
    const playlistConfig = {
      systemName: 'SimplePlaylist',
      items: [{chapterId: 'ch1'}, {chapterId: 'ch2'}],
      identifierKey: 'chapterId',
    };

    // test
    editor.setPlaylistConfig(playlistConfig);

    // expect
    expect(providerSettings.playlist).toEqual(playlistConfig);
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should return the providers settings editor from next()', context => {
    // given
    const {editor, providersEditor} = context;

    // test
    const result = editor.next();

    // expect
    expect(result).toBe(providersEditor);
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should return the configuration factory from end()', context => {
    // given
    const {editor, mockFactory} = context;

    // test
    const result = editor.end();

    // expect
    expect(result).toBe(mockFactory);
  });

  test<TimelineProviderSettingsEditorSuiteContext>('should chain multiple setters', context => {
    // given
    const {editor, providerSettings} = context;

    // test
    editor
      .setPositionSourceType('raf')
      .setContainer('.container')
      .setPlaylist([{uri: '/a.mp4'}]);

    // expect
    expect(providerSettings.positionSource.systemName).toBe(
      'RafPositionSource'
    );
    expect(providerSettings.container?.selector).toBe('.container');
    expect(providerSettings.playlist?.items).toHaveLength(1);
  });
});
