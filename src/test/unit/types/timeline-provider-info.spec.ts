import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
  TSourceState,
} from '@timelineproviders/types.ts';
import {describe, expect, test, vi} from 'vitest';
import type {ITimelineProviderInfo} from '../../../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────────────────────────────────────

function createMockPositionSource(): IPositionSource {
  return {
    state: 'inactive' as TSourceState,
    loop: false,
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    activate: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn(),
    deactivate: vi.fn(),
    getPosition: vi.fn().mockReturnValue(0),
    getDuration: vi.fn().mockReturnValue(60),
    onPosition: vi.fn(),
    onBoundaryReached: vi.fn(),
    onActivated: vi.fn(),
  };
}

function createMockContainerProvider(): IContainerProvider {
  return {
    getContainer: vi.fn().mockReturnValue({length: 1}),
    onContainerReady: vi.fn(),
  };
}

function createMockPlaylist<T>(defaultItem?: T): IPlaylist<T> {
  return {
    currentItem: defaultItem as T,
    items: [] as readonly T[],
    selectItem: vi.fn(),
    onItemChange: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ITimelineProviderInfo (New Structure) Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ITimelineProviderInfo (new structure)', () => {
  test('given info with position source only, when accessed, then positionSource is available', () => {
    const positionSource = createMockPositionSource();

    const info: ITimelineProviderInfo = {
      positionSource,
    };

    expect(info.positionSource).toBe(positionSource);
    expect(info.containerProvider).toBeUndefined();
    expect(info.playlist).toBeUndefined();
  });

  test('given info with position source and container provider, when accessed, then both are available', () => {
    const positionSource = createMockPositionSource();
    const containerProvider = createMockContainerProvider();

    const info: ITimelineProviderInfo = {
      positionSource,
      containerProvider,
    };

    expect(info.positionSource).toBe(positionSource);
    expect(info.containerProvider).toBe(containerProvider);
    expect(info.playlist).toBeUndefined();
  });

  test('given info with all components, when accessed, then all are available', () => {
    const positionSource = createMockPositionSource();
    const containerProvider = createMockContainerProvider();
    const playlist = createMockPlaylist<{uri: string}>();

    const info: ITimelineProviderInfo = {
      positionSource,
      containerProvider,
      playlist,
    };

    expect(info.positionSource).toBe(positionSource);
    expect(info.containerProvider).toBe(containerProvider);
    expect(info.playlist).toBe(playlist);
  });

  test('given info with playlist but no container, when accessed, then playlist is available', () => {
    const positionSource = createMockPositionSource();
    const playlist = createMockPlaylist<{chapterId: string}>();

    const info: ITimelineProviderInfo = {
      positionSource,
      playlist,
    };

    expect(info.positionSource).toBe(positionSource);
    expect(info.containerProvider).toBeUndefined();
    expect(info.playlist).toBe(playlist);
  });

  test('given info, when position source methods called, then methods are accessible', () => {
    const positionSource = createMockPositionSource();

    const info: ITimelineProviderInfo = {
      positionSource,
    };

    // Verify position source interface methods are accessible
    info.positionSource.getPosition();
    info.positionSource.getDuration();
    info.positionSource.onPosition(() => {});
    info.positionSource.onBoundaryReached(() => {});
    info.positionSource.onActivated(() => {});

    expect(positionSource.getPosition).toHaveBeenCalled();
    expect(positionSource.getDuration).toHaveBeenCalled();
    expect(positionSource.onPosition).toHaveBeenCalled();
    expect(positionSource.onBoundaryReached).toHaveBeenCalled();
    expect(positionSource.onActivated).toHaveBeenCalled();
  });

  test('given info with container provider, when getContainer called, then returns container', () => {
    const positionSource = createMockPositionSource();
    const containerProvider = createMockContainerProvider();

    const info: ITimelineProviderInfo = {
      positionSource,
      containerProvider,
    };

    const container = info.containerProvider?.getContainer();

    expect(container).toBeDefined();
    expect(containerProvider.getContainer).toHaveBeenCalled();
  });

  test('given info with playlist, when selectItem called, then delegates to playlist', () => {
    const positionSource = createMockPositionSource();
    const playlist = createMockPlaylist<{uri: string}>();

    const info: ITimelineProviderInfo = {
      positionSource,
      playlist,
    };

    info.playlist?.selectItem('/video/chapter-1.mp4');

    expect(playlist.selectItem).toHaveBeenCalledWith('/video/chapter-1.mp4');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ITimelineProviderInfo Record Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Record<TimelineTypes, ITimelineProviderInfo>', () => {
  test('given record with animation provider, when accessed, then returns correct info', () => {
    const animationSource = createMockPositionSource();
    const animationContainer = createMockContainerProvider();

    const providers: Record<string, ITimelineProviderInfo> = {
      animation: {
        positionSource: animationSource,
        containerProvider: animationContainer,
      },
    };

    expect(providers.animation.positionSource).toBe(animationSource);
    expect(providers.animation.containerProvider).toBe(animationContainer);
  });

  test('given record with multiple providers, when accessed, then each has correct components', () => {
    const animationSource = createMockPositionSource();
    const videoSource = createMockPositionSource();
    const videoContainer = createMockContainerProvider();
    const videoPlaylist = createMockPlaylist<{uri: string}>();

    const providers: Record<string, ITimelineProviderInfo> = {
      animation: {
        positionSource: animationSource,
      },
      mediaplayer: {
        positionSource: videoSource,
        containerProvider: videoContainer,
        playlist: videoPlaylist,
      },
    };

    // Animation provider - minimal config
    expect(providers.animation.positionSource).toBe(animationSource);
    expect(providers.animation.containerProvider).toBeUndefined();
    expect(providers.animation.playlist).toBeUndefined();

    // Mediaplayer provider - full config
    expect(providers.mediaplayer.positionSource).toBe(videoSource);
    expect(providers.mediaplayer.containerProvider).toBe(videoContainer);
    expect(providers.mediaplayer.playlist).toBe(videoPlaylist);
  });
});
