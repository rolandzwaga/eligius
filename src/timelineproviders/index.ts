// =============================================================================
// DECOMPOSED INTERFACES (new architecture)
// =============================================================================

export type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
  ISeekable,
  TBoundary,
  TSourceState,
} from '@timelineproviders/types.ts';

export {isSeekable} from '@timelineproviders/types.ts';

// =============================================================================
// DECOMPOSED POSITION SOURCES (new architecture)
// =============================================================================

export {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
export type {
  KeyboardStepSourceConfig,
  TVerticalMode,
} from '@timelineproviders/position-sources/keyboard-step-source.ts';
export {KeyboardStepSource} from '@timelineproviders/position-sources/keyboard-step-source.ts';
export type {RafPositionSourceConfig} from '@timelineproviders/position-sources/raf-position-source.ts';
export {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
export type {ScrollPositionSourceConfig} from '@timelineproviders/position-sources/scroll-position-source.ts';
export {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
export type {
  VideoPositionSourceConfig,
  VideoSource,
} from '@timelineproviders/position-sources/video-position-source.ts';
export {VideoPositionSource} from '@timelineproviders/position-sources/video-position-source.ts';

// =============================================================================
// DECOMPOSED CONTAINER PROVIDERS (new architecture)
// =============================================================================

export type {DomContainerProviderConfig} from '@timelineproviders/container-providers/dom-container-provider.ts';
export {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';

// =============================================================================
// DECOMPOSED PLAYLIST (new architecture)
// =============================================================================

export type {SimplePlaylistConfig} from '@timelineproviders/playlist/simple-playlist.ts';
export {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
