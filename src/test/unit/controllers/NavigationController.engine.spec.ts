import type {
  IEngineConfiguration,
  ITimelineConfiguration,
} from '@configuration/types.ts';
import {NavigationController} from '@controllers/navigation-controller.ts';
import {RoutingController} from '@controllers/routing-controller.ts';
import {Eventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/index.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactoryResult} from '@/types.ts';

/**
 * Wires NavigationController and RoutingController to an engine built by
 * EngineFactory (real Eventbus, adapters and RequestVideoUriInterceptor), so
 * the events the controllers send are the ones the engine actually handles.
 */
vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// `window.location` cannot be replaced, so the URL is set through the History API
const setUrl = (url: string) => window.history.replaceState(null, '', url);

function timeline(uri: string): ITimelineConfiguration {
  return {
    id: uri,
    uri,
    type: 'animation',
    duration: 10,
    loop: false,
    selector: '#stage',
    timelineActions: [],
  };
}

function createConfig(): IEngineConfiguration {
  return {
    id: 'navigation-wiring',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        positionSource: {systemName: 'RafPositionSource', tickInterval: 100},
        container: {systemName: 'DomContainerProvider', selector: '#stage'},
      },
    },
    containerSelector: '#engine-root',
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: '<div id="stage"></div><div id="menu"></div>',
    availableLanguages: [],
    initActions: [],
    actions: [],
    timelines: [timeline('intro'), timeline('chapter-1')],
  };
}

const createNavigationJson = () => ({
  navigationData: [
    {
      id: 'nav1',
      labelId: 'label1',
      videoUrlIndex: 0,
      timelineUri: 'intro',
      visible: true,
    },
    {
      id: 'nav2',
      labelId: 'label2',
      videoUrlIndex: 1,
      timelineUri: 'chapter-1',
      visible: true,
    },
  ],
  roots: ['nav1', 'nav2'],
});

describe('NavigationController wired to an EngineFactory engine', () => {
  let eventbus: Eventbus;
  let factory: EngineFactory;
  let result: IEngineFactoryResult | undefined;
  let navigation: NavigationController;
  let routing: RoutingController | undefined;

  beforeEach(() => {
    setUrl('/');
    $('<div id="engine-root"></div>').appendTo(document.body);
    eventbus = new Eventbus();
    factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });
    navigation = new NavigationController();
    routing = undefined;
  });

  afterEach(async () => {
    navigation.detach(eventbus);
    routing?.detach(eventbus);
    if (result) {
      await result.destroy().catch(() => {});
    }
    factory.destroy();
    $('#engine-root').remove();
    setUrl('/');
  });

  async function createEngine() {
    result = factory.createEngine(createConfig());
    await result.engine.init();
    return result.engine;
  }

  test('given an EngineFactory engine with two timelines and an attached NavigationController with two navigation items, when the second menu anchor is activated, then engine.switchTimeline is called and currentTimelineUri becomes the second timeline', async () => {
    const engine = await createEngine();
    const switchTimeline = vi.spyOn(engine, 'switchTimeline');
    navigation.init({
      selectedElement: $('#menu'),
      json: createNavigationJson(),
    });
    navigation.attach(eventbus);

    $('#nav_1').trigger('click');
    await flush();

    expect(switchTimeline).toHaveBeenCalledWith('chapter-1', 0);
    expect(engine.currentTimelineUri).toBe('chapter-1');
    expect($('#nav_1').hasClass('current-menu-item')).toBe(true);
  });

  test('given a NavigationController and a RoutingController on an engine, when the second menu item is activated, then the current entry is saved and a history entry for the second item is pushed', async () => {
    await createEngine();
    routing = new RoutingController();
    routing.init({json: createNavigationJson()});
    navigation.init({
      selectedElement: $('#menu'),
      json: createNavigationJson(),
    });
    navigation.attach(eventbus);
    routing.attach(eventbus);
    const pushState = vi.spyOn(window.history, 'pushState');

    $('#nav_1').trigger('click');
    await flush();

    expect(window.location.hash).toBe('#/nav2/0');
    expect(window.history.state).toEqual({navigationId: 'nav2', position: 0});
    expect(pushState).toHaveBeenCalledTimes(1);
  });
});
