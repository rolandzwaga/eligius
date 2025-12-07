# Quickstart: Timeline Provider Decomposition

## Overview

This feature decomposes the monolithic `ITimelineProvider` into composable interfaces:

- **IPositionSource** - Provides position updates
- **ISeekable** - Optional seeking capability
- **IPlaylist** - Multi-item management
- **IContainerProvider** - DOM container access

## Basic Usage

### Using RafPositionSource

```typescript
import { RafPositionSource } from 'eligius';

const source = new RafPositionSource({ duration: 60 });

// Register callbacks
source.onPosition((position) => {
  console.log(`Position: ${position}s`);
});

source.onBoundaryReached((boundary) => {
  if (boundary === 'end') console.log('Reached end');
});

// Lifecycle
await source.init();
await source.activate(); // Start emitting positions

// Later...
source.suspend();   // Pause (preserves position)
source.deactivate(); // Stop (resets position)
source.destroy();    // Cleanup
```

### Using VideoPositionSource

```typescript
import { VideoPositionSource } from 'eligius';

const source = new VideoPositionSource({
  selector: '#video-container',
  src: 'video.mp4',
});

source.onPosition((position) => {
  // Position from video currentTime
  console.log(`Video at: ${position}s`);
});

await source.init();
await source.activate(); // Plays video

// Seeking
if (isSeekable(source)) {
  await source.seek(30.5); // Jump to 30.5s
}
```

### Using DomContainerProvider

```typescript
import { DomContainerProvider } from 'eligius';

const container = new DomContainerProvider({ selector: '#app' });

container.onContainerReady(() => {
  const $el = container.getContainer();
  $el?.append('<div>Content loaded!</div>');
});

await container.init();
```

### Using Playlist

```typescript
import { SimplePlaylist } from 'eligius';

const playlist = new SimplePlaylist({
  items: [
    { uri: 'chapter-1', duration: 30 },
    { uri: 'chapter-2', duration: 45 },
    { uri: 'chapter-3', duration: 60 },
  ],
  identifierKey: 'uri',
});

playlist.onItemChange((item) => {
  console.log(`Now playing: ${item.uri}`);
});

playlist.selectItem('chapter-2');
console.log(playlist.currentItem); // { uri: 'chapter-2', duration: 45 }
```

## Type Guards

```typescript
import { isSeekable, type IPositionSource } from 'eligius';

function handleSeek(source: IPositionSource, position: number) {
  if (isSeekable(source)) {
    return source.seek(position);
  }
  return Promise.resolve(source.getPosition());
}
```

## Backwards Compatibility

For existing code using `ITimelineProvider`:

```typescript
import { TimelineProviderFacade, RafPositionSource, DomContainerProvider } from 'eligius';

// Create decomposed parts
const positionSource = new RafPositionSource({ duration: 60 });
const containerProvider = new DomContainerProvider({ selector: '#app' });

// Wrap in legacy facade
const provider = new TimelineProviderFacade({
  positionSource,
  containerProvider,
});

// Use legacy API
await provider.init();
await provider.start();  // Maps to activate()
provider.pause();        // Maps to suspend()
provider.stop();         // Maps to deactivate()
```

## State Mapping

| New State | Legacy `playState` |
|-----------|-------------------|
| `active` | `running` |
| `suspended` | `paused` |
| `inactive` | `stopped` |

## Configuration

```json
{
  "timelines": [
    {
      "type": "animation",
      "selector": "#timeline",
      "container": "#render-area",
      "duration": 60
    }
  ]
}
```

The optional `container` field specifies where operations render content, separate from the timeline element.

## Key Concepts

1. **Position sources are composable** - Mix and match with containers and playlists
2. **ISeekable is optional** - Use `isSeekable()` type guard before seeking
3. **State is explicit** - `active`, `suspended`, `inactive` (not play/pause/stop)
4. **Looping is internal** - Set `source.loop = true` and the source handles it
5. **Facade preserves compatibility** - Existing code continues working
